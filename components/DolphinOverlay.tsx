import React, { useEffect, useState } from 'react';

// 海豚 SVG (扁平化剪影风格)
const DolphinSVG = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 512 512" 
    className={className} 
    style={style}
    fill="currentColor" // 允许通过 text-color 控制颜色
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 这里是一个简化的海豚形状路径 */}
    <path d="M409.6 163.6c-17.4-6.6-43.6-10.4-68.3-9.5-12.6.5-23.7 2.3-33 4.9-10.9-24.6-28.7-44.4-53.1-55.5-27.1-12.3-59.3-9.6-86.8 6.5-4.4 2.6-9.6 2.3-13.7-.8-10.6-8.1-24.9-11-38.1-7.8-13.8 3.4-25.1 13.3-30.7 26.3-5.3 12.3-4.6 26.6 2.1 38.3 2.1 3.7 2.3 8.1.5 11.9-6.3 13.3-6.6 28.9-.7 42.6 6.1 14.1 19.3 23.9 34.6 25.6 15.3 1.7 30.6-4.6 39.8-16.7 1.9-2.5 4.8-4 7.9-4.2 3.1-.2 6.1 1 8.2 3.3 17.6 19.4 43.7 29.2 70.1 26.3 29.6-3.3 55.4-21.7 67.5-48.6 3.9 1.1 7.9 2 12 2.6 18.5 2.8 38.2-1.1 53.8-10.7 12.4-7.6 19.3-21.1 18.1-35.3-1.1-13.1-9.9-24.3-22.2-29.2zm-233.1 33.9c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z"/>
  </svg>
);

interface Dolphin {
  id: number;
  top: number;      // 垂直位置 (0-100%)
  speed: number;    // 游动速度 (秒)
  delay: number;    // 开始延迟 (秒)
  scale: number;    // 大小 (0.5 - 1.5)
  opacity: number;  // 透明度 (模拟远近)
}

export const DolphinOverlay = () => {
  const [dolphins, setDolphins] = useState<Dolphin[]>([]);

  useEffect(() => {
    // 初始化 3 只海豚，参数随机
    const initialDolphins = Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      top: Math.random() * 80 + 10, // 10% - 90% 高度
      speed: Math.random() * 15 + 20, // 20s - 35s 游完全程 (很慢很优雅)
      delay: Math.random() * 10,      // 0s - 10s 延迟
      scale: Math.random() * 0.5 + 0.5, // 大小随机
      opacity: Math.random() * 0.3 + 0.1 // 淡淡的透明度，不要抢眼
    }));
    setDolphins(initialDolphins);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
      <style>{`
        @keyframes swimRight {
          0% { transform: translateX(-200px) rotate(5deg); }
          25% { transform: translateX(25vw) rotate(-5deg); }
          50% { transform: translateX(50vw) rotate(5deg); }
          75% { transform: translateX(75vw) rotate(-5deg); }
          100% { transform: translateX(105vw) rotate(5deg); }
        }
      `}</style>
      
      {dolphins.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            top: `${d.top}%`,
            left: 0,
            animation: `swimRight ${d.speed}s linear infinite`,
            animationDelay: `-${d.delay}s`, // 负延迟让动画立即处于中间状态
            opacity: d.opacity,
            transformOrigin: 'center center',
          }}
        >
          <DolphinSVG 
            className="text-white dark:text-blue-100"
            style={{ 
              width: `${100 * d.scale}px`, 
              height: 'auto',
              filter: 'blur(1px)' // 稍微模糊一点，增加背景感
            }} 
          />
        </div>
      ))}
    </div>
  );
};