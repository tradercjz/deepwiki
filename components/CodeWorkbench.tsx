import React, { useEffect, useState } from 'react';
import { cloudApi } from '../api/client';
import { getSafeUsername } from '../utils/format';
import { User } from '../types/auth';
import { SideChatPanel } from './SideChatPanel'; // 导入刚写的组件

interface Props {
  user: User;
  onClose: () => void;
}

export const CodeWorkbench: React.FC<Props> = ({ user, onClose }) => {
  const [status, setStatus] = useState<'loading' | 'creating' | 'ready' | 'error'>('loading');
  const [iframeUrl, setIframeUrl] = useState('');
  
  // 新增状态：控制侧边栏显示
  const [isChatOpen, setIsChatOpen] = useState(true);

  const usernameSlug = getSafeUsername(user.email);

  useEffect(() => {
    checkAndLaunch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndLaunch = async () => {
    try {
      const { status } = await cloudApi.getStatus();
      if (status === 'running') {
        constructUrlAndShow();
      } else {
        setStatus('creating');
        await cloudApi.create();
        pollUntilReady();
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const pollUntilReady = async () => {
    const interval = setInterval(async () => {
      try {
        const { status } = await cloudApi.getStatus();
        if (status === 'running') {
          clearInterval(interval);
          constructUrlAndShow();
        }
      } catch (e) {}
    }, 3000);
  };

  const constructUrlAndShow = () => {
    const token = localStorage.getItem('auth_token');
    // 确保 URL 带有斜杠
    const url = `https://chat.dolphindb.cloud/code/${usernameSlug}/?token=${token}`;
    setIframeUrl(url);
    setStatus('ready');
  };

  // --- Loading / Error 视图保持不变 ---
  if (status === 'loading' || status === 'creating') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#1e1e1e] text-white flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-lg font-medium">
          {status === 'creating' ? '正在为您初始化 DolphinDB 云环境 (预计 30秒)...' : '正在连接云环境...'}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-white underline text-sm mt-4">取消</button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#1e1e1e] text-white flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl mb-4">连接环境失败</div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">返回</button>
      </div>
    );
  }

  // --- Ready: Split Layout ---
  return (
    <div className="fixed inset-0 z-[100] bg-[#1e1e1e] flex flex-col">
      {/* 1. 顶部状态栏 */}
      <div className="h-9 bg-[#3c3c3c] border-b border-black flex justify-between items-center px-4 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center text-gray-300 text-xs">
            <span className="font-bold text-blue-400 mr-2">DolphinDB</span> 
            Cloud Workbench (注意:测试阶段，云环境数据会丢失)- {usernameSlug}
          </div>
          
          {/* 切换侧边栏按钮 */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`text-xs px-2 py-0.5 rounded border border-gray-600 transition-colors ${
              isChatOpen ? 'bg-blue-600/30 text-blue-200 border-blue-500/50' : 'bg-[#252526] text-gray-400'
            }`}
          >
            {isChatOpen ? 'Collapse Chat' : 'Expand Chat'}
          </button>
        </div>

        <button 
          onClick={onClose} 
          className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition-colors"
        >
          Exit
        </button>
      </div>
      
      {/* 2. 主体区域：Flex Row 布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 左侧：聊天面板 */}
        <div 
          className={`transition-all duration-300 ease-in-out border-r border-black bg-[#1e1e1e] ${
            isChatOpen ? 'w-[350px] opacity-100' : 'w-0 opacity-0 overflow-hidden'
          }`}
        >
          <SideChatPanel user={user} />
        </div>

        {/* 右侧：CodeServer Iframe */}
        <div className="flex-1 relative bg-[#1e1e1e]">
          <iframe 
            src={iframeUrl}
            title="DolphinDB Workbench"
            className="w-full h-full border-none block"
            allow="clipboard-read; clipboard-write;"
          />
          
          {/* 当侧边栏关闭时，给一个悬浮按钮方便打开 (可选) */}
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="absolute top-4 left-0 z-10 bg-[#252526] border border-l-0 border-gray-600 text-gray-400 p-2 rounded-r hover:text-white shadow-lg"
              title="Open AI Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};