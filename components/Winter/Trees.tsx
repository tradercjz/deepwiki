
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

export const MiniPerson: React.FC<{ 
  position: [number, number, number]; 
  shirtColor?: string; 
  scale?: number;
  headRotationY?: number; 
}> = ({ position, shirtColor = "#3b82f6", scale = 1, headRotationY = 0 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[-0.15, 0.3, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
      </mesh>
      <mesh position={[0.15, 0.3, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      <group position={[0, 1.6, 0]} rotation={[0, headRotationY, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.7} />
        </mesh>
        <mesh position={[-0.12, 0.05, 0.23]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.12, 0.05, 0.23]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
      <mesh position={[-0.4, 1.6, 0]} castShadow>
        <boxGeometry args={[0.18, 0.8, 0.18]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.4, 1.6, 0]} castShadow>
        <boxGeometry args={[0.18, 0.8, 0.18]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
    </group>
  );
};

const Trees: React.FC = () => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const bottomRef = useRef<THREE.InstancedMesh>(null);
  const topRef = useRef<THREE.InstancedMesh>(null);

  const count = 60;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const treeData = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = (Math.random() - 0.5) * 180;
      const z = side === 1 ? -40 - Math.random() * 30 : 40 + Math.random() * 30;
      return {
        position: [x, -0.1, z] as [number, number, number],
        scale: 1 + Math.random() * 2.5
      };
    });
  }, []);

  useEffect(() => {
    if (!trunkRef.current || !bottomRef.current || !topRef.current) return;

    treeData.forEach((data, i) => {
      dummy.scale.set(data.scale, data.scale, data.scale);
      dummy.position.set(...data.position);
      
      // Update Trunks
      dummy.position.y = -0.1 + (0.4 * data.scale);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      // Update Bottom Cones
      dummy.position.y = -0.1 + (1.2 * data.scale);
      dummy.updateMatrix();
      bottomRef.current!.setMatrixAt(i, dummy.matrix);

      // Update Top Cones
      dummy.position.y = -0.1 + (1.8 * data.scale);
      dummy.updateMatrix();
      topRef.current!.setMatrixAt(i, dummy.matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    bottomRef.current.instanceMatrix.needsUpdate = true;
    topRef.current.instanceMatrix.needsUpdate = true;
  }, [treeData, dummy]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#2d1b0d" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bottomRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.8, 1.5, 4]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={topRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.6, 1.2, 4]} />
        <meshStandardMaterial color="#065f46" roughness={0.8} />
      </instancedMesh>
    </group>
  );
};

export default Trees;
