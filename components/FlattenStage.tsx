import React, { useMemo } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import { Value } from '../lib/dolphindbParser';
import { COLORS } from '../constants';
import { calculateLayout, getScalarNodes, StructureVisual } from './StructureVisual';

interface FlattenStageProps {
  progress: number; // 0 to 1
  logic: {
      input: Value | null;
      output: Value | null;
      error: string | null;
  };
}

export const FlattenStage: React.FC<FlattenStageProps> = ({ progress, logic }) => {
  if (logic.error || !logic.input || !logic.output) {
      return <Text color="red">{logic.error || 'No Data'}</Text>;
  }

  // Calculate layouts (Y is always 0, we position groups)
  const inputLayout = useMemo(() => calculateLayout(logic.input!, 0, 0), [logic.input]);
  const outputLayout = useMemo(() => calculateLayout(logic.output!, 0, 0), [logic.output]);

  // Center layouts
  const inputOffsetX = -inputLayout.width / 2;
  const outputOffsetX = -outputLayout.width / 2;

  // Map IDs to positions
  const nodePositions = useMemo(() => {
      const map = new Map<string, { start: [number, number, number], end: [number, number, number] }>();
      
      const inputScalars = getScalarNodes(inputLayout);
      const outputScalars = getScalarNodes(outputLayout);
      
      // Start positions (Input at y=1.5)
      inputScalars.forEach(n => {
          map.set(n.id, { 
              start: [n.x + inputOffsetX, 1.5, 0], 
              end: [n.x + inputOffsetX, 1.5, 0] 
          });
      });
      
      // End positions (Output at y=-1.5)
      outputScalars.forEach(n => {
          if (map.has(n.id)) {
              const entry = map.get(n.id)!;
              entry.end = [n.x + outputOffsetX, -1.5, 0];
          } else {
              // Should not happen
          }
      });
      
      return map;
  }, [inputLayout, outputLayout, inputOffsetX, outputOffsetX]);

  return (
    <group>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            flatten(X)
        </Text>

        {/* Input Structure (Static, Ghosted) */}
        <group position={[0, 1.5, 0]}>
             <StructureVisual node={inputLayout} opacity={0.2} />
             {/* Also render static scalars for input context */}
             {getScalarNodes(inputLayout).map(n => (
                 <group key={'static-' + n.id} position={[n.x + inputOffsetX, 0, 0]}>
                     <RoundedBox args={[0.8, 0.8, 0.1]} radius={0.1}>
                        <meshStandardMaterial color={COLORS.secondary} transparent opacity={0.2} />
                     </RoundedBox>
                     <Text position={[0, 0, 0.1]} fontSize={0.35} color="white" fillOpacity={0.2}>
                        {n.val}
                     </Text>
                 </group>
             ))}
        </group>

        {/* Output Structure (Fade In) */}
        <animated.group position={[0, -1.5, 0]} visible={progress > 0.1}>
             <StructureVisual node={outputLayout} opacity={progress} />
        </animated.group>

        {/* Animated Items (Moving from Input to Output) */}
        {Array.from(nodePositions.entries()).map(([id, pos]) => {
            const node = getScalarNodes(inputLayout).find(n => n.id === id) || getScalarNodes(outputLayout).find(n => n.id === id);
            if (!node) return null;
            
            return (
                <AnimatedItem 
                    key={id}
                    val={node.val}
                    startPos={pos.start}
                    endPos={pos.end}
                    progress={progress}
                />
            );
        })}
    </group>
  );
};

const AnimatedItem = ({ val, startPos, endPos, progress }: { 
    val: string | number, 
    startPos: [number, number, number], 
    endPos: [number, number, number], 
    progress: number 
}) => {
    const { pos } = useSpring({
        pos: progress > 0.5 ? endPos : startPos,
        config: config.wobbly
    });

    return (
        <animated.group position={pos}>
            <RoundedBox args={[0.8, 0.8, 0.1]} radius={0.1}>
                <meshStandardMaterial color={COLORS.primary} />
            </RoundedBox>
            <Text position={[0, 0, 0.1]} fontSize={0.35} color="white">
                {val}
            </Text>
        </animated.group>
    );
};
