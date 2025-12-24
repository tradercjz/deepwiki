
import React from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';

const IceGround: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      {/* 
         ✨ 优化重点：
         1. resolution: 降低反射纹理的分辨率 (512 -> 256)
         2. mirror: 稍微降低反射率
         3. blur: 减少模糊计算开销
      */}
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={256} // ✨ 关键：降低到 256，视觉差别不大但性能提升巨大
        mixBlur={1}
        mixStrength={30} // 降低混合强度
        roughness={0.1} // 稍微粗糙一点，减少高光计算压力
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#cff0ff"
        metalness={0.8}
        distortion={0} // ✨ 关键：关闭扭曲计算，非常省资源
      />
    </mesh>
  );
};

export default IceGround;
