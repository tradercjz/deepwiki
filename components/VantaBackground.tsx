import React, { useState, useEffect, useRef } from 'react';

// 声明全局的 VANTA 对象，因为它是通过 <script> 标签引入的
declare global {
    interface Window {
        VANTA: any;
    }
}

export const VantaBackground: React.FC = () => {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);

    useEffect(() => {
        // 只有当 vantaEffect 未被初始化时才创建
        if (!vantaEffect && window.VANTA) {
        const effect = window.VANTA.WAVES({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            
            // ✨ [调整] 浅海配色
            // 0x0077be (海洋蓝) 或 0x4f97cf (更浅的蓝)
            // 这里推荐一个清透的浅蓝色，配合你的白色UI很好看
            color: 0x507090,
            
            // ✨ [调整] 增加反光度，让水面更有波光粼粼的感觉
            shininess: 30.00, 
            
            // ✨ [调整] 波浪稍微平缓一点，像平静的海面
            waveHeight: 22.00,
            waveSpeed: 0.45,
            zoom: 0.9
        });
        setVantaEffect(effect);
        }
    
        // ✨ 关键：组件卸载时，必须销毁 Vanta 实例以释放 GPU 资源
        return () => {
        if (vantaEffect) {
            vantaEffect.destroy();
        }
        };
    }, [vantaEffect]); // 依赖项数组确保 effect 只运行一次

    return (
        <div 
        ref={vantaRef} 
        className="fixed inset-0 w-full h-full z-[-10]" // ✨ z-0 确保它在最底层
        />
    );
};