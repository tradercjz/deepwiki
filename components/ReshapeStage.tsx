import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import { Value } from '../lib/dolphindbParser';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface ReshapeStageProps {
  progress: number;
  logic: {
      input: Value | null;
      dim: Value | null;
      output: Value | null;
      mapping: Map<string, string> | null;
      error: string | null;
  };
}

const CELL_SIZE = 0.8;
const GAP = 0.2;

export const ReshapeStage: React.FC<ReshapeStageProps> = ({ progress, logic }) => {
  if (logic.error || !logic.input || !logic.output || !logic.mapping) {
      return <Text color="red">{logic.error || 'No Data'}</Text>;
  }

  const input = logic.input;
  const outputMatrix = logic.output.val as Value[];
  const numOutputRows = outputMatrix.length;
  const numOutputCols = (outputMatrix[0].val as Value[]).length;

  // Calculate Output Dimensions
  const outputWidth = numOutputCols * (CELL_SIZE + GAP) - GAP;
  const outputHeight = numOutputRows * (CELL_SIZE + GAP) - GAP;
  const outputY = -2;

  // Helper for cell position
  const getCellPos = (r: number, c: number, rows: number, cols: number, yOffset: number): [number, number, number] => {
      const w = cols * (CELL_SIZE + GAP) - GAP;
      const h = rows * (CELL_SIZE + GAP) - GAP;
      const x = (c * (CELL_SIZE + GAP)) - w / 2 + CELL_SIZE / 2;
      const top = yOffset + h / 2;
      const cellY = top - CELL_SIZE / 2 - r * (CELL_SIZE + GAP);
      return [x, cellY, 0];
  };

  // Render Input Cells
  const inputCells = [];
  const inputY = 2;

  if (input.type === 'vector') {
      const vals = input.val as Value[];
      const n = vals.length;
      // Render as single row
      for (let i = 0; i < n; i++) {
          const val = vals[i];
          const pos = getCellPos(0, i, 1, n, inputY);
          
          // Find target position
          const targetId = logic.mapping.get(val.id);
          let targetPos: [number, number, number] = [0, 0, 0];
          
          // Find target in output matrix
          // We need to search outputMatrix for targetId
          let found = false;
          for (let r = 0; r < numOutputRows; r++) {
              const row = outputMatrix[r].val as Value[];
              for (let c = 0; c < numOutputCols; c++) {
                  if (row[c].id === targetId) {
                      targetPos = getCellPos(r, c, numOutputRows, numOutputCols, outputY);
                      found = true;
                      break;
                  }
              }
              if (found) break;
          }

          inputCells.push(
              <AnimatedCell 
                  key={`in-${i}`}
                  val={String(val.val)}
                  startPos={pos}
                  endPos={targetPos}
                  color={COLORS.primary}
                  progress={progress}
              />
          );
      }
  } else if (input.type === 'matrix') {
      // Input is Matrix (Columns)
      // But wait, useReshapeLogic treated input as columns.
      // But for rendering, we usually render rows.
      // If I want to visualize the "Column-major" nature, maybe I should render input as columns too?
      // Or just render as standard grid (Rows) and let the animation show the movement.
      // Let's render as standard grid.
      // But `input.val` is list of columns (from useReshapeLogic logic).
      // Wait, `parse` returns list of vectors.
      // In `useReshapeLogic`, I treated `input.val` as columns.
      // So `input.val[c].val[r]` is value at (r, c).
      
      const cols = input.val as Value[];
      const numInCols = cols.length;
      const numInRows = (cols[0].val as Value[]).length;

      for (let c = 0; c < numInCols; c++) {
          const col = cols[c].val as Value[];
          for (let r = 0; r < numInRows; r++) {
              const val = col[r];
              const pos = getCellPos(r, c, numInRows, numInCols, inputY);

              // Find target
              const targetId = logic.mapping.get(val.id);
              let targetPos: [number, number, number] = [0, 0, 0];
              let found = false;
              for (let or = 0; or < numOutputRows; or++) {
                  const orow = outputMatrix[or].val as Value[];
                  for (let oc = 0; oc < numOutputCols; oc++) {
                      if (orow[oc].id === targetId) {
                          targetPos = getCellPos(or, oc, numOutputRows, numOutputCols, outputY);
                          found = true;
                          break;
                      }
                  }
                  if (found) break;
              }

              inputCells.push(
                  <AnimatedCell 
                      key={`in-${r}-${c}`}
                      val={String(val.val)}
                      startPos={pos}
                      endPos={targetPos}
                      color={COLORS.primary}
                      progress={progress}
                  />
              );
          }
      }
  }

  // Output Placeholders (Ghost cells)
  const outputPlaceholders = [];
  for (let r = 0; r < numOutputRows; r++) {
      for (let c = 0; c < numOutputCols; c++) {
          const pos = getCellPos(r, c, numOutputRows, numOutputCols, outputY);
          outputPlaceholders.push(
              <group key={`ph-${r}-${c}`} position={pos}>
                  <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.05]} radius={0.1}>
                      <meshStandardMaterial color="#333" transparent opacity={0.5} />
                  </RoundedBox>
              </group>
          );
      }
  }

  return (
    <group>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            reshape(X, dim)
        </Text>

        {/* Input Cells (Animated) */}
        {inputCells}

        {/* Output Placeholders */}
        {outputPlaceholders}
        
        <Text position={[0, inputY + 2, 0]} fontSize={0.4} color="gray">Input</Text>
        <Text position={[0, outputY - 2, 0]} fontSize={0.4} color="gray">Output</Text>

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
