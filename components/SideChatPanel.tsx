import React, { useState, useEffect, useRef } from 'react';
import { useAgentStream, AgentMessage } from '../hooks/useAgentStream'; // 导入新 Hook
import { User } from '../types/auth';
import { processFileToText } from '@/utils/fileProcessor';

interface Props {
  user: User;
}

interface AttachedFile {
  name: string;
  content: string;
  size: number;
}

export const SideChatPanel: React.FC<Props> = ({ user }) => {
  const [conversationId] = useState(`ide-agent-${user.id}-${Date.now()}`);
  const [input, setInput] = useState('');

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 使用新的 Agent Hook
  const { messages, sendMessage, isLoading, currentStep } = useAgentStream();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, currentStep, attachedFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments: AttachedFile[] = [];

      // 设置 loading 状态防止用户重复提交（可选优化）
      // setIsProcessingFile(true); 

      for (const file of files) {
        // 稍微放宽大小限制，因为 PDF 可能会大一些
        if (file.size > 5 * 1024 * 1024) { // 5MB
          alert(`文件 ${file.name} 太大，请上传小于 5MB 的文件`);
          continue;
        }

        try {
          // ✨ 核心修改：调用统一的处理函数，自动识别 PDF/Text
          const content = await processFileToText(file);
          
          newAttachments.push({
            name: file.name,
            content: content,
            size: file.size
          });
        } catch (err) {
          console.error(`读取/解析文件 ${file.name} 失败`, err);
          alert(`无法解析文件 ${file.name}，请确保格式正确。`);
        }
      }

      setAttachedFiles(prev => [...prev, ...newAttachments]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const question = input;
    // 构造注入上下文
    let injectedContext = null;
    
    if (attachedFiles.length > 0) {
      // 构造成后端 AgenticExecutor 期望的格式
      const filesMap: Record<string, { type: string; content: string }> = {};
      attachedFiles.forEach(f => {
        filesMap[f.name] = {
          type: 'full_content',
          content: f.content
        };
      });

      injectedContext = {
        files: filesMap,
        // 如果有其他 schema 信息也可以在这里加
      };
    }

    // 清空输入和文件
    setInput('');
    setAttachedFiles([]);

    // 发送
    await sendMessage(question, conversationId, 'ACT', injectedContext);
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
            <p className="mt-1 text-xs text-gray-600">尝试： "使用odlphindb脚本帮我生成量价因子,并保存到factor.dos里"</p>
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

      {/* ✨ 3. 上下文暂存区 (Staging Area) */}
      {attachedFiles.length > 0 && (
        <div className="px-3 pt-2 bg-[#252526] border-t border-black">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 bg-[#3c3c3c] text-xs text-gray-300 px-2 py-1 rounded border border-gray-600 animate-in fade-in zoom-in duration-200"
              >
                {/* 文件图标 */}
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="max-w-[150px] truncate">{file.name}</span>
                {/* 删除按钮 */}
                <button 
                  onClick={() => removeFile(idx)}
                  className="hover:text-red-400 ml-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 输入框区 */}
      <div className="p-3 bg-[#252526] border-t border-black shrink-0">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isLoading ? "Agent is working..." : "Ask Agent to do something..."}
            className="w-full bg-[#3c3c3c] text-white rounded p-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 scrollbar-none disabled:opacity-50"
          />
          {/* ✨ 上传按钮 (左下角) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="absolute top-2 left-2 p-1 text-gray-400 hover:text-white transition-colors"
            title="Upload Context (Files)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          {/* 隐藏的文件输入框 */}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            onChange={handleFileSelect}
            // 限制文件类型 (可选)
            // accept=".dos,.txt,.py,.md,.csv,.json"
          />

          {/* 发送按钮 (右下角) */}
          <button 
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className={`absolute bottom-2 right-2 p-1.5 rounded transition-colors ${
              (input.trim() || attachedFiles.length > 0) && !isLoading 
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