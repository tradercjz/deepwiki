import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { BarItem } from '../hooks/useBarLogic';
import { COLORS } from '../constants';

interface BarStageProps {
  progress: number; // 0 to 4
  logic: {
      items: BarItem[];
      interval: number;
      closed: 'left' | 'right';
      grid: number[];
      error: string | null;
      isTime: boolean;
      hasTimePart: boolean;
  };
}

const X_SCALE = 0.8;

// Helper to format date for grid labels
const formatDate = (ts: number, hasTime: boolean): string => {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (!hasTime) return `${year}.${month}.${day}`;
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day}\n${hours}:${minutes}:${seconds}`;
};

export const BarStage: React.FC<BarStageProps> = ({ progress, logic }) => {
  if (logic.error) {
      return <Text color="red">{logic.error}</Text>;
  }

  if (logic.items.length === 0 || logic.grid.length === 0) {
      return <Text color="gray">No Data</Text>;
  }

  // Center the visualization
  const minVal = logic.grid[0];
  const maxVal = logic.grid[logic.grid.length - 1];
  
  // Normalize values for display to avoid huge coordinates
  const normalize = (val: number) => (val - minVal) / logic.interval;
  
  // Recalculate center offset based on normalized values
  // Grid spans from 0 to (maxVal - minVal) / interval
  const gridWidth = (maxVal - minVal) / logic.interval;
  const centerOffset = -(gridWidth * X_SCALE) / 2;

  // Phase descriptions
  let phaseText = "";
  if (progress < 1) phaseText = "Input Data";
  else if (progress < 2) phaseText = "Calculate Formula";
  else if (progress < 3) phaseText = "Move to Group Start";
  else phaseText = "Result";

  return (
    <group position={[centerOffset, 0, 0]}>
        <Text position={[-centerOffset, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            bar(X, {logic.interval}, closed='{logic.closed}')
        </Text>
        <Text position={[-centerOffset, 4.5, 0]} fontSize={0.4} color={COLORS.secondary}>
            {phaseText}
        </Text>

        {/* Grid / Intervals */}
        <group position={[0, -2, 0]}>
            <Line 
                points={[[normalize(minVal) * X_SCALE - 2, 0, 0], [normalize(maxVal) * X_SCALE + 2, 0, 0]]} 
                color="#555" 
                lineWidth={2} 
            />
            {logic.grid.map((val, i) => {
                const normVal = normalize(val);
                
                // Draw interval region if not last
                if (i < logic.grid.length - 1) {
                    const nextVal = logic.grid[i+1];
                    const normNextVal = normalize(nextVal);
                    const width = (normNextVal - normVal) * X_SCALE;
                    const centerX = (normVal * X_SCALE) + width / 2;
                    
                    const labelStart = logic.isTime ? formatDate(val, logic.hasTimePart) : val;
                    const labelEnd = logic.isTime ? formatDate(nextVal, logic.hasTimePart) : nextVal;

                    return (
                        <group key={`interval-${val}`}>
                            <GridMark val={val} displayVal={labelStart} x={normVal * X_SCALE} />
                            {/* Interval shading */}
                            <mesh position={[centerX, 1, -0.1]}>
                                <planeGeometry args={[width - 0.1, 3]} />
                                <meshBasicMaterial color="#333" transparent opacity={0.2} />
                            </mesh>
                            {/* Interval Label */}
                            <Text position={[centerX, -1.5, 0]} fontSize={0.2} color="#666" textAlign="center">
                                {logic.closed === 'left' ? `[${labelStart},\n${labelEnd})` : `(${labelStart},\n${labelEnd}]`}
                            </Text>
                        </group>
                    );
                }
                const label = logic.isTime ? formatDate(val, logic.hasTimePart) : val;
                return <GridMark key={val} val={val} displayVal={label} x={normVal * X_SCALE} />;
            })}
        </group>

        {/* Items */}
        {logic.items.map((item, i) => (
            <Item 
                key={item.id} 
                item={item} 
                progress={progress} 
                closed={logic.closed}
                index={i}
                normalize={normalize}
            />
        ))}
    </group>
  );
};

const GridMark = ({ val, displayVal, x }: { val: number, displayVal: string | number, x: number }) => {
    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.05, 1, 0.05]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            <Text position={[0, -0.5, 0]} fontSize={0.25} color="#888" textAlign="center">
                {displayVal}
            </Text>
        </group>
    );
};

const Item = ({ item, progress, closed, index, normalize }: { item: BarItem, progress: number, closed: 'left' | 'right', index: number, normalize: (v: number) => number }) => {
    const isMoving = progress >= 2;
    const isDone = progress >= 3;

    // Target X position
    const targetVal = isMoving ? item.numericBarVal : item.numericVal;
    const targetX = normalize(targetVal) * X_SCALE;
    
    const y = 1.5 + (index % 3) * 0.8;

    const { x, valColor } = useSpring({
        x: targetX,
        valColor: isDone ? COLORS.success : COLORS.funcCol,
        config: { tension: 120, friction: 14 }
    });

    const showFormula = progress >= 1 && progress < 3;
    const { formulaOpacity } = useSpring({
        formulaOpacity: showFormula ? 1 : 0
    });

    return (
        <animated.group position-x={x} position-y={y}>
            <RoundedBox args={[0.8, 0.6, 0.1]} radius={0.1}>
                <animated.meshStandardMaterial color={valColor} />
            </RoundedBox>
            <Text position={[0, 0, 0.11]} fontSize={0.25} color="white" fontWeight="bold">
                {isDone ? item.barVal : item.val}
            </Text>

            <Line 
                points={[[0, -0.3, 0], [0, -y - 1, 0]]} 
                color={COLORS.funcCol} 
                lineWidth={1} 
                transparent 
                opacity={0.2} 
            />

            <animated.group position={[0, 0.8, 0]} scale={formulaOpacity}>
                <Text fontSize={0.2} color="#aaa" anchorY="bottom">
                    {item.formula}
                </Text>
            </animated.group>

        </animated.group>
    );
};
