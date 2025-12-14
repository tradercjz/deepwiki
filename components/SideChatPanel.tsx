import React, { useState, useEffect, useRef } from 'react';
import { useRAGStream } from '../hooks/useRAGStream';
import { historyApi } from '../api/client';
import { User } from '../types/auth';

interface Props {
  user: User;
}

export const SideChatPanel: React.FC<Props> = ({ user }) => {
  // 为 IDE 环境创建一个固定的或临时的会话 ID
  // 也可以选择每次进入都创建一个新的，或者读取最近的一个
  const [conversationId] = useState(`ide-${user.id}-${Date.now()}`);
  const [input, setInput] = useState('');
  
  // 简单的本地消息状态，用于 UI 展示
  // { role: 'user' | 'assistant', content: string }
  const [messages, setMessages] = useState<any[]>([]);
  
  // 复用核心 Hook
  const { startStream, isLoading, currentAnswer, error } = useRAGStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAnswer, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const question = input;
    setInput('');

    // 1. UI 立即显示用户问题
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    // 2. 发起请求
    try {
      await startStream(
        question,
        conversationId,
        (fullAnswer, sources) => {
          // 3. 流结束后，将完整回答加入历史
          setMessages(prev => [...prev, { role: 'assistant', content: fullAnswer }]);
        },
        [] // 暂不支持图片，后续可扩展
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-black text-gray-300 font-sans">
      {/* 1. 标题区 */}
      <div className="h-10 border-b border-black flex items-center px-4 bg-[#252526] shrink-0">
        <span className="font-bold text-sm">AI Copilot</span>
        <span className="text-xs text-gray-500 ml-2">Chat Mode</span>
      </div>

      {/* 2. 消息列表区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-gray-700">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>👋 Hi, 我是你的 DolphinDB 编程助手。</p>
            <p className="mt-2 text-xs">尝试问我："如何连接 DFS 数据库？"</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[90%] rounded-lg px-3 py-2 whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#333333] text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 正在生成的流式回答 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-lg px-3 py-2 bg-[#333333] text-gray-200 whitespace-pre-wrap border border-blue-500/30">
              {currentAnswer}
              <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle"></span>
            </div>
          </div>
        )}
        
        {error && <div className="text-red-500 text-xs px-2">{error}</div>}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 输入框区 */}
      <div className="p-3 bg-[#252526] border-t border-black shrink-0">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI about DolphinDB..."
            className="w-full bg-[#3c3c3c] text-white rounded p-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 scrollbar-none"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`absolute bottom-2 right-2 p-1.5 rounded transition-colors ${
              input.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};