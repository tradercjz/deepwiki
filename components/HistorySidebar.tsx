import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { historyManager } from "../utils/historyManager";
import { useAuth } from '../context/AuthContext';
import { historyApi } from '../api/client';
import { COLORS } from '../constants';
import { ConfirmModal } from "./ConfirmModal";

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
  generatingId: string | null;
  currentChat: { id: string; title: string; timestamp: number } | null;
  streamingChat: { id: string; title: string; timestamp: number } | null;
}

// 一个简单的 Loading 动画组件 (三点跳动)
const GeneratingIndicator = () => (
  <div className="flex space-x-1 items-center ml-2">
    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
  </div>
);

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  isPinned, 
  onTogglePin, 
  onClose,
  generatingId,
  currentChat,
  streamingChat
}) => {
  const { user } = useAuth(); // 获取登录用户
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 删除弹窗相关的 State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // 控制按钮 loading
  
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

        // 强制按时间倒序排序
        mapped.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setItems(mapped);
      } catch (e) {
        console.error("Failed to load cloud history", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- 未登录：加载本地数据 ---
      const localData = historyManager.getHistory();
      localData.sort((a, b) => b.timestamp - a.timestamp);
      setItems(localData);
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 阻止冒泡，防止触发点击进入对话

    // 1. 确认删除
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    // 记录要删除的 ID 是否是当前正在查看的 ID
    const isCurrentChat = conversationId === id;

    if (user) {
      // --- 情况 A: 已登录 (调用 API) ---
      try {
        // 乐观更新：先从 UI 移除，让用户感觉很快
        const originalItems = [...items];
        setItems(prev => prev.filter(item => item.id !== id));

        // 调用接口
        await historyApi.delete(id);
        
        // 如果 API 失败了，是不是要回滚？通常对于删除操作，
        // 除非网络极差，否则不需要太复杂的 rollback，报错提示即可。
      } catch (err) {
        console.error("Failed to delete cloud conversation", err);
        alert("Failed to delete conversation from cloud.");
        loadHistory(); // 失败后重新拉取列表以恢复
        return; 
      }
    } else {
      // --- 情况 B: 游客 (操作 LocalStorage) ---
      historyManager.deleteConversation(id);
      // 更新 UI
      setItems(prev => prev.filter(item => item.id !== id));
    }

    // 3. 后置处理：如果删除了当前正在看的对话，跳回主页
    if (isCurrentChat) {
      navigate('/');
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

  const handleClearAll = () => {
    if (user) {
      alert("Clearing cloud history is coming soon.");
    } else {
      if (confirm("Clear all local history?")) {
        historyManager.clearAll();
      }
    }
  };

  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  // ✨ [新增] 真正的执行删除逻辑 (从原来的 handleDelete 改造而来)
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    setIsDeleting(true);
    const id = deleteTargetId;
    const isCurrentChat = conversationId === id;

    try {
      if (user) {
        // --- 登录模式 ---
        // 乐观更新：先从 UI 移除
        setItems(prev => prev.filter(item => item.id !== id));
        // 调用 API
        await historyApi.delete(id);
      } else {
        // --- 游客模式 ---
        historyManager.deleteConversation(id);
        setItems(prev => prev.filter(item => item.id !== id));
      }

      // 如果删除了当前对话，跳回主页
      if (isCurrentChat) {
        navigate('/');
      }

      // 关闭弹窗
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed, please try again."); // 只有真正出错才弹系统窗
      loadHistory(); // 回滚数据
    } finally {
      setIsDeleting(false);
    }
  };

  const displayItems = useMemo(() => {
    // 1. 复制现有列表 (来自 API 或 本地存储)
    let finalItems = [...items];

    // 定义一个辅助函数：尝试插入或更新 item
    const mergeItem = (itemToMerge: { id: string; title: string; timestamp: number }) => {
      const index = finalItems.findIndex(i => i.id === itemToMerge.id);
      if (index === -1) {
        // 不在列表中 -> 插到最前面
        finalItems.unshift({
          id: itemToMerge.id,
          title: itemToMerge.title,
          timestamp: itemToMerge.timestamp
        });
      } else {
        // 在列表中 -> 更新信息 (比如标题可能变了，或者时间戳更新了)
        finalItems[index] = {
            ...finalItems[index],
            title: itemToMerge.title, // 优先用最新的标题
            timestamp: Math.max(Number(finalItems[index].timestamp), itemToMerge.timestamp)
        };
      }
    };

    // 2. 合并“后台正在生成的对话” (优先级高，确保它一定显示)
    if (streamingChat) {
        mergeItem(streamingChat);
    }

    // 3. 合并“当前正在看的对话” (防止 API 还没返回当前对话)
    if (currentChat) {
        // 如果 currentChat 和 streamingChat 是同一个，这里会走 update 逻辑，没问题
        mergeItem(currentChat);
    }

    // 4. 再次排序，确保最新的在最上面 (不管是插入的还是更新的)
    finalItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return finalItems;
  }, [items, currentChat, streamingChat]);



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
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-gray-400 dark:text-gray-600 text-sm gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>No history yet.</span>
            </div>
          ) : (
            displayItems.map((item) => (
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
                {generatingId === item.id && (
                        <GeneratingIndicator />
                    )}

                {/* 时间 (可选)
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(item.timestamp).toLocaleDateString()} 
                  {' ' + new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div> */}

                {/* Delete Button (仅当鼠标 Hover 且未加载时显示) */}
                {!isLoading && (
                    <button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止冒泡：防止触发 handleSelect
                      handleRequestDelete(e, item.id);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete conversation"
                    // ⚠️ 关键：之前这里可能有 disabled={!!user}，一定要删掉！
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
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
};