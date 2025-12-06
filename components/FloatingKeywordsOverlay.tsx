import React, { useEffect, useState } from 'react';

// 产品关键词列表
const KEYWORDS = [
  "DolphinDB", 
  "Orca", 
  "Swordfish", 
  "Shark", 
  "Starfish", 
  "Octopus", 
  "Beluga"
];

interface FloatingItem {
  id: number;
  text: string;
  top: number;      // 垂直位置 (0-100%)
  duration: number; // 游动全程时间 (秒)
  delay: number;    // 开始延迟 (秒)
  size: number;     // 字体大小 (rem)
  opacity: number;  // 透明度
}

export const FloatingKeywordsOverlay = () => {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    // 生成 12 个随机漂浮元素
    const initialItems = Array.from({ length: 12 }).map((_, i) => {
      const randomKeyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
      
      return {
        id: i,
        text: randomKeyword,
        // 随机分布在垂直方向 5% - 95%
        top: Math.random() * 90 + 5, 
        // 速度差异化：25秒 到 45秒 游完全程，非常缓慢
        duration: Math.random() * 20 + 25, 
        // 随机延迟，避免同时出现
        delay: Math.random() * 20,
        // 大小差异：1rem 到 2.5rem
        size: Math.random() * 1.5 + 1, 
        // 透明度：0.05 (极淡) 到 0.25 (稍微可见)
        opacity: Math.random() * 0.2 + 0.05 
      };
    });
    setItems(initialItems);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5 select-none">
      <style>{`
        @keyframes floatLeftToRight {
          0% { transform: translateX(-100%) translateY(0px); }
          25% { transform: translateX(25vw) translateY(10px); }
          50% { transform: translateX(50vw) translateY(-5px); }
          75% { transform: translateX(75vw) translateY(10px); }
          100% { transform: translateX(100vw) translateY(0px); }
        }
      `}</style>
      
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute font-bold text-white whitespace-nowrap"
          style={{
            top: `${item.top}%`,
            left: 0,
            fontSize: `${item.size}rem`,
            opacity: item.opacity,
            // 启用硬件加速
            willChange: 'transform',
            // 动画配置
            animationName: 'floatLeftToRight',
            animationDuration: `${item.duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `-${item.delay}s`, // 负延迟：让动画一开始就布满屏幕
            // 加一点模糊，增加景深感（背景感）
            filter: 'blur(1px)',
            fontFamily: 'sans-serif' 
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};