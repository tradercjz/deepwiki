import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const draw = keyframes`
  to {
    stroke-dashoffset: 0;
  }
`;

const StyledSvg = styled.svg`
  width: 90%; // 增加宽度占比
  max-width: 800px; // 增加最大宽度
  height: auto;
  
  path {
    fill: none;
    stroke: url(#logo-gradient);
    stroke-width: 2; // 笔画加粗
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: ${draw} 2s ease-in-out forwards;
    filter: url(#glow);
  }
`;

// ✨ 核心修改：全新、大气、完整的 "DOLPHINDB" SVG 路径
// 每个字母现在是一个 Group (<g>)，可以包含多个路径
const lettersData = [
  // D
  { paths: ["M 60 10 H 20 Q 5 10 5 50 Q 5 90 20 90 H 60 Q 75 50 60 10 Z", "M 48 25 H 22 V 75 H 48 Q 58 50 48 25 Z"] },
  // O
  { paths: ["M 130 50 C 130 27.9 112.1 10 90 10 C 67.9 10 50 27.9 50 50 C 50 72.1 67.9 90 90 90 C 112.1 90 130 72.1 130 50 Z", "M 113 50 C 113 62.7 102.7 73 90 73 C 77.3 73 67 62.7 67 50 C 67 37.3 77.3 27 90 27 C 102.7 27 113 37.3 113 50 Z"] },
  // L
  { paths: ["M 145 10 L 145 90"] },
  // P
  { paths: ["M 170 90 L 170 10 H 200 Q 220 30 200 50 H 170"] },
  // H
  { paths: ["M 235 10 L 235 90 M 275 10 L 275 90 M 235 50 L 275 50"] },
  // I
  { paths: ["M 290 10 L 290 90"] },
  // N
  { paths: ["M 315 90 L 315 10 L 355 90 L 355 10"] },
  // D
  { paths: ["M 415 10 H 375 Q 360 10 360 50 Q 360 90 375 90 H 415 Q 430 50 415 10 Z", "M 403 25 H 377 V 75 H 403 Q 413 50 403 25 Z"] },
  // B
  { paths: ["M 450 10 H 480 Q 510 30 480 50 Q 515 70 480 90 H 450 V 10 Z", "M 467 27 V 43 H 480 Q 490 35 480 27 H 467 Z", "M 467 57 V 73 H 480 Q 495 65 480 57 H 467 Z"] }
];

export const AnimatedLogo: React.FC = () => {
  // 使用 Map 来存储 ref，因为它能处理更复杂的键（如果需要）
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());

  useEffect(() => {
    pathRefs.current.forEach((path) => {
      if (path) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length} ${length}`;
        path.style.strokeDashoffset = `${length}`;
      }
    });
  }, []);

  return (
    <StyledSvg viewBox="-10 0 540 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4FC3F7" />
          <stop offset="100%" stopColor="#B2EBF2" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {lettersData.map((letter, letterIndex) => (
        // ✨ 每个字母现在是一个 <g> 元素 (group)
        <g key={letterIndex}>
          {letter.paths.map((pathData, pathIndex) => (
            <path
              key={pathIndex}
              ref={(el) => {
                if (el) {
                  // 创建一个唯一的 key 用于 ref Map
                  pathRefs.current.set(`${letterIndex}-${pathIndex}`, el);
                }
              }}
              d={pathData}
              // ✨ 动画延迟应用到整个字母上
              style={{ animationDelay: `${letterIndex * 0.15}s` }}
            />
          ))}
        </g>
      ))}
    </StyledSvg>
  );
};