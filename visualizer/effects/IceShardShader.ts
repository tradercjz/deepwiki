import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export const IceShardMaterial = shaderMaterial(
  {
    uTime: 0,
    uGrowthY: -20,
    uColorBase: new THREE.Color('#78dce8'),  // 冰体基础色（蒂芙尼蓝）
    uColorRim: new THREE.Color('#ffffff'),   // 边缘反光色（纯白）
    uColorDeep: new THREE.Color('#005f99'),  // 内部深色（深蓝）
    uSunPosition: new THREE.Vector3(10, 20, 10),
  },
  // Vertex Shader: 处理冰柱的生长和位置
  `
    uniform float uTime;
    uniform float uGrowthY;
    
    // InstancedMesh 自带 instanceMatrix，但我们需要额外的属性
    attribute vec3 aTargetPos; // 最终位置
    attribute float aScale;    // 个体大小差异
    attribute float aRandom;   // 随机因子

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vFrozen;     // 冻结状态
    varying float vHeight;     // 相对高度

    // 伪随机
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        // --- 1. 计算生长逻辑 ---
        // 增加很多噪声，让生长线呈现参差不齐的"冰刺"感
        float noise = sin(aTargetPos.x * 0.3 + aTargetPos.z * 0.3) * 5.0;
        float triggerH = uGrowthY + noise;
        
        // 计算当前粒子是否被"冰封"
        // 这是一个从下往上的扫描
        float dist = aTargetPos.y - triggerH;
        
        // 状态转换：0 = 还是水汽，1 = 已经冻结
        float freeze = 1.0 - smoothstep(-2.0, 5.0, dist);
        vFrozen = freeze;

        // --- 2. 变换逻辑 ---
        vec3 pos = position; // 原始几何体顶点 (六棱柱)
        
        // A. 缩放动画：未冻结时是极小的水滴，冻结时瞬间变大成冰柱
        // 加上弹簧效果 (Overshoot)
        float scaleAnim = smoothstep(0.0, 1.0, freeze);
        // 让它像晶体生长一样"弹"出来
        float elastic = 1.0 + sin(scaleAnim * 3.14) * 0.3 * (1.0 - scaleAnim);
        
        // 在XZ平面稍微胖一点，Y轴稍微高一点
        pos *= aScale * elastic; 
        
        // 如果还没冻结，压扁成小水珠
        if (freeze < 0.1) {
            pos *= 0.1; 
        }

        // B. 位置动画
        // 未冻结：在地面附近漂浮 (水汽)
        vec3 waterPos = aTargetPos;
        waterPos.y = -15.0 + sin(uTime + aTargetPos.x) * 2.0; 
        waterPos.x += sin(uTime * 0.5 + aTargetPos.z) * 3.0;
        
        // 冻结：锁定到目标位置
        vec3 icePos = aTargetPos;

        // 混合最终位置
        vec3 instancePos = mix(waterPos, icePos, freeze);
        
        // 应用 Instance 变换 (我们手动计算位置偏移，不使用 instanceMatrix 的位移，只用它的旋转)
        // 这里简化：假设 instanceMatrix 主要是单位矩阵，我们直接加偏移
        vec4 worldPosition = instanceMatrix * vec4(pos, 1.0);
        worldPosition.xyz += instancePos; 

        vec4 mvPosition = viewMatrix * modelMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;

        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vViewPosition = -mvPosition.xyz;
        vHeight = aTargetPos.y;
    }
  `,
  // Fragment Shader: 物理感冰雪渲染
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorRim;
    uniform vec3 uColorDeep;
    uniform vec3 uSunPosition;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vFrozen;

    void main() {
        // 如果还没冻结，极其透明(水汽)
        if (vFrozen < 0.01) discard;

        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);
        vec3 sunDir = normalize(uSunPosition);

        // --- 1. 冰的质感核心：菲涅尔效应 (Fresnel) ---
        // 视线与法线垂直的地方(边缘)最亮，模拟冰的折射
        float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
        
        // --- 2. 漫反射 (Diffuse) ---
        // 半透光材质，背光面也能透一点光
        float diffuse = dot(normal, sunDir) * 0.5 + 0.5;

        // --- 3. 颜色混合 ---
        // 核心色 + 边缘高光
        vec3 color = mix(uColorDeep, uColorBase, diffuse);
        color = mix(color, uColorRim, fresnel);

        // 冻结瞬间的高光爆发 (Flash)
        // 在 vFrozen 刚接近 1.0 的边缘，叠加超亮白色
        float flash = 1.0 - abs(vFrozen * 2.0 - 1.0); // 钟形曲线
        flash = pow(flash, 10.0);
        color += vec3(1.0) * flash * 2.0;

        // --- 4. Alpha ---
        // 冰是半透明的，边缘不透明，中间透明
        float alpha = 0.6 + fresnel * 0.4;
        
        gl_FragColor = vec4(color, alpha);
        
        // 简单的 Tone Mapping 模拟
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2));
    }
  `
);

extend({ IceShardMaterial });