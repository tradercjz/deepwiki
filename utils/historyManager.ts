export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

const STORAGE_KEY = "dolphin_rag_history";

export const historyManager = {
  // 获取所有历史
  getHistory: (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const history = stored ? JSON.parse(stored) : [];
      // 读取时也排个序，双重保险
      return history.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Failed to parse history", e);
      return [];
    }
  },

  // 添加或更新一条历史
  saveConversation: (id: string, question: string) => {
    try {
      const history = historyManager.getHistory();

      // 生成标题：截取前 30 个字符
      let title = question.trim();
      if (title.length > 30) {
        title = title.substring(0, 30) + "...";
      }
      if (!title) title = "New Conversation";

      const newItem: HistoryItem = {
        id,
        title,
        timestamp: Date.now(),
      };

      // 过滤掉旧的同ID记录（为了把新的顶到最前面），并限制总数为 50 条
      const newHistory = [newItem, ...history.filter((h) => h.id !== id)];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

      // 触发一个自定义事件，通知组件更新
      window.dispatchEvent(new Event("history-updated"));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  },

  // 删除一条
  deleteConversation: (id: string) => {
    const history = historyManager.getHistory();
    const newHistory = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    window.dispatchEvent(new Event("history-updated"));
  },

  // 清空
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("history-updated"));
  },
};
