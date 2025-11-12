import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. 定义单条曲线的组件
// =================================
interface BezierCurveProps {
  // `seed` 用于为每条曲线创造独一无二的运动模式
  seed: number;
  color: string;
  // `points` 定义了曲线的分段数量，越多越平滑
  points?: number;
}

function BezierCurve({ seed, color, points = 50 }: BezierCurveProps) {
  const lineRef = useRef<THREE.Line>(null!);

  // 2. 使用 useMemo 创建一次性的、不会在每次渲染时都重新创建的对象
  // 这是性能优化的关键
  const { curve, geometry } = useMemo(() => {
    // 创建四个控制点，初始位置随机
    const start = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0);
    const cp1 = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0);
    const cp2 = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0);
    const end = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0);
    
    // 创建一个三维三次 Bézier 曲线对象
    const curve = new THREE.CubicBezierCurve3(start, cp1, cp2, end);
    
    // 创建一个空的几何体，用于存放曲线的点
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(curve.getPoints(points));
    
    return { curve, geometry };
  }, [points]);

  // 3. useFrame 是动画的核心，它会在每一帧被调用
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 4. ✨ 核心动画逻辑：让四个控制点随着时间平滑地移动
    // 我们使用 sin 和 cos 函数来创造流畅的、循环的运动
    // `seed` 确保了每条曲线的运动轨迹和速度都不同
    curve.v0.x = Math.sin(t * 0.1 * seed + seed * 2) * 5;
    curve.v0.y = Math.cos(t * 0.2 * seed) * 4;
    
    curve.v1.x = Math.sin(t * 0.3 * seed - seed) * 6;
    curve.v1.y = Math.cos(t * 0.1 * seed + seed * 3) * 5;

    curve.v2.x = Math.cos(t * 0.2 * seed + seed * 4) * 5;
    curve.v2.y = Math.sin(t * 0.4 * seed - seed * 2) * 6;
    
    curve.v3.x = Math.cos(t * 0.1 * seed - seed * 3) * 4;
    curve.v3.y = Math.sin(t * 0.2 * seed) * 5;
    
    // 5. 根据更新后的控制点，重新计算曲线上的点，并更新几何体
    const newPoints = curve.getPoints(points);
    geometry.setFromPoints(newPoints);
  });

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial attach="material" color={color} linewidth={2} />
    </line>
  );
}

// 6. 主背景组件，负责渲染 Canvas 和多条曲线
// ==================================================
export const GenerativeCurvesBackground: React.FC = () => {
  // 创建一个数组，用于渲染多条曲线
  const curves = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      seed: Math.random() * 2 + 0.5, // 随机种子
      color: '#81D4FA', // 浅蓝色
    }))
  , []);

  return (
    <div className="fixed inset-0 w-full h-full z-[-10] bg-[#020617]">
      <Canvas camera={{ position: [0, 0, 12], fov: 75 }}>
        {curves.map((curveProps, i) => (
          <BezierCurve key={i} {...curveProps} />
        ))}
      </Canvas>
    </div>
  );
};