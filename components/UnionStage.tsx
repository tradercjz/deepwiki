import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface UnionStageProps {
  progress: number;
  logic: any;
}

const Element: React.FC<{
  val: any;
  position: [number, number, number];
  color: string;
  opacity?: number;
  scale?: number;
}> = ({ val, position, color, opacity = 1, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <RoundedBox args={[0.6, 0.6, 0.1]} radius={0.1}>
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </RoundedBox>
      <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" fillOpacity={opacity}>{val}</Text>
    </group>
  );
};

export const UnionStage: React.FC<UnionStageProps> = ({ progress, logic }) => {
  const { X, Y, result, error } = logic;

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!X || !Y) return null;

  // Layout
  const xStartPos = new THREE.Vector3(-3, 1, 0);
  const yStartPos = new THREE.Vector3(3, 1, 0);
  const resultStartPos = new THREE.Vector3(0, -2, 0);

  const getGridPos = (idx: number, start: THREE.Vector3) => {
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    return new THREE.Vector3(
      start.x + (col * 0.8 - 1.5),
      start.y - row * 0.8,
      start.z
    );
  };

  // Map values to result indices to find target for duplicates
  const valToResultIdx = new Map();
  result.forEach((val: any, idx: number) => {
    if (!valToResultIdx.has(val)) {
      valToResultIdx.set(val, idx);
    }
  });

  // Animation Logic
  // 0-1: Static X and Y
  // 1-2: X moves to Result
  // 2-3: Y moves to Result

  const renderElements = (source: any[], startPos: THREE.Vector3, startTime: number, color: string) => {
    return source.map((item: any, idx: number) => {
      const initialPos = getGridPos(idx, startPos);
      
      let currentPos = initialPos;
      let opacity = 1;
      let scale = 1;

      if (progress > startTime) {
        const t = Math.min(Math.max(progress - startTime, 0), 1);
        
        // Target position in Result
        const resultIdx = valToResultIdx.get(item.val);
        const targetPos = getGridPos(resultIdx, resultStartPos);

        // Interpolate
        currentPos = new THREE.Vector3().lerpVectors(initialPos, targetPos, t);

        // If duplicate, fade out near the end
        if (item.isDuplicate) {
           if (t > 0.8) {
             opacity = 1 - (t - 0.8) * 5; // Fade out from 0.8 to 1.0
             scale = 1 + (t - 0.8); // Expand slightly
           }
        }
      }

      return (
        <Element 
          key={`${startTime}-${idx}`} 
          val={item.val} 
          position={[currentPos.x, currentPos.y, currentPos.z]} 
          color={color}
          opacity={opacity}
          scale={scale}
        />
      );
    });
  };

  return (
    <group>
      <Text position={[0, 4, 0]} fontSize={0.5} color="white">
        union(X, Y)
      </Text>

      <Text position={[-3, 2.5, 0]} fontSize={0.3} color="white">X</Text>
      <Text position={[3, 2.5, 0]} fontSize={0.3} color="white">Y</Text>
      <Text position={[0, -0.5, 0]} fontSize={0.3} color="white">Result</Text>

      {/* Static X and Y */}
      {X.map((item: any, idx: number) => {
        const pos = getGridPos(idx, xStartPos);
        return <Element key={`x-static-${idx}`} val={item.val} position={[pos.x, pos.y, pos.z]} color={COLORS.primary} opacity={0.3} />;
      })}
      {Y.map((item: any, idx: number) => {
        const pos = getGridPos(idx, yStartPos);
        return <Element key={`y-static-${idx}`} val={item.val} position={[pos.x, pos.y, pos.z]} color={COLORS.secondary} opacity={0.3} />;
      })}

      {/* Moving Elements */}
      {renderElements(X, xStartPos, 1, COLORS.primary)}
      {renderElements(Y, yStartPos, 2, COLORS.secondary)}
      
      {/* Show Result placeholders or final state? 
          Actually, the moving elements form the result. 
          But we might want to show the "slots" of the result.
      */}
      {progress >= 0 && result.map((val: any, idx: number) => {
         const pos = getGridPos(idx, resultStartPos);
         return (
           <group key={`res-${idx}`} position={[pos.x, pos.y, pos.z - 0.1]}>
             <RoundedBox args={[0.6, 0.6, 0.1]} radius={0.1}>
               <meshStandardMaterial color="#333" />
             </RoundedBox>
           </group>
         );
      })}

    </group>
  );
};
