
import React from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';

const IceGround: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={512} // Optimized resolution
        mixBlur={1}
        mixStrength={40}
        roughness={0.05}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#cff0ff"
        metalness={0.9}
        distortion={0.05}
      />
    </mesh>
  );
};

export default IceGround;
