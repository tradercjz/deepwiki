// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, historyApi } from '../api/client';
import { historyManager } from '../utils/historyManager'; 
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (phone: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：检查本地是否有持久化的登录信息
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const phone = localStorage.getItem('user_phone');
    const savedInfo = localStorage.getItem('user_info'); 
    const isValidInfo = savedInfo && savedInfo !== "undefined";


    if (token && phone) {
    setUser({ 
      phoneNumber: phone, 
      token, 
      info: isValidInfo ? JSON.parse(savedInfo) : null 
    } as User);
  }
    setIsLoading(false);

    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const register = async (data: any) => {
    await authApi.register(data);
  };

  const login = async (phone: string, pass: string) => {
    try {
      // 1. 调用接口（通过封装后的 authApi.login）
      // 此时的 res 结构为: { token: "...", user: { ... } }
      const res = await authApi.login(phone, pass);
      
     // 1. ✨ 先提取出真正的业务数据
      const loginPayload = (res as any).data; 

      if (!loginPayload) {
        throw new Error("登录响应数据异常");
      }

      console.log("Login Payload:", loginPayload);

      // 2. 使用提取后的数据访问属性
      localStorage.setItem('auth_token', loginPayload.token);
      localStorage.setItem('user_phone', loginPayload.user.phoneNumber);
      localStorage.setItem('user_info', JSON.stringify(res.user)); 
      
      setUser({ 
        phoneNumber: loginPayload.user.phoneNumber, 
        token: loginPayload.token,
        info: loginPayload.user 
      });
      // 4. 认领逻辑

      setTimeout(async () => {
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
        
        window.dispatchEvent(new Event('history-updated'));
      }, 0);

    } catch (err: any) {
      console.error("Login Error:", err);
      throw err; // 抛出错误让 UI 层显示
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_phone');
    setUser(null);
    window.dispatchEvent(new Event('history-updated'));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};