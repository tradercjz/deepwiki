import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// 1. GLSL 着色器代码
// ======================
const vertexShader = `
  // Uniforms: values passed from React
  uniform float uTime;
  uniform float uMorphProgress;
  
  // Attributes: data for each individual particle
  attribute vec3 aTargetPosition; // The "home" position on the letter
  attribute float aRandom;        // A random value for unique movement

  varying float vAlpha; // Pass alpha to the fragment shader

  // Simplex Noise function for organic movement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Chaos state: particles drifting in a noise field
    vec3 chaosPosition = position;
    chaosPosition.x += snoise(vec3(position.y * 0.2, uTime * 0.1, aRandom)) * 1.5;
    chaosPosition.y += snoise(vec3(position.x * 0.2, uTime * 0.1, aRandom)) * 1.5;
    chaosPosition.z += snoise(vec3(position.x * 0.2, position.y * 0.2, uTime * 0.1 + aRandom)) * 1.5;
    
    // ✨ The core interpolation logic
    vec3 finalPosition = mix(chaosPosition, aTargetPosition, uMorphProgress);

    // Make particles smaller as they approach their target
    float pointSize = mix(7.0, 4.0, uMorphProgress);
    
    // Project the final position
    vec4 modelPosition = modelMatrix * vec4(finalPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    gl_PointSize = pointSize * (1.0 / -viewPosition.z); // Perspective scaling

    vAlpha = smoothstep(0.0, 0.2, uMorphProgress);
  }
`;

const fragmentShader = `
  varying float vAlpha;

  void main() {
    // A soft, circular particle shape
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.4, dist);

    gl_FragColor = vec4(0.5, 0.8, 1.0, alpha * vAlpha); // Light blue color
  }
`;

// 2. The React Component
// =========================
const ParticleText = () => {
  const pointsRef = useRef<THREE.Points>(null!);

  // ✨ Get text pixel data using a hidden 2D canvas
  const particleData = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const font = 'bold 120px "Montserrat", sans-serif'; // A good, bold font
    canvas.width = 1200;
    canvas.height = 300;
    
    context.font = font;
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('DOLPHINDB', canvas.width / 2, canvas.height / 2);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const positions = [];
    for (let y = 0; y < imageData.height; y += 3) { // Increase step for fewer particles
      for (let x = 0; x < imageData.width; x += 3) {
        if (imageData.data[(y * imageData.width + x) * 4 + 3] > 128) {
          const posX = (x - canvas.width / 2) * 0.05;
          const posY = -(y - canvas.height / 2) * 0.05;
          positions.push([posX, posY, 0]);
        }
      }
    }
    return positions;
  }, []);

  // ✨ Prepare buffer attributes for the particles
  const [positions, targetPositions, randoms] = useMemo(() => {
    const count = particleData.length;
    const initialPos = new Float32Array(count * 3);
    const targetPos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Initial "chaos" position
      initialPos[i * 3 + 0] = (Math.random() - 0.5) * 20;
      initialPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      initialPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // "Order" position from text data
      targetPos[i * 3 + 0] = particleData[i][0];
      targetPos[i * 3 + 1] = particleData[i][1];
      targetPos[i * 3 + 2] = particleData[i][2];

      randoms[i] = Math.random();
    }
    
    return [initialPos, targetPos, randoms];
  }, [particleData]);
  
  // Animation loop
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cycleDuration = 8; // 8 second loop
    const phase = (t % cycleDuration) / cycleDuration;
    
    let morphProgress = 0;
    if (phase < 0.6) { // 60% of time to form
        morphProgress = phase / 0.6;
    } else { // 40% of time to dissolve
        morphProgress = 1.0 - ((phase - 0.6) / 0.4);
    }
    
    // Apply an ease-in-out curve
    const easedProgress = morphProgress < 0.5 ? 4 * morphProgress * morphProgress * morphProgress : 1 - Math.pow(-2 * morphProgress + 2, 3) / 2;

    (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uMorphProgress.value = easedProgress;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPosition" count={targetPositions.length / 3} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uMorphProgress: { value: 0 },
        }}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// 3. The main component
// ========================
export const GenerativeLogoBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-[-10] bg-[#020617]">
      <Canvas camera={{ position: [0, 0, 25] }}>
        <ParticleText />
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.1} luminanceSmoothing={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};