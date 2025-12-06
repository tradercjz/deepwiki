import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { historyManager } from "../utils/historyManager";
import { useAuth } from '../context/AuthContext';
import { historyApi } from '../api/client';
import { COLORS } from '../constants';

// 图标组件
const PinIcon = ({ filled }: { filled: boolean }) => (
  <svg 
    width="18" height="18" viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="transform rotate-45"
  >
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>
);

// 统一的数据结构，用于渲染
interface UnifiedHistoryItem {
  id: string;
  title: string;
  timestamp: number | string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  isPinned: boolean; 
  onTogglePin: () => void;
  onClose: () => void;
  onNewChat?: () => void; // Optional
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  isPinned, 
  onTogglePin, 
  onClose
}) => {
  const { user } = useAuth(); // 获取登录用户
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { conversationId } = useParams();

  // 核心：加载历史记录逻辑
  const loadHistory = async () => {
    if (user) {
      // --- 已登录：加载云端数据 ---
      setIsLoading(true);
      try {
        const cloudData = await historyApi.list();
        // 映射为统一结构
        const mapped = cloudData.map(item => ({
          id: item.id,
          title: item.title,
          timestamp: item.updated_at // 云端是 ISO String
        }));
        setItems(mapped);
      } catch (e) {
        console.error("Failed to load cloud history", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- 未登录：加载本地数据 ---
      const localData = historyManager.getHistory();
      setItems(localData);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();

    // 监听两个事件：
    // 1. 'history-updated': 本地数据变动（如新建对话）或 AuthContext 触发的刷新
    // 2. user 变化: 登录/登出切换时触发
    const handleStorageChange = () => loadHistory();
    window.addEventListener("history-updated", handleStorageChange);

    return () => {
      window.removeEventListener("history-updated", handleStorageChange);
    };
  }, [user]); // 依赖 user，切换账号自动刷新

  const handleSelect = (id: string) => {
    navigate(`/search/${id}`);
    // 如果是移动端或未固定状态，选择后关闭侧边栏
    if (window.innerWidth < 768 || (!isPinned && window.innerWidth >= 768)) {
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // 目前仅支持删除本地历史，云端删除接口如果还没写，暂时屏蔽或提示
    if (!user) {
      if (confirm('Delete this chat from local history?')) {
        historyManager.deleteConversation(id);
        // 如果删除的是当前对话，跳回主页
        if (conversationId === id) navigate('/');
      }
    } else {
      // TODO: 对接云端删除接口
      alert("Deleting cloud history is coming soon.");
    }
  };

  const handleClearAll = () => {
    if (user) {
      alert("Clearing cloud history is coming soon.");
    } else {
      if (confirm("Clear all local history?")) {
        historyManager.clearAll();
      }
    }
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏主体 */}
      <div
        className={`
        fixed top-0 bottom-0 left-0 z-40
        w-64 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        flex flex-col shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
             <span>History</span>
             {/* 状态标签 */}
             <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
               user 
                 ? 'border-blue-500 text-blue-500 bg-blue-500/10' 
                 : 'border-gray-400 text-gray-400 bg-gray-500/10'
             }`}>
               {user ? 'CLOUD' : 'LOCAL'}
             </span>
          </div>

          <div className="flex items-center gap-1">
            {/* 固定按钮 (仅桌面端显示) */}
            <button 
              onClick={onTogglePin}
              className={`hidden md:flex p-1.5 rounded-md transition-colors ${
                isPinned 
                  ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <PinIcon filled={isPinned} />
            </button>
            
            {/* 关闭按钮 (仅移动端显示) */}
            <button
              onClick={onClose}
              className="md:hidden p-2 text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-gray-400 dark:text-gray-600 text-sm gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>No history yet.</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`
                  group relative flex flex-col px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                  ${
                    conversationId === item.id
                      ? "bg-white dark:bg-slate-800 shadow-sm border-gray-200 dark:border-gray-700"
                      : "hover:bg-gray-200/50 dark:hover:bg-slate-800/50 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                {/* 标题 */}
                <div className={`text-sm font-medium truncate pr-6 ${
                   conversationId === item.id ? 'text-blue-600 dark:text-blue-400' : ''
                }`}>
                  {item.title}
                </div>

                {/* 时间 (可选) */}
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(item.timestamp).toLocaleDateString()} 
                  {' ' + new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>

                {/* Delete Button (仅当鼠标 Hover 且未加载时显示) */}
                {!isLoading && (
                   <button
                   onClick={(e) => handleDelete(e, item.id)}
                   className="absolute right-2 top-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   title={user ? "Delete (Not available for cloud yet)" : "Delete"}
                   disabled={!!user} // 暂时禁用云端删除
                 >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <polyline points="3 6 5 6 21 6"></polyline>
                     <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                   </svg>
                 </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50">
          <button
            onClick={handleClearAll}
            className={`w-full text-xs flex items-center justify-center gap-2 py-2 rounded transition-colors ${
                user 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
            }`}
          >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
             {user ? 'Cloud History' : 'Clear all local history'}
          </button>
        </div>
      </div>
    </>
  );
};