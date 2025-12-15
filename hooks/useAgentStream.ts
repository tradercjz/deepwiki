import { useState, useCallback, useRef } from 'react';
import { agentApi } from '../api/client';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  // 可选：用于展示 Agent 的思考过程或工具调用状态
  steps?: AgentStep[]; 
}

export interface AgentStep {
  type: 'thought' | 'action' | 'observation' | 'error';
  content: string;
  toolName?: string;
  status?: 'pending' | 'success' | 'failed';
}

export const useAgentStream = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>(''); // 当前正在做什么 (e.g. "正在查询数据库...")
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    question: string,
    conversationId: string,
    mode: 'ACT' | 'PLAN' = 'ACT',
    injectedContext: object | null = null
  ) => {
    setIsLoading(true);
    setCurrentStep('正在思考...');
    
    // 1. 乐观更新：立即显示用户问题
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    // 2. 准备 FormData
    const formData = new FormData();
    formData.append('question', question);
    formData.append('conversation_id', conversationId);
    formData.append('mode', mode);
    if (injectedContext) {
      formData.append('injected_context', JSON.stringify(injectedContext));
    }

    // 3. 准备接收 Assistant 的回答
    let assistantMessageContent = '';
    // 先占位一个 Assistant 消息
    setMessages(prev => [...prev, { role: 'assistant', content: '', steps: [] }]);

    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(agentApi.chatEndpoint, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // 保留未完成的部分

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr.trim() === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              handleAgentEvent(data, (newContent) => {
                assistantMessageContent = newContent;
              });
            } catch (e) {
              console.error('JSON parse error', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Stream error:', error);
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: `❌ Error: ${error.message}` }
        ]);
      }
    } finally {
      setIsLoading(false);
      setCurrentStep('');
      abortControllerRef.current = null;
    }

    // --- 内部帮助函数：处理不同类型的 Agent 事件 ---
    function handleAgentEvent(data: any, updateContent: (c: string) => void) {
      // 这里的 data 对应后端的 AnyTaskStatus 联合类型
      setMessages(prev => {
        const newHistory = [...prev];
        const lastMsg = newHistory[newHistory.length - 1];
        if (lastMsg.role !== 'assistant') return prev;

        // 初始化 steps 数组
        if (!lastMsg.steps) lastMsg.steps = [];

        switch (data.subtype) {
          case 'react_thought':
            setCurrentStep('思考中...');
            lastMsg.steps.push({ type: 'thought', content: data.thought });
            break;

          case 'react_action':
            setCurrentStep(`正在执行工具: ${data.tool_name}...`);
            lastMsg.steps.push({ 
              type: 'action', 
              content: JSON.stringify(data.tool_args), 
              toolName: data.tool_name,
              status: 'pending' 
            });
            break;

          case 'react_observation':
            // 找到最后一个 action 并标记完成
            const lastAction = lastMsg.steps.filter(s => s.type === 'action').pop();
            if (lastAction) lastAction.status = data.is_error ? 'failed' : 'success';
            
            lastMsg.steps.push({ 
              type: 'observation', 
              content: data.observation,
              status: data.is_error ? 'failed' : 'success'
            });
            break;

          case 'react_thought_slice': 
            // 这是流式输出的文本片段（回答内容）
            setCurrentStep('正在回复...');
            lastMsg.content += data.chunk;
            updateContent(lastMsg.content);
            break;
            
          case 'task_end':
            setCurrentStep('');
            if (!data.success) {
               lastMsg.content += `\n\n[任务终止: ${data.final_message}]`;
            }
            break;
            
          case 'error':
             lastMsg.steps.push({ type: 'error', content: data.error_details });
             break;
        }
        return newHistory;
      });
    }

  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setCurrentStep('');
    }
  }, []);

  return { messages, sendMessage, isLoading, currentStep, stopStream };
};