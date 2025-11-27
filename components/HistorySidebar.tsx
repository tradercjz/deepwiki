import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { historyManager, HistoryItem } from "../utils/historyManager";
import { DolphinIcon } from "./icons/DolphinIcon";
import { PinIcon } from './icons/PinIcon'; 

interface HistorySidebarProps {
  isOpen: boolean;
  isPinned: boolean; 
  onTogglePin: () => void;
  onClose: () => void;
  onNewChat: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  isPinned, 
  onTogglePin, 
  onClose
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();
  const { conversationId } = useParams();

  // 加载历史记录
  const loadHistory = () => {
    setHistory(historyManager.getHistory());
  };

  useEffect(() => {
    loadHistory();

    // 监听自定义事件，实现跨组件状态同步
    const handleStorageChange = () => loadHistory();
    window.addEventListener("history-updated", handleStorageChange);

    return () => {
      window.removeEventListener("history-updated", handleStorageChange);
    };
  }, []);

  const handleSelect = (id: string) => {
    navigate(`/search/${id}`);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this chat from history?')) {
      historyManager.deleteConversation(id);
      if (conversationId === id) navigate('/');
    }
  };

  return (
    <>
      {/* 遮罩层 (移动端) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏主体 */}
      <div
        className={`
        fixed top-0 bottom-0 left-0 z-40
        w-64 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
           
            <span>History</span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto md:hidden p-2 text-gray-500"
          >
            ✕
          </button>
        </div>


        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-10">
              No history yet.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`
                  group relative flex items-center px-3 py-3 text-sm rounded-lg cursor-pointer transition-colors
                  ${
                    conversationId === item.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                  }
                `}
              >
                <span className="truncate pr-6">{item.title}</span>

                {/* Delete Button (Hover only) */}
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              if (confirm("Clear all history?")) historyManager.clearAll();
            }}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            Clear all history
          </button>
        </div>
      </div>
    </>
  );
};
