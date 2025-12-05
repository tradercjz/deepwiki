import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import { Value } from '../lib/dolphindbParser';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface ShuffleStageProps {
  progress: number;
  logic: {
      input: Value | null;
      output: Value | null;
      mapping: Map<string, string> | null;
      error: string | null;
  };
}

const CELL_SIZE = 0.8;
const GAP = 0.2;

export const ShuffleStage: React.FC<ShuffleStageProps> = ({ progress, logic }) => {
  if (logic.error || !logic.input || !logic.output || !logic.mapping) {
      return <Text color="red">{logic.error || 'No Data'}</Text>;
  }

  const inputVals = logic.input.val as Value[];
  const outputVals = logic.output.val as Value[];
  const n = inputVals.length;

  // Calculate dimensions
  const width = n * (CELL_SIZE + GAP) - GAP;
  const inputY = 1.5;
  const outputY = -1.5;

  // Helper for cell position
  const getCellPos = (index: number, y: number): [number, number, number] => {
      const x = (index * (CELL_SIZE + GAP)) - width / 2 + CELL_SIZE / 2;
      return [x, y, 0];
  };

  // Render Input Cells (Animated)
  const cells = [];
  for (let i = 0; i < n; i++) {
      const val = inputVals[i];
      const pos = getCellPos(i, inputY);
      
      // Find target position
      const targetId = logic.mapping.get(val.id);
      let targetPos: [number, number, number] = [0, 0, 0];
      
      // Find target index in output
      const targetIndex = outputVals.findIndex(v => v.id === targetId);
      if (targetIndex !== -1) {
          targetPos = getCellPos(targetIndex, outputY);
      }

      cells.push(
          <AnimatedCell 
              key={`cell-${i}`}
              val={String(val.val)}
              startPos={pos}
              endPos={targetPos}
              color={COLORS.primary}
              progress={progress}
          />
      );
  }

  // Output Placeholders
  const outputPlaceholders = [];
  for (let i = 0; i < n; i++) {
      const pos = getCellPos(i, outputY);
      outputPlaceholders.push(
          <group key={`ph-${i}`} position={pos}>
              <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.05]} radius={0.1}>
                  <meshStandardMaterial color="#333" transparent opacity={0.5} />
              </RoundedBox>
          </group>
      );
  }

  return (
    <group>
        <Text position={[0, 4, 0]} fontSize={0.6} color="white" fontWeight="bold">
            shuffle(X)
        </Text>

        {/* Cells */}
        {cells}

        {/* Output Placeholders */}
        {outputPlaceholders}
        
        <Text position={[-width/2 - 1.5, inputY, 0]} fontSize={0.4} color="gray">Input</Text>
        <Text position={[-width/2 - 1.5, outputY, 0]} fontSize={0.4} color="gray">Output</Text>

    </group>
  );
};

const AnimatedCell = ({ val, startPos, endPos, color, progress }: { 
    val: string, 
    startPos: [number, number, number], 
    endPos: [number, number, number], 
    color: string,
    progress: number
}) => {
    
    const { pos } = useSpring({
        pos: progress < 0.5 ? startPos : endPos,
        config: config.gentle
    });

    return (
        <animated.group position={pos}>
            <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.1]} radius={0.1}>
                <meshStandardMaterial color={color} />
            </RoundedBox>
            {/* @ts-ignore */}
            <AnimatedText position={[0, 0, 0.1]} fontSize={0.35} color="black">
                {val}
            </AnimatedText>
        </animated.group>
    );
};
