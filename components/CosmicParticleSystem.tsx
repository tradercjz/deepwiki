import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

const KEYWORDS = [
  "DolphinDB", "Orca", "Swordfish", "Shark", 
  "Starfish", "Octopus", "Beluga"
];

const CONFIG = {
  particleCount: 6000,
  textParticleRatio: 0.6,
  particleSize: 5.5,
  color: 0x00f0ff,
  morphSpeed: 0.05,
  duration: 4000,
  dispersion: 1500
};

const FONT_SIZE = 150;

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
    // ✨ [核心修复 1] 捕获当前 ref 的值，防止 cleanup 时 ref 变空
    const container = mountRef.current;
    if (!container) return;

    // ✨ [核心修复 2] 暴力清空容器
    // 防止 React Strict Mode 导致重复挂载两个 Canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // --- 1. 场景 ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement); // 使用捕获的 container

    // --- 2. 粒子 ---
    const count = CONFIG.particleCount;
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randomOffsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * CONFIG.dispersion * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.dispersion;
      positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.dispersion;
      
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

    // --- 3. 字体 ---
    const loader = new FontLoader();
    const fontUrl = 'https://unpkg.com/three@0.147.0/examples/fonts/helvetiker_bold.typeface.json';
    let intervalId: NodeJS.Timer | null = null; // 用于清理定时器

    loader.load(fontUrl, (font) => {
      // 只有当组件还没卸载时才执行
      if (!container) return;

      let index = 0;

      const updateText = (text: string) => {
        const shapes = font.generateShapes(text, FONT_SIZE);
        const points: THREE.Vector2[] = [];
        
        const tempGeo = new THREE.ShapeGeometry(shapes);
        tempGeo.computeBoundingBox();
        const xMid = -0.5 * (tempGeo.boundingBox!.max.x - tempGeo.boundingBox!.min.x);
        const yMid = -0.5 * (tempGeo.boundingBox!.max.y - tempGeo.boundingBox!.min.y);
        tempGeo.dispose();

        shapes.forEach((shape) => {
          const shapePoints = shape.getSpacedPoints(Math.ceil(FONT_SIZE / 0.8));
          points.push(...shapePoints);
          if (shape.holes && shape.holes.length > 0) {
             shape.holes.forEach(hole => {
                 points.push(...hole.getSpacedPoints(Math.ceil(FONT_SIZE / 0.8)));
             });
          }
        });

        const textPointsCount = points.length;
        const particlesForText = Math.floor(count * CONFIG.textParticleRatio);

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          if (i < particlesForText && textPointsCount > 0) {
            const ptIndex = i % textPointsCount;
            const pt = points[ptIndex];
            targetPositions[i3]     = pt.x + xMid + (Math.random() - 0.5) * 2;
            targetPositions[i3 + 1] = pt.y + yMid + (Math.random() - 0.5) * 2;
            targetPositions[i3 + 2] = 0 + (Math.random() - 0.5) * 5;
          } else {
            const r = 400 + Math.random() * 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            targetPositions[i3]     = r * Math.sin(phi) * Math.cos(theta);
            targetPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            targetPositions[i3 + 2] = (r * Math.cos(phi)) * 0.5;
          }
        }
      };

      updateText(KEYWORDS[0]);
      intervalId = setInterval(() => {
        index = (index + 1) % KEYWORDS.length;
        updateText(KEYWORDS[index]);
      }, CONFIG.duration);
    });

    // --- 4. 动画 ---
    const clock = new THREE.Clock();
    let mouseX = 0;
    let mouseY = 0;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth/2) * 0.1;
      mouseY = (e.clientY - window.innerHeight/2) * 0.1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const pos = particles.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3]     += (targetPositions[i3] - pos[i3]) * CONFIG.morphSpeed;
        pos[i3 + 1] += (targetPositions[i3 + 1] - pos[i3 + 1]) * CONFIG.morphSpeed;
        pos[i3 + 2] += (targetPositions[i3 + 2] - pos[i3 + 2]) * CONFIG.morphSpeed;

        if (i < count * CONFIG.textParticleRatio) {
            const wave = Math.sin(time * 3 + randomOffsets[i]) * 0.2;
            pos[i3] += wave; pos[i3+1] += wave;
        } else {
            pos[i3] += Math.sin(time * 0.5 + randomOffsets[i]) * 0.5;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += (mouseX * 0.0002 - particles.rotation.y) * 0.05;
      particles.rotation.x += (mouseY * 0.0002 - particles.rotation.x) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    // --- 5. Resize ---
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Z 轴自适应
      const fovRad = (camera.fov * Math.PI) / 180;
      
      // ✨ [修改] 目标宽度 (Target Width)
      // 之前是 750 (基于60号字)。现在字号 120 (翻倍)，宽度大约是 1500 左右。
      // 我们设为 1600 以留出安全边距。
      const targetTextWidth = 1600; 

      let distance = (targetTextWidth / 2) / (Math.tan(fovRad / 2) * camera.aspect);
      distance *= 1.2; // 额外的宽松系数
      
      camera.position.z = Math.max(400, Math.min(2500, distance)); // 上限稍微放宽到 2500

      // Y 轴固定偏移
      camera.position.y = -50; 
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // --- 6. ✨ [核心修复 3] 彻底的清理函数 ---
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      
      // 清除动画循环
      cancelAnimationFrame(animationFrameId);
      
      // 清除字体轮播定时器
      if (intervalId) clearInterval(intervalId);

      // 清除 DOM
      if (container) {
        // 再次检查并清除，确保 DOM 干净
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
      }
      
      // 释放 Three.js 内存
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 bg-black"
      style={{ 
        background: 'radial-gradient(circle at center, #0b1026 0%, #000000 100%)' 
      }} 
    />
  );
};