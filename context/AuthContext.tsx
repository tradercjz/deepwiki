// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, historyApi } from '../api/client';
import { historyManager } from '../utils/historyManager'; 
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：检查本地是否有 Token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('user_email');
    if (token && email) {
      setUser({ email, token });
    }
    setIsLoading(false);

    // 监听 401 事件自动登出
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const register = async (email: string, pass: string) => {
    await authApi.register(email, pass);
  };

  const verify = async (email: string, code: string) => {
    await authApi.verify(email, code);
  };

  const login = async (email: string, pass: string) => {
    // 1. 获取 Token
    const data = await authApi.login(email, pass);
    
    // 2. 持久化
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_email', data.user_email);
    
    // 3. ✨ 核心逻辑：尝试认领游客数据
    try {
      const localHistory = historyManager.getHistory();
      const localIds = localHistory.map(h => h.id);

      if (localIds.length > 0) {
        console.log(`[Auth] Claiming ${localIds.length} guest conversations...`);
        await historyApi.claim(localIds);
        
        // 认领成功后，清空本地记录，UI 将切换为读取云端 API
        historyManager.clearAll();
        console.log('[Auth] Guest history migrated and local storage cleared.');
      }
    } catch (e) {
      console.error('[Auth] Failed to claim guest history:', e);
      // 注意：认领失败不应阻断登录流程
    }

    // 4. 更新状态
    setUser({ email: data.user_email, token: data.access_token });
    
    // 5. 通知其他组件刷新数据 (Sidebar)
    window.dispatchEvent(new Event('history-updated'));
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    setUser(null);
    // 登出后，触发一次更新，让 Sidebar 变回空或者显示游客状态
    window.dispatchEvent(new Event('history-updated'));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verify, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};