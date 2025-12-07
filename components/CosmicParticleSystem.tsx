import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';

const KEYWORDS = [
  "DolphinDB", "Orca", "Swordfish", "Shark", 
  "Starfish", "Octopus", "Beluga"
];

const CONFIG = {
  particleCount: 6000,
  textParticleRatio: 0.65,
  particleSize: 6.0,     // 暖白大粒子
  color: 0xfffee0,       // 太阳光/星光色
  morphSpeed: 0.03,      // 变形速度稍慢一点，更优雅
  duration: 4000,
  dispersion: 1500
};

const FONT_SIZE = 120; 

// 生成发光纹理
const getTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      
    gradient.addColorStop(0.2, 'rgba(255, 240, 200, 0.9)');  
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.4)');  
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');            
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
};

interface Props {
  isSlow?: boolean; // isSlow = true 代表进入了对话模式
}

export const CosmicParticleSystem: React.FC<Props> = ({ isSlow = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // --- Refs 用于跨 Effect 共享数据 ---
  const targetPositionsRef = useRef<Float32Array | null>(null); // 存储目标位置数组
  const fontRef = useRef<Font | null>(null);                    // 存储加载好的字体
  const intervalRef = useRef<NodeJS.Timeout | null>(null);      // 存储定时器
  const keywordIndexRef = useRef(0);                            // 存储当前文字索引
  
  // 速度控制 Refs
  const targetSpeedRef = useRef(1.0);
  const currentSpeedRef = useRef(1.0);

  // 1. 同步速度目标
  useEffect(() => {
    // 进入对话(isSlow)时，速度降为 0.05 (极慢漂浮)
    targetSpeedRef.current = isSlow ? 0.05 : 1.0;
  }, [isSlow]);

  // 2. 核心场景初始化 (只执行一次)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 清理旧内容
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // 雾气效果，增加深邃感
    scene.fog = new THREE.FogExp2(0x00080a, 0.0006); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.y = -50; 

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 样式
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);

    // --- Particles Init ---
    const count = CONFIG.particleCount;
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    // 共享给其他 Effect 使用
    targetPositionsRef.current = targetPositions;

    const randomOffsets = new Float32Array(count); 
    
    // 初始化粒子位置 (随机分布)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // 初始散开
      const r = 400 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      // 默认目标也是原地 (避免初始飞动)
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

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let mouseX = 0;
    let mouseY = 0;
    let animationFrameId: number;
    let accumulatedTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth/2) * 0.1;
      mouseY = (e.clientY - window.innerHeight/2) * 0.1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // 平滑速度过渡 logic
      currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.03;
      const speedFactor = currentSpeedRef.current;
      
      // 时间流速受控
      accumulatedTime += delta * speedFactor;

      const pos = particles.geometry.attributes.position.array as Float32Array;
      const targets = targetPositionsRef.current;

      if (!targets) return;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 1. 飞向目标 (受速度系数影响，进入对话时飞得慢一点，显得从容)
        // 注意：这里我们给 morphSpeed 乘一个保底值，防止 speedFactor 接近 0 时粒子完全不动
        // 当 speedFactor 小时，粒子移动变慢，符合“时间变慢”的设定
        const moveSpeed = CONFIG.morphSpeed * (0.2 + 0.8 * speedFactor); 

        pos[i3]     += (targets[i3] - pos[i3]) * moveSpeed;
        pos[i3 + 1] += (targets[i3 + 1] - pos[i3 + 1]) * moveSpeed;
        pos[i3 + 2] += (targets[i3 + 2] - pos[i3 + 2]) * moveSpeed;

        // 2. 呼吸与抖动
        // 在对话模式下(speedFactor < 0.1)，大幅减弱抖动，只保留极慢的呼吸
        if (speedFactor > 0.5) {
            // [活跃模式]
            const breath = Math.sin(accumulatedTime * 2 + randomOffsets[i]) * 0.3;
            const jitter = Math.sin(accumulatedTime * 20 + randomOffsets[i] * 5) * 0.5; 
            pos[i3] += breath + jitter;
            pos[i3 + 1] += breath + jitter;
            pos[i3 + 2] += breath;
        } else {
            // [静谧星空模式] 只有极其微弱的漂浮
            const drift = Math.sin(accumulatedTime * 0.5 + randomOffsets[i]) * 0.1;
            pos[i3] += drift;
            pos[i3 + 1] += drift;
            pos[i3 + 2] += drift;
        }
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      
      // 旋转 (对话模式下几乎不转)
      particles.rotation.y += (mouseX * 0.0002 - particles.rotation.y) * 0.05 * speedFactor;
      particles.rotation.x += (mouseY * 0.0002 - particles.rotation.x) * 0.05 * speedFactor;

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize Logic ---
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      // Z轴适配
      const fovRad = (camera.fov * Math.PI) / 180;
      let distance = (1600 / 2) / (Math.tan(fovRad / 2) * camera.aspect);
      distance *= 1.2;
      camera.position.z = Math.max(400, Math.min(2500, distance));
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // --- Load Font ---
    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.147.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
      fontRef.current = font;
      // 字体加载完毕后，触发一次状态更新逻辑
      // 这里通过派发个假事件或者改变某个 ref 标志位不太方便，
      // 我们直接手动调用一次布局逻辑，初始状态默认为 Home 模式 (Text)
      // 如果 props.isSlow 已经是 true (比如直接刷新在 chat 页面)，Effect 会处理覆盖它
      updateParticleTargets(false); // 初始先尝试显示文字，Effect 会马上修正
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (intervalRef.current) clearInterval(intervalRef.current);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // --- 3. 核心逻辑控制 Effect ---
  // 根据 isSlow 和 fontRef 的状态，决定是“变字”还是“变星空”
  useEffect(() => {
    // 每次 isSlow 变化，或者定时器触发，都会调用这个逻辑更新位置
    updateMode();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSlow]); // 依赖 isSlow

  // 定义布局函数
  const updateMode = () => {
    // 如果字体还没加载好，设个定时器轮询一下，或者直接等下一次 render
    if (!fontRef.current) {
        setTimeout(updateMode, 100);
        return;
    }

    // 清理旧定时器
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isSlow) {
        // === 对话模式：星空 ===
        // 1. 立即停止变换文字
        // 2. 将目标位置设置为随机分布 (Starfield)
        disperseToStars();
        // 不需要 setInterval，因为星星不需要每隔几秒变一次位置
    } else {
        // === 主页模式：文字变换 ===
        // 1. 立即显示当前文字
        updateTextTargets(KEYWORDS[keywordIndexRef.current]);
        // 2. 开启定时器轮播
        intervalRef.current = setInterval(() => {
            keywordIndexRef.current = (keywordIndexRef.current + 1) % KEYWORDS.length;
            updateTextTargets(KEYWORDS[keywordIndexRef.current]);
        }, CONFIG.duration);
    }
  };

  // --- Helpers ---

  // 1. 散开成星空
  const disperseToStars = () => {
    const targets = targetPositionsRef.current;
    if (!targets) return;
    const count = CONFIG.particleCount;

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // 巨大的球体分布，营造深邃感
        const r = 600 + Math.random() * 1500; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        targets[i3]     = r * Math.sin(phi) * Math.cos(theta);
        targets[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        targets[i3 + 2] = r * Math.cos(phi);
    }
  };

  // 2. 聚合成文字
  const updateTextTargets = (text: string) => {
    const font = fontRef.current;
    const targets = targetPositionsRef.current;
    if (!font || !targets) return;

    const shapes = font.generateShapes(text, FONT_SIZE);
    const points: THREE.Vector2[] = [];
    
    // 计算包围盒以便居中
    const tempGeo = new THREE.ShapeGeometry(shapes);
    tempGeo.computeBoundingBox();
    const xMid = -0.5 * (tempGeo.boundingBox!.max.x - tempGeo.boundingBox!.min.x);
    const yMid = -0.5 * (tempGeo.boundingBox!.max.y - tempGeo.boundingBox!.min.y);
    tempGeo.dispose();

    shapes.forEach((shape) => {
      const shapePoints = shape.getSpacedPoints(Math.ceil(FONT_SIZE / 1.0));
      points.push(...shapePoints);
      if (shape.holes && shape.holes.length > 0) {
         shape.holes.forEach(hole => {
             points.push(...hole.getSpacedPoints(Math.ceil(FONT_SIZE / 1.0)));
         });
      }
    });

    const textPointsCount = points.length;
    const count = CONFIG.particleCount;
    const particlesForText = Math.floor(count * CONFIG.textParticleRatio);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      if (i < particlesForText && textPointsCount > 0) {
        // 组成文字的粒子
        const ptIndex = i % textPointsCount;
        const pt = points[ptIndex];
        
        // 散射逻辑
        const scatterX = (Math.random() - 0.5) * 8.0;
        const scatterY = (Math.random() - 0.5) * 8.0; 
        const scatterZ = (Math.random() - 0.5) * 30.0; // 稍微加厚 Z 轴

        targets[i3]     = pt.x + xMid + scatterX;
        targets[i3 + 1] = pt.y + yMid + scatterY;
        targets[i3 + 2] = 0 + scatterZ;
      } else {
        // 背景粒子 (即使在文字模式下，也有一部分粒子作为背景星空)
        const r = 600 + Math.random() * 1000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        targets[i3]     = r * Math.sin(phi) * Math.cos(theta);
        targets[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        targets[i3 + 2] = r * Math.cos(phi);
      }
    }
  };

  // 辅助占位
  const updateParticleTargets = (isText: boolean) => { /* logic moved to updateMode */ };

  return (
    <div 
      ref={mountRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 bg-black transition-opacity duration-1000"
      style={{ 
        // 深孔雀蓝渐变
        background: 'radial-gradient(circle at center, #001f2b 0%, #00080a 60%, #000000 100%)' 
      }} 
    />
  );
};