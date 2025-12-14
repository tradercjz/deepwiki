// src/visualizer/effects/IceParticleShader.ts
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export const IceParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uGrowthY: -20, // 生长高度
    uColorMist: new THREE.Color('#e0f7ff'), // 雾气白
    uColorIce: new THREE.Color('#44ddff'),  // 冰晶青
    uColorDeep: new THREE.Color('#0066aa'), // 深海蓝
    uPixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uGrowthY;
    uniform float uPixelRatio;
    
    attribute vec3 aTargetPosition; // 文字位置
    attribute float aSpeed;
    attribute float aSize;
    attribute float aRandom; // 随机值 0-1

    varying float vFrozen; // 进度
    varying float vAlpha;
    varying float vSparkle; // 闪烁系数

    // 噪声函数
    float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
    }

    void main() {
        // --- 冰霜生长逻辑 ---
        // 增加噪声，让生长线参差不齐
        float jagged = sin(aTargetPosition.x * 0.5) * 5.0 + cos(aTargetPosition.z * 0.5) * 5.0;
        float triggerHeight = uGrowthY + jagged;
        
        // 计算冻结进度：从地面向上
        // 文字底部的粒子先冻结
        float dist = aTargetPosition.y - triggerHeight;
        float freeze = 1.0 - smoothstep(-5.0, 5.0, dist);
        vFrozen = freeze;

        // --- 位置计算 ---
        vec3 pos = aTargetPosition;
        
        // 状态A: 没冻结时，是弥散在地面上的冰雾
        // 利用噪声让它们在地面附近流动
        vec3 mistPos = aTargetPosition;
        mistPos.y = -25.0 + sin(uTime * 2.0 + aTargetPosition.x) * 2.0; // 压低在地面
        mistPos.x += sin(uTime + aTargetPosition.z * 0.5) * 5.0; // 左右飘荡
        mistPos.z += cos(uTime + aTargetPosition.x * 0.5) * 5.0;

        // 混合
        // 加入一点弹力效果 (Elastic effect)
        float elastic = 1.0 + sin(freeze * 3.1415) * 0.2 * (1.0 - freeze); // 冻结瞬间稍微弹一下
        vec3 finalPos = mix(mistPos, pos * vec3(1.0, elastic, 1.0), freeze);

        // 冲击波扩散：在冻结发生的边缘，粒子向外鼓起
        float rim = 1.0 - abs(freeze * 2.0 - 1.0);
        rim = pow(rim, 5.0);
        finalPos += normalize(pos) * rim * 3.0;

        vec4 mvPosition = viewMatrix * modelMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // --- 大小与闪烁 ---
        // 冰晶比雾气更锐利更小，但边缘处(rim)巨大
        float sizeBase = aSize * uPixelRatio;
        float sizeState = mix(8.0, 4.0, freeze); // 雾大，冰小
        float sizeBloom = rim * 30.0; // 边缘爆发
        
        gl_PointSize = (sizeBase * sizeState + sizeBloom) * (100.0 / -mvPosition.z);

        // 随机闪烁 (Sparkle)
        vSparkle = sin(uTime * 10.0 * aSpeed + aRandom * 100.0) * 0.5 + 0.5;
        
        // 深度淡出
        vAlpha = smoothstep(150.0, 80.0, -mvPosition.z);
    }
  `,
  // Fragment Shader: 绘制晶体形状
  `
    uniform vec3 uColorMist;
    uniform vec3 uColorIce;
    uniform vec3 uColorDeep;
    
    varying float vFrozen;
    varying float vAlpha;
    varying float vSparkle;

    void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);

        // --- 核心：绘制星形冰晶 (Diamond/Star Shape) ---
        // 距离场公式：|x|^0.5 + |y|^0.5 产生内凹星形
        float star = pow(abs(uv.x), 0.7) + pow(abs(uv.y), 0.7);
        
        // 雾气状态用圆形(d)，冰晶状态用星形(star)
        float shape = mix(d * 2.0, star, vFrozen);
        
        // 边缘裁剪：冰晶边缘非常硬
        float hardness = mix(0.4, 0.05, vFrozen);
        float alpha = 1.0 - smoothstep(0.5 - hardness, 0.5, shape);

        // --- 颜色处理 ---
        // 雾：白 -> 冰：青 -> 深处：蓝
        vec3 color = mix(uColorMist, uColorIce, vFrozen);
        
        // 边缘高光 (Rim Light): 在冻结瞬间变成纯白
        float edge = 1.0 - abs(vFrozen * 2.0 - 1.0);
        edge = pow(edge, 8.0);
        color += vec3(1.0) * edge * 2.0; // 强光，配合 Bloom

        // 闪烁效果 (只在冰晶状态下闪)
        color += vec3(0.5) * vSparkle * vFrozen;

        // 最终输出
        gl_FragColor = vec4(color, alpha * vAlpha * (0.4 + 0.6 * vFrozen));

        if (gl_FragColor.a < 0.01) discard;
    }
  `
);

extend({ IceParticleMaterial });