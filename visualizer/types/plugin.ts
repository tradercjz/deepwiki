import React from 'react';

export interface Plugin {
    id: string;
    name: string;
    description: string;
    // 渲染 3D 场景的组件
    SceneComponent: React.FC<{
        isPlaying: boolean;
        progress: number;
        params: any;
        onStepsReady?: (steps: number) => void;
    }>;
    // 渲染参数控制面板的组件 (UI Overlay 右上角)
    ParameterPanelComponent?: React.FC<{
        params: any;
        setParams: (params: any) => void;
    }>;
    // 默认参数
    defaultParams: any;
}