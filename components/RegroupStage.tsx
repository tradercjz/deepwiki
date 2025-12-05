import React, { useMemo, useState } from 'react';
import { Text, RoundedBox, Html } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import { Value } from '../lib/dolphindbParser';
import { COLORS } from '../constants';
import * as THREE from 'three';

const AnimatedText = animated(Text);

interface RegroupStageProps {
  progress: number; // 0 to 1
  logic: {
      input: Value | null;
      labels: Value | null;
      output: Value | null;
      groups: Map<string, number[]> | null;
      sourceMap: Map<string, string[]> | null;
      error: string | null;
  };
  byRow: boolean;
}

const CELL_SIZE = 0.8;
const GAP = 0.2;

export const RegroupStage: React.FC<RegroupStageProps> = ({ progress, logic, byRow }) => {
  const [hoveredCell, setHoveredCell] = useState<{ id: string, val: string, sources: string[] } | null>(null);

  if (logic.error || !logic.input || !logic.output || !logic.labels || !logic.groups || !logic.sourceMap) {
      return <Text color="red">{logic.error || 'No Data'}</Text>;
  }

  const inputMatrix = logic.input.val as Value[];
  const outputMatrix = logic.output.val as Value[];
  const labelVals = logic.labels.val as Value[];
  
  const numInputRows = inputMatrix.length;
  const numInputCols = (inputMatrix[0].val as Value[]).length;
  
  const numOutputRows = outputMatrix.length;
  const numOutputCols = (outputMatrix[0].val as Value[]).length;

  // Calculate dimensions
  const inputWidth = numInputCols * (CELL_SIZE + GAP) - GAP;
  const inputHeight = numInputRows * (CELL_SIZE + GAP) - GAP;
  
  const outputWidth = numOutputCols * (CELL_SIZE + GAP) - GAP;
  const outputHeight = numOutputRows * (CELL_SIZE + GAP) - GAP;

  // Center positions
  const inputY = 2;
  const outputY = -2;
  
  // Generate colors for groups
  const groupColors = useMemo(() => {
      const colors = new Map<string, string>();
      const palette = [COLORS.primary, COLORS.secondary, '#4ecdc4', '#ff6b6b', '#ffe66d'];
      let i = 0;
      logic.groups!.forEach((_, key) => {
          colors.set(key, palette[i % palette.length]);
          i++;
      });
      return colors;
  }, [logic.groups]);

  // Helper to get position of a cell in a matrix (centered)
  const getCellPos = (r: number, c: number, rows: number, cols: number, yOffset: number): [number, number, number] => {
      const w = cols * (CELL_SIZE + GAP) - GAP;
      const h = rows * (CELL_SIZE + GAP) - GAP;
      const x = (c * (CELL_SIZE + GAP)) - w / 2 + CELL_SIZE / 2;
      const y = yOffset - ((r * (CELL_SIZE + GAP)) - h / 2 + CELL_SIZE / 2);
      const top = yOffset + h / 2;
      const cellY = top - CELL_SIZE / 2 - r * (CELL_SIZE + GAP);
      return [x, cellY, 0];
  };

  // Render Input Cells
  const inputCells = [];
  for (let r = 0; r < numInputRows; r++) {
      const row = inputMatrix[r].val as Value[];
      for (let c = 0; c < numInputCols; c++) {
          const val = row[c];
          const pos = getCellPos(r, c, numInputRows, numInputCols, inputY);
          
          // Determine color based on label
          let labelVal = '';
          if (byRow) {
              labelVal = String(labelVals[r].val);
          } else {
              labelVal = String(labelVals[c].val);
          }
          const baseColor = groupColors.get(labelVal) || 'gray';

          // Highlight logic
          let isHighlighted = false;
          let isDimmed = false;
          if (hoveredCell) {
              if (hoveredCell.sources.includes(val.id)) {
                  isHighlighted = true;
              } else {
                  isDimmed = true;
              }
          }

          const color = isHighlighted ? '#ffffff' : (isDimmed ? '#444444' : baseColor);
          const scale = isHighlighted ? 1.1 : 1;

          // Target position in output
          const groupKeys = Array.from(logic.groups!.keys());
          const groupIndex = groupKeys.indexOf(labelVal);
          
          let targetR, targetC;
          if (byRow) {
              targetR = groupIndex;
              targetC = c;
          } else {
              targetR = r;
              targetC = groupIndex;
          }
          
          const targetPos = getCellPos(targetR, targetC, numOutputRows, numOutputCols, outputY);

          inputCells.push(
              <AnimatedCell 
                  key={`in-${r}-${c}`}
                  val={String(val.val)}
                  startPos={pos}
                  endPos={targetPos}
                  color={color}
                  progress={progress}
                  scale={scale}
              />
          );
      }
  }

  // Render Labels
  const labelVisuals = [];
  if (byRow) {
      // Labels on left of rows
      for (let r = 0; r < numInputRows; r++) {
          const pos = getCellPos(r, 0, numInputRows, numInputCols, inputY);
          const x = -inputWidth / 2 - 1.0; // Left of matrix
          const y = pos[1];
          const val = String(labelVals[r].val);
          const color = groupColors.get(val) || 'white';
          
          labelVisuals.push(
              <group key={`lbl-row-${r}`} position={[x, y, 0]}>
                  <Text fontSize={0.4} color={color} anchorX="right">{val}</Text>
              </group>
          );
      }
  } else {
      // Labels on top of cols
      for (let c = 0; c < numInputCols; c++) {
          const pos = getCellPos(0, c, numInputRows, numInputCols, inputY);
          const x = pos[0];
          const y = inputY + inputHeight / 2 + 0.5; // Top of matrix
          const val = String(labelVals[c].val);
          const color = groupColors.get(val) || 'white';

          labelVisuals.push(
              <group key={`lbl-col-${c}`} position={[x, y, 0]}>
                  <Text fontSize={0.4} color={color} anchorY="bottom">{val}</Text>
              </group>
          );
      }
  }

  // Render Output Cells (Fade in)
  const outputCells = [];
  for (let r = 0; r < numOutputRows; r++) {
      const row = outputMatrix[r].val as Value[];
      for (let c = 0; c < numOutputCols; c++) {
          const val = row[c];
          const pos = getCellPos(r, c, numOutputRows, numOutputCols, outputY);
          
          // Determine color
          let labelVal = '';
          const groupKeys = Array.from(logic.groups!.keys());
          if (byRow) {
              labelVal = groupKeys[r];
          } else {
              labelVal = groupKeys[c];
          }
          const baseColor = groupColors.get(labelVal) || 'gray';
          
          const isHovered = hoveredCell?.id === val.id;
          const color = isHovered ? '#ffffff' : baseColor;

          outputCells.push(
              <group key={`out-${r}-${c}`} position={pos}>
                  <animated.group visible={progress > 0.8}>
                      <mesh
                        onPointerOver={() => {
                            const sources = logic.sourceMap!.get(val.id) || [];
                            setHoveredCell({ id: val.id, val: String(val.val), sources });
                        }}
                        onPointerOut={() => setHoveredCell(null)}
                      >
                        <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.1]} radius={0.1}>
                            <meshStandardMaterial color={color} />
                        </RoundedBox>
                      </mesh>
                      <Text position={[0, 0, 0.1]} fontSize={0.35} color="black">
                          {String(val.val)}
                      </Text>
                      {isHovered && (
                          <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
                              <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs whitespace-nowrap border border-gray-600">
                                  Result: {String(val.val)}<br/>
                                  Sources: {logic.sourceMap!.get(val.id)?.length} cells
                              </div>
                          </Html>
                      )}
                  </animated.group>
              </group>
          );
      }
  }

  return (
    <group>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            regroup(X, label, func, byRow={byRow ? 'true' : 'false'})
        </Text>

        {/* Labels */}
        {labelVisuals}

        {/* Input Cells (Animated) */}
        {inputCells}

        {/* Output Cells (Static/FadeIn) */}
        {outputCells}
        
        {/* Label for Input/Output */}
        <Text position={[-inputWidth/2 - 2, inputY, 0]} fontSize={0.4} color="gray" rotation={[0,0,Math.PI/2]}>Input</Text>
        <Text position={[-outputWidth/2 - 2, outputY, 0]} fontSize={0.4} color="gray" rotation={[0,0,Math.PI/2]}>Output</Text>

    </group>
  );
};

const AnimatedCell = ({ val, startPos, endPos, color, progress, scale }: { 
    val: string, 
    startPos: [number, number, number], 
    endPos: [number, number, number], 
    color: string,
    progress: number,
    scale: number
}) => {
    
    const { pos, opacity, s } = useSpring({
        pos: progress < 0.2 ? startPos : endPos,
        opacity: progress > 0.8 ? 0 : 1,
        s: scale,
        config: config.gentle
    });

    return (
        <animated.group position={pos} scale={s}>
            <animated.mesh>
                <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.1]} radius={0.1}>
                    <animated.meshStandardMaterial color={color} transparent opacity={opacity} />
                </RoundedBox>
            </animated.mesh>
            <animated.group>
                {/* @ts-ignore */}
                <AnimatedText position={[0, 0, 0.1]} fontSize={0.35} color="black" fillOpacity={opacity}>
                    {val}
                </AnimatedText>
            </animated.group>
        </animated.group>
    );
};
