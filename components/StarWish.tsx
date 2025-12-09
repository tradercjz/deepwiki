import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

// 星星图标 SVG
const StarIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 200, 0.6))' }} // 自带光晕
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const StarWish = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  
  // 动画状态: 'idle' | 'charging' (蓄力) | 'flying' (飞走) | 'gone' (消失)
  const [animState, setAnimState] = useState<'idle' | 'charging' | 'flying' | 'gone'>('idle');

  const handleSubmit = async () => {
    if (!text.trim()) return;

    // 1. 关闭卡片，开始蓄力
    setIsOpen(false);
    setAnimState('charging');

    // 这里可以调用你的后端 API 发送反馈
    console.log("Feedback submitted:", text);
    // await api.sendFeedback(text);

    // 2. 蓄力 800ms 后起飞
    setTimeout(() => {
      setAnimState('flying');
    }, 800);

    // 3. 飞走 1.5s 后完全消失
    setTimeout(() => {
      setAnimState('gone');
      setText('');
    }, 2000);

    // 4. 5秒后重置，星星回归（可选）
    setTimeout(() => {
      setAnimState('idle');
    }, 5000);
  };

  // 如果飞走了，就不渲染交互层了，只渲染飞行动画
  if (animState === 'gone') return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      
      {/* --- 反馈卡片 (Glassmorphism) --- */}
      {isOpen && (
        <div className="mb-4 w-72 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl animate-fade-in-up origin-bottom-right">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-sm tracking-wide">✨ Star Wish</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
          </div>
          
          <p className="text-xs text-gray-300 mb-3 leading-relaxed">
            This is a <span className="text-yellow-300 font-semibold">Public Beta</span> version. <br/>
            Your feedback helps us navigate the stars.
          </p>
          
          <textarea
            className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-200/50 resize-none transition-colors"
            placeholder="I wish for..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-full mt-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-200 to-yellow-500 text-yellow-900 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          >
            Send to Universe
          </button>
        </div>
      )}

      {/* --- 星星本体 / 触发器 --- */}
      <div 
        className="relative group cursor-pointer"
        onClick={() => {
            if (animState === 'idle') setIsOpen(!isOpen);
        }}
      >
        {/* 提示文字 (仅在 Idle 且未打开时显示) */}
        {animState === 'idle' && !isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs text-yellow-100/80 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
                    Feedback
                </span>
            </div>
        )}

        {/* 
            动画逻辑：
            idle: 呼吸浮动
            charging: 剧烈颤动 + 变大 + 变亮
            flying: 向右上方飞出 + 拖尾效果
        */}
        <div 
            className={`
                transition-all duration-[1500ms] ease-in-out
                ${animState === 'idle' ? 'animate-pulse-slow hover:scale-110' : ''}
                ${animState === 'charging' ? 'scale-150 brightness-[2] animate-shake' : ''}
                ${animState === 'flying' ? 'translate-x-[500px] -translate-y-[800px] scale-0 opacity-0' : ''}
            `}
            style={{
                // 飞行时改变 easing 为加速飞出
                transitionTimingFunction: animState === 'flying' ? 'cubic-bezier(0.5, 0, 1, 1)' : 'ease-in-out'
            }}
        >
            <div className={`p-3 rounded-full ${isOpen ? 'bg-yellow-500/20' : 'bg-transparent'} transition-colors`}>
                <StarIcon className={`w-8 h-8 text-[#fffee0] ${isOpen ? 'rotate-90' : 'rotate-0'} transition-transform duration-300`} />
            </div>
            
            {/* 飞行时的尾迹粒子 (简单的视觉欺骗) */}
            {animState === 'flying' && (
                <div className="absolute top-1/2 left-1/2 w-1 h-32 -translate-x-1/2 bg-gradient-to-t from-transparent via-white to-transparent blur-md -rotate-45 origin-bottom" />
            )}
        </div>
      </div>
    </div>
  );
};