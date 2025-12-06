import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

const KEYWORDS = [
  "DolphinDB", "Orca", "Swordfish", "Shark", 
  "Starfish", "Octopus", "Beluga"
];

const CONFIG = {
  particleCount: 6000,   // 粒子总数
  textParticleRatio: 0.6, // 60% 的粒子用于勾勒文字，40% 用于背景星空
  particleSize: 4.0,     // 粒子大小 (稍微调大，看得更清)
  color: 0x00f0ff,       // 赛博青
  morphSpeed: 0.05,      // 变形速度
  duration: 4000,        // 单词停留时间
  cameraZ: 400,          // 摄像机距离
  dispersion: 1500       // 背景粒子散布范围 (全屏)
};

// 动态生成发光粒子纹理
const getTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
    gradient.addColorStop(0.2, 'rgba(200, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
};

export const CosmicParticleSystem = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- 1. 场景初始化 ---
    const scene = new THREE.Scene();
    // 稍微弱一点的雾，让远处的星星也能看见
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = CONFIG.cameraZ;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- 2. 粒子系统初始化 ---
    const count = CONFIG.particleCount;
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randomOffsets = new Float32Array(count); // 用于呼吸动画

    // 初始状态：全屏随机分布
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * CONFIG.dispersion * 2; // 宽
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.dispersion;     // 高
      positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.dispersion;     // 深
      
      // 初始目标 = 当前位置
      targetPositions[i3] = positions[i3];
      targetPositions[i3 + 1] = positions[i3 + 1];
      targetPositions[i3 + 2] = positions[i3 + 2];

      randomOffsets[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: CONFIG.color,
      size: CONFIG.particleSize,
      map: getTexture(),
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- 3. 核心：文字轮廓提取算法 ---
    const loader = new FontLoader();
    // 使用更稳定的 CDN
    const fontUrl = 'https://unpkg.com/three@0.147.0/examples/fonts/helvetiker_bold.typeface.json';

    loader.load(fontUrl, (font) => {
      let index = 0;

      const updateText = (text: string) => {
        // 1. 生成文字形状 (Shapes)
        const shapes = font.generateShapes(text, 60); // 字号 60
        
        // 2. 从形状中提取均匀分布的点 (Spaced Points)
        // 这一步是关键：它会沿着文字的笔画轮廓取点，而不是取三角面片
        const points: THREE.Vector2[] = [];
        
        // 计算居中偏移量
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        const xMid = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
        const yMid = -0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y);
        geometry.dispose();

        // 提取轮廓点
        shapes.forEach((shape) => {
          // 0.8 是取点密度，越小点越密
          const shapePoints = shape.getSpacedPoints(Math.ceil(60 / 0.8)); 
          points.push(...shapePoints);
          
          // 如果有孔洞（比如 O, A, D 的内部），也提取出来
          if (shape.holes && shape.holes.length > 0) {
             shape.holes.forEach(hole => {
                 const holePoints = hole.getSpacedPoints(Math.ceil(60 / 0.8));
                 points.push(...holePoints);
             });
          }
        });

        const textPointsCount = points.length;
        const particlesForText = Math.floor(count * CONFIG.textParticleRatio);

        // 3. 分配粒子目标位置
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;

          if (i < particlesForText && textPointsCount > 0) {
            // -- 组成文字的粒子 --
            // 循环利用轮廓点，让粒子重复覆盖，增加亮度
            const ptIndex = i % textPointsCount; 
            const pt = points[ptIndex];

            // 基础位置 + 居中偏移
            // 加入随机抖动 (Jitter)，让线条看起来像发光的能量带，而不是死板的线
            targetPositions[i3]     = pt.x + xMid + (Math.random() - 0.5) * 2; 
            targetPositions[i3 + 1] = pt.y + yMid + (Math.random() - 0.5) * 2;
            targetPositions[i3 + 2] = 0 + (Math.random() - 0.5) * 5; // 稍微有一点厚度
          } else {
            // -- 背景星空粒子 --
            // 随机散布在屏幕周围，制造景深
            // 使用球坐标系分布，让周围看起来像星系
            const r = 350 + Math.random() * 1000; // 远离中心文字
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            targetPositions[i3]     = r * Math.sin(phi) * Math.cos(theta);
            targetPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            targetPositions[i3 + 2] = (r * Math.cos(phi)) * 0.5; // Z轴压扁一点
          }
        }
      };

      // 启动轮播
      updateText(KEYWORDS[0]);
      setInterval(() => {
        index = (index + 1) % KEYWORDS.length;
        updateText(KEYWORDS[index]);
      }, CONFIG.duration);
    });

    // --- 4. 动画循环 ---
    const clock = new THREE.Clock();
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.1;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      
      const pos = particles.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 1. 飞向目标 (插值缓动)
        pos[i3]     += (targetPositions[i3] - pos[i3]) * CONFIG.morphSpeed;
        pos[i3 + 1] += (targetPositions[i3 + 1] - pos[i3 + 1]) * CONFIG.morphSpeed;
        pos[i3 + 2] += (targetPositions[i3 + 2] - pos[i3 + 2]) * CONFIG.morphSpeed;

        // 2. 呼吸浮动效果 (仅对文字粒子明显)
        // 利用初始生成的 randomOffsets 让每个粒子波动相位不同
        if (i < count * CONFIG.textParticleRatio) {
            const wave = Math.sin(time * 3 + randomOffsets[i]) * 0.2;
            pos[i3] += wave;
            pos[i3+1] += wave;
        } else {
            // 背景粒子缓慢漂移
            pos[i3] += Math.sin(time * 0.5 + randomOffsets[i]) * 0.5;
        }
      }
      
      particles.geometry.attributes.position.needsUpdate = true;

      // 3. 整体场景随鼠标微动
      particles.rotation.y += (mouseX * 0.0002 - particles.rotation.y) * 0.05;
      particles.rotation.x += (mouseY * 0.0002 - particles.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ 
        background: 'radial-gradient(circle at center, #0b1026 0%, #000000 100%)' 
      }} 
    />
  );
};