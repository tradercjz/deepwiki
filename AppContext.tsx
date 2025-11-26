import React, { createContext, useState, useContext, ReactNode } from 'react';

// 1. 定义 Context 将要提供的数据结构
interface AppContextType {
    pendingFiles: File[];
    setPendingFiles: (files: File[]) => void;
}

// 2. 创建 Context，可以给一个默认值
const AppContext = createContext<AppContextType | undefined>(undefined);

// 3. 创建一个 Provider 组件，它将包裹整个应用
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const value = { pendingFiles, setPendingFiles };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 4. 创建一个自定义 Hook，方便子组件使用 Context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};