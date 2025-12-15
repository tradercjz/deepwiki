import React, { useState, useEffect, useRef } from 'react';
import { useAgentStream, AgentMessage } from '../hooks/useAgentStream'; // 导入新 Hook
import { User } from '../types/auth';

interface Props {
  user: User;
}

export const SideChatPanel: React.FC<Props> = ({ user }) => {
  const [conversationId] = useState(`ide-agent-${user.id}-${Date.now()}`);
  const [input, setInput] = useState('');
  
  // 使用新的 Agent Hook
  const { messages, sendMessage, isLoading, currentStep } = useAgentStream();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, currentStep]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const question = input;
    setInput('');

    // 发送请求：默认使用 ACT 模式
    // 可以在这里注入当前编辑器选中的代码作为 context，暂时传 null
    await sendMessage(question, conversationId, 'ACT', null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 渲染消息内容的辅助函数 (支持 Markdown 或简单的换行)
  const renderContent = (content: string) => {
    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-black text-gray-300 font-sans">
      {/* 1. 标题区 */}
      <div className="h-10 border-b border-black flex items-center px-4 bg-[#252526] shrink-0 justify-between">
        <div className="flex items-center">
          <span className="font-bold text-sm">AI Copilot</span>
          <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded ml-2">Agent</span>
        </div>
        {/* 如果正在加载，显示当前步骤 */}
        {isLoading && (
          <span className="text-xs text-yellow-500 animate-pulse truncate max-w-[150px]">
            {currentStep}
          </span>
        )}
      </div>

      {/* 2. 消息列表区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-gray-700">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>👋 Hi, 我是你的 DolphinDB 智能代理。</p>
            <p className="mt-2 text-xs">我可以帮你查询表结构、生成代码并执行。</p>
            <p className="mt-1 text-xs text-gray-600">尝试： "帮我查一下库里的表，并统计行数"</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* 消息气泡 */}
            <div 
              className={`max-w-[95%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#333333] text-gray-200 border border-gray-700'
              }`}
            >
              {/* 如果是 Assistant，且有 Steps，可以渲染一些简略信息 */}
              {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-600 text-xs text-gray-400 space-y-1">
                  {msg.steps.filter(s => s.type === 'action').map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-1">
                      <span className="text-blue-400">⚡ 工具:</span> 
                      <span>{step.toolName}</span>
                      <span className={step.status === 'success' ? 'text-green-500' : 'text-yellow-500'}>
                        {step.status === 'success' ? '✔' : '...'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 核心内容 */}
              {msg.content ? renderContent(msg.content) : (
                msg.role === 'assistant' && <span className="text-gray-500 italic">Thinking...</span>
              )}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 输入框区 */}
      <div className="p-3 bg-[#252526] border-t border-black shrink-0">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isLoading ? "Agent is working..." : "Ask Agent to do something..."}
            className="w-full bg-[#3c3c3c] text-white rounded p-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 scrollbar-none disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`absolute bottom-2 right-2 p-1.5 rounded transition-colors ${
              input.trim() && !isLoading 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};