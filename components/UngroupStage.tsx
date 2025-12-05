import React, { useState } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import { Value } from '../lib/dolphindbParser';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface UngroupStageProps {
  progress: number;
  logic: {
      inputIDs: Value | null;
      inputValues: Value | null;
      outputIDs: Value | null;
      outputValues: Value | null;
      idMapping: Map<string, string[]> | null;
      valMapping: Map<string, string> | null;
      sourceIndices: number[] | null;
      error: string | null;
  };
}

const CELL_SIZE = 0.8;
const GAP = 0.2;

export const UngroupStage: React.FC<UngroupStageProps> = ({ progress, logic }) => {
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);

  if (logic.error || !logic.inputIDs || !logic.inputValues || !logic.outputIDs || !logic.outputValues || !logic.idMapping || !logic.valMapping || !logic.sourceIndices) {
      return <Text color="red">{logic.error || 'No Data'}</Text>;
  }

  const inputIDVals = logic.inputIDs.val as Value[];
  const inputValGroups = logic.inputValues.val as Value[];
  const outputIDVals = logic.outputIDs.val as Value[];
  const outputValVals = logic.outputValues.val as Value[];

  const numInputRows = inputIDVals.length;
  const numOutputRows = outputIDVals.length;

  // Layout
  const inputX = -4;
  const outputX = 2;
  const startY = 3;

  // Helper for cell position
  const getInputIDPos = (index: number): [number, number, number] => {
      return [inputX, startY - index * (CELL_SIZE + GAP), 0];
  };

  const getInputValuePos = (rowIndex: number, colIndex: number): [number, number, number] => {
      return [inputX + (colIndex + 1) * (CELL_SIZE + GAP) + 0.5, startY - rowIndex * (CELL_SIZE + GAP), 0];
  };

  const getOutputIDPos = (index: number): [number, number, number] => {
      return [outputX, startY - index * (CELL_SIZE + GAP), 0];
  };

  const getOutputValuePos = (index: number): [number, number, number] => {
      return [outputX + (CELL_SIZE + GAP), startY - index * (CELL_SIZE + GAP), 0];
  };

  // Render Static Input Table
  const staticInputRows = inputIDVals.map((val, i) => {
      const isHighlighted = hoveredSourceIndex === i;
      const highlightColor = isHighlighted ? "#ffff00" : "transparent";
      
      // Background highlight for the row
      const rowHighlight = isHighlighted && (
          <mesh position={[inputX + 1.5, startY - i * (CELL_SIZE + GAP), -0.1]}>
              <planeGeometry args={[6, CELL_SIZE + GAP]} />
              <meshBasicMaterial color={highlightColor} transparent opacity={0.3} />
          </mesh>
      );

      const idPos = getInputIDPos(i);
      const groupVals = (inputValGroups[i].val as Value[]);
      
      return (
          <group key={`static-in-${i}`}>
              {rowHighlight}
              {/* ID Cell */}
              <group position={idPos}>
                  <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.1]} radius={0.1}>
                      <meshStandardMaterial color={COLORS.primary} transparent opacity={0.5} />
                  </RoundedBox>
                  <Text position={[0, 0, 0.1]} fontSize={0.35} color="black">
                      {String(val.val)}
                  </Text>
              </group>
              {/* Value Cells */}
              {groupVals.map((v, j) => (
                  <group key={`static-in-val-${i}-${j}`} position={getInputValuePos(i, j)}>
                      <RoundedBox args={[CELL_SIZE, CELL_SIZE, 0.1]} radius={0.1}>
                          <meshStandardMaterial color={COLORS.secondary} transparent opacity={0.5} />
                      </RoundedBox>
                      <Text position={[0, 0, 0.1]} fontSize={0.35} color="black">
                          {String(v.val)}
                      </Text>
                  </group>
              ))}
          </group>
      );
  });

  // Render Animated Output Table
  // We iterate over OUTPUT rows
  const animatedOutputRows = outputIDVals.map((outIDVal, i) => {
      const outValVal = outputValVals[i];
      const sourceIndex = logic.sourceIndices![i];
      
      // Find source positions
      // ID source is simple: inputIDVals[sourceIndex]
      const sourceIDPos = getInputIDPos(sourceIndex);
      
      // Value source: need to find which element in the tuple it was.
      // We can use valMapping but we need the index in the tuple.
      // Let's iterate the input tuple to find the matching ID.
      // This is a bit inefficient but fine for small data.
      const inputGroup = inputValGroups[sourceIndex].val as Value[];
      let sourceValColIndex = 0;
      // Reverse lookup or just search
      // logic.valMapping maps InputID -> OutputID.
      // We have OutputID (outValVal.id).
      // We need InputID.
      // Let's search inputGroup for the value that maps to outValVal.id
      const inputVal = inputGroup.find(v => logic.valMapping!.get(v.id) === outValVal.id);
      if (inputVal) {
          sourceValColIndex = inputGroup.indexOf(inputVal);
      }
      const sourceValPos = getInputValuePos(sourceIndex, sourceValColIndex);

      const targetIDPos = getOutputIDPos(i);
      const targetValPos = getOutputValuePos(i);

      return (
          <group 
            key={`out-row-${i}`}
            onPointerOver={() => setHoveredSourceIndex(sourceIndex)}
            onPointerOut={() => setHoveredSourceIndex(null)}
          >
              {/* ID Cell */}
              <AnimatedCell 
                  val={String(outIDVal.val)}
                  startPos={sourceIDPos}
                  endPos={targetIDPos}
                  color={COLORS.primary}
                  progress={progress}
                  delay={sourceIndex * 100}
              />
              {/* Value Cell */}
              <AnimatedCell 
                  val={String(outValVal.val)}
                  startPos={sourceValPos}
                  endPos={targetValPos}
                  color={COLORS.secondary}
                  progress={progress}
                  delay={sourceIndex * 100 + sourceValColIndex * 50}
              />
              
              {/* Connection Line (Optional, only when hovering) */}
              {hoveredSourceIndex === sourceIndex && progress >= 1 && (
                  <Line 
                    points={[sourceValPos, targetValPos]}
                    color="yellow"
                    lineWidth={1}
                    transparent
                    opacity={0.5}
                  />
              )}
          </group>
      );
  });

  return (
    <group>
        <Text position={[0, 5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            ungroup(table(IDs, Values))
        </Text>

        {/* Static Input Table */}
        {staticInputRows}

        {/* Animated Output Table */}
        {animatedOutputRows}
        
        <Text position={[inputX, startY + 1, 0]} fontSize={0.4} color="gray">Input Table</Text>
        <Text position={[outputX + 0.5, startY + 1, 0]} fontSize={0.4} color="gray">Output Table</Text>

    </group>
  );
};

const AnimatedCell = ({ val, startPos, endPos, color, progress, delay = 0 }: { 
    val: string, 
    startPos: [number, number, number], 
    endPos: [number, number, number], 
    color: string,
    progress: number,
    delay?: number
}) => {
    
    const { pos } = useSpring({
        pos: progress < 0.5 ? startPos : endPos,
        config: config.gentle,
        delay: progress < 0.5 ? 0 : delay // Stagger movement
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
