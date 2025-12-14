import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export const IceTerrainMaterial = shaderMaterial(
  {
    uScroll: 0, // 用这个替代 uTime 来控制滚动，方便由 JS 操控停止
    uColorDeep: new THREE.Color('#005f99'),  // 冰裂缝/深处 (深蓝)
    uColorMid: new THREE.Color('#aeeeff'),   // 冰面 (浅青)
    uColorSnow: new THREE.Color('#ffffff'),  // 雪顶 (纯白)
    uFogColor: new THREE.Color('#cdebf9'),   // 雾色 (必须匹配背景)
    uFogNear: 20,
    uFogFar: 100,
  },
  // Vertex Shader
  `
    uniform float uScroll;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vViewPosition;
    varying vec3 vNormal;

    // 噪声函数
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // 这里的 uScroll 控制向前移动的感觉
      // 我们只移动噪声采样的坐标，不移动物理网格，这样更平滑
      vec2 noiseUV = uv;
      noiseUV.y += uScroll * 0.1; 
      
      // 地形生成逻辑：更尖锐的冰川
      float e = snoise(noiseUV * 4.0) * 1.5;
      e += snoise(noiseUV * 10.0) * 0.3;
      e = max(-0.5, e); // 切平底部，形成冰原
      
      // 在中心位置挖一条"路"给摄像机
      float road = 1.0 - smoothstep(0.4, 0.6, abs(uv.x - 0.5));
      e *= (1.0 - road * 0.8); // 压低中间

      pos.z += e * 8.0; // 高度

      vElevation = pos.z;
      
      // 计算简单的法线模拟（用于光照）
      vNormal = normalize(vec3(e, 1.0, e)); 

      vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vViewPosition = -mvPosition.xyz;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorDeep;
    uniform vec3 uColorMid;
    uniform vec3 uColorSnow;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;

    varying float vElevation;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      // 1. 基于高度的颜色混合
      // 低处(负值)是深蓝裂隙
      // 中处是冰面
      // 高处是白雪
      
      float mixSnow = smoothstep(1.0, 5.0, vElevation);
      float mixDeep = smoothstep(-2.0, 1.0, vElevation);
      
      vec3 color = mix(uColorDeep, uColorMid, mixDeep);
      color = mix(color, uColorSnow, mixSnow);
      
      // 2. 增加一点"冰面闪烁" (Specular/Sparkle)
      // 利用 vUv 生成高频噪声
      float sparkle = sin(vUv.x * 200.0) * cos(vUv.y * 200.0);
      if (sparkle > 0.95) {
          color += vec3(0.4); // 细微的闪光点
      }

      // 3. 简单的假光照 (Fake Lighting)
      // 模拟阳光从头顶照下来
      color *= 0.8 + 0.4 * mixDeep; // 低处暗，高处亮

      // 4. 距离雾 (必须有，否则边缘生硬)
      float depth = length(vViewPosition);
      float fogFactor = smoothstep(uFogNear, uFogFar, depth);
      
      gl_FragColor = vec4(mix(color, uFogColor, fogFactor), 1.0);
    }
  `
);

extend({ IceTerrainMaterial });