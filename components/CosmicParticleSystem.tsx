import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

const KEYWORDS = [
  "DolphinDB", "Orca", "Swordfish", "Shark", 
  "Starfish", "Octopus", "Beluga"
];

const CONFIG = {
  particleCount: 6000,
  textParticleRatio: 0.65,
  particleSize: 6.0,     // ✨ 稍微调大一点，更有光晕感
  color: 0xfffee0,       // ✨ 暖白色 (Sunlight/Starlight)
  morphSpeed: 0.05,
  duration: 4000,
  dispersion: 1500
};

const FONT_SIZE = 120; 

const getTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    // ✨ [核心修改] 模拟太阳光晕
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // 核心：纯白高亮
    gradient.addColorStop(0.2, 'rgba(255, 240, 200, 0.9)');  // 内圈：暖白
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.4)');  // 外圈：金黄色光晕
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');            // 边缘：透明
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
};

export const CosmicParticleSystem = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // --- 1. 场景 ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.y = -50; 

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- 2. 粒子 ---
    const count = CONFIG.particleCount;
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    
    // 增加两个属性：随机偏移量(呼吸) 和 抖动速度(躁动)
    const randomOffsets = new Float32Array(count); 
    const jitterSpeeds = new Float32Array(count); 

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * CONFIG.dispersion * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.dispersion;
      positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.dispersion;
      
      targetPositions[i3] = positions[i3];
      targetPositions[i3 + 1] = positions[i3 + 1];
      targetPositions[i3 + 2] = positions[i3 + 2];
      
      randomOffsets[i] = Math.random() * Math.PI * 2;
      jitterSpeeds[i] = Math.random() * 0.5 + 0.5; // 0.5 ~ 1.0
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
    let intervalId: NodeJS.Timer | null = null;

    loader.load(fontUrl, (font) => {
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
          // 稍微降低取点密度，因为我们要用“散射”来填充空隙
          const shapePoints = shape.getSpacedPoints(Math.ceil(FONT_SIZE / 1.0));
          points.push(...shapePoints);
          if (shape.holes && shape.holes.length > 0) {
             shape.holes.forEach(hole => {
                 points.push(...hole.getSpacedPoints(Math.ceil(FONT_SIZE / 1.0)));
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
            
            // ✨✨✨ [改进 1] 静态散射 (Fuzzy Edge) ✨✨✨
            // 不再让粒子死死地定在线条上，而是给每个目标位置加一个随机范围。
            // 这样文字看起来边缘是毛茸茸的，像发光的星云，而不是打印字体。
            const scatterX = (Math.random() - 0.5) * 8.0; // 散射范围 8
            const scatterY = (Math.random() - 0.5) * 8.0; 
            const scatterZ = (Math.random() - 0.5) * 20.0; // Z轴稍微厚一点，增加立体感

            targetPositions[i3]     = pt.x + xMid + scatterX;
            targetPositions[i3 + 1] = pt.y + yMid + scatterY;
            targetPositions[i3 + 2] = 0 + scatterZ;

          } else {
            // 背景粒子逻辑
            const r = 500 + Math.random() * 1000;
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
        
        // 1. 基础缓动：飞向目标
        pos[i3]     += (targetPositions[i3] - pos[i3]) * CONFIG.morphSpeed;
        pos[i3 + 1] += (targetPositions[i3 + 1] - pos[i3 + 1]) * CONFIG.morphSpeed;
        pos[i3 + 2] += (targetPositions[i3 + 2] - pos[i3 + 2]) * CONFIG.morphSpeed;

        if (i < count * CONFIG.textParticleRatio) {
            // ✨✨✨ [改进 2] 动态高频抖动 (Dynamic Jitter) ✨✨✨
            // 让粒子在目标位置附近快速震动，模拟不稳定的能量
            // 使用 sin + 随机相位来模拟噪点
            
            // 慢速呼吸波 (大范围)
            const breath = Math.sin(time * 2 + randomOffsets[i]) * 0.3;
            
            // 快速抖动 (小范围，像电流)
            const jitter = Math.sin(time * 20 + randomOffsets[i] * 5) * 0.5; 

            pos[i3]     += breath + jitter;
            pos[i3 + 1] += breath + jitter;
            pos[i3 + 2] += breath; // Z轴只呼吸，不抖动，保持一点稳定感
        } else {
            // 背景粒子只需缓慢漂浮
            pos[i3] += Math.sin(time * 0.5 + randomOffsets[i]) * 0.5;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      // 场景微旋
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

      // Z 轴自适应 (目标宽度 1600)
      const fovRad = (camera.fov * Math.PI) / 180;
      let distance = (1600 / 2) / (Math.tan(fovRad / 2) * camera.aspect);
      distance *= 1.2;
      camera.position.z = Math.max(400, Math.min(2500, distance));

      // Y 轴固定偏移
      camera.position.y = -50; 
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (intervalId) clearInterval(intervalId);
      if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
      }
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
        // ✨ [核心修改] 深孔雀蓝背景
        // #001f2b: 深孔雀蓝/Teal
        // #000000: 纯黑边缘
        background: 'radial-gradient(circle at center, #001f2b 0%, #00080a 60%, #000000 100%)' 
      }} 
    />
  );
};