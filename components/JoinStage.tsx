import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';

interface JoinStageProps {
  progress: number;
  logic: any;
}

const DataVisual: React.FC<{
  data: any;
  position: [number, number, number];
  title?: string;
  color?: string;
}> = ({ data, position, title, color = COLORS.primary }) => {
  if (!data) return null;

  if (data.type === 'scalar') {
    return (
      <group position={position}>
        {title && <Text position={[0, 1, 0]} fontSize={0.3} color="white">{title}</Text>}
        <RoundedBox args={[1, 1, 0.1]} radius={0.1}>
          <meshStandardMaterial color={color} />
        </RoundedBox>
        <Text position={[0, 0, 0.1]} fontSize={0.4} color="white">{data.value}</Text>
      </group>
    );
  }

  if (data.type === 'vector') {
    const len = data.value.length;
    const width = len * 0.8;
    return (
      <group position={position}>
        {title && <Text position={[width/2 - 0.4, 1, 0]} fontSize={0.3} color="white">{title}</Text>}
        {data.value.map((val: any, i: number) => (
          <group key={i} position={[i * 0.8, 0, 0]}>
            <RoundedBox args={[0.7, 0.7, 0.1]} radius={0.1}>
              <meshStandardMaterial color={color} />
            </RoundedBox>
            <Text position={[0, 0, 0.1]} fontSize={0.3} color="white">{val}</Text>
          </group>
        ))}
      </group>
    );
  }

  if (data.type === 'matrix') {
    // Matrix: array of columns
    const cols = data.value;
    const numCols = cols.length;
    const numRows = cols[0].length;
    
    return (
      <group position={position}>
        {title && <Text position={[numCols * 0.4, 1, 0]} fontSize={0.3} color="white">{title}</Text>}
        {cols.map((col: any[], cIdx: number) => (
          <group key={cIdx} position={[cIdx * 0.8, 0, 0]}>
            {col.map((val: any, rIdx: number) => (
              <group key={rIdx} position={[0, -rIdx * 0.8, 0]}>
                <RoundedBox args={[0.7, 0.7, 0.1]} radius={0.1}>
                  <meshStandardMaterial color={color} />
                </RoundedBox>
                <Text position={[0, 0, 0.1]} fontSize={0.3} color="white">{val}</Text>
              </group>
            ))}
          </group>
        ))}
      </group>
    );
  }

  return null;
};

export const JoinStage: React.FC<JoinStageProps> = ({ progress, logic }) => {
  const { X, Y, result, error } = logic;

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!X || !Y) return null;

  // Animation:
  // 0-1: Show X and Y separated.
  // 1-2: Move Y to X.
  // 2-3: Show Result.

  const t = Math.min(Math.max(progress, 0), 2);
  
  // Calculate positions
  // X at left, Y at right initially.
  // Target: Y moves to append to X.
  
  // We need dimensions to calculate positions.
  const getWidth = (d: any) => {
    if (d.type === 'scalar') return 1;
    if (d.type === 'vector') return d.value.length * 0.8;
    if (d.type === 'matrix') return d.value.length * 0.8;
    return 0;
  };

  const wX = getWidth(X);
  const wY = getWidth(Y);
  
  const startX = -2;
  const startY = 2;
  
  // Interpolate Y position
  // Start: startX + wX + gap
  // End: startX + wX (no gap)
  
  const gap = 2;
  const currentGap = gap * (1 - Math.min(t, 1));
  
  const posX = [-wX/2 - (wX+wY+currentGap)/2 + wX/2, 0, 0]; // Centering logic is tricky without exact widths
  // Let's just fix X at -2 and Y at 2, then move Y to X.
  
  const xPos = -2;
  const yPosStart = 2;
  const yPosEnd = xPos + wX + 0.2; // 0.2 padding? Or 0 if merging seamlessly.
  // If vector/matrix merge, they become one structure.
  // Visually, we want them to snap together.
  
  // If matrix, Y is appended as columns.
  // If vector, Y is appended as elements.
  
  // Let's assume standard spacing 0.8.
  // X ends at xPos + (lenX-1)*0.8 + 0.4 (half width).
  // Actually, DataVisual draws from 0 to width.
  
  const xVisualPos: [number, number, number] = [-wX - currentGap/2, 0, 0];
  const yVisualPos: [number, number, number] = [currentGap/2, 0, 0];
  
  // Wait, if I want them to merge, I should position them such that at t=1 they touch.
  // X ends at xVisualPos[0] + wX.
  // Y starts at yVisualPos[0].
  // Gap = yVisualPos[0] - (xVisualPos[0] + wX).
  // I want Gap to go from 2 to 0.
  
  // Let's center the whole assembly.
  const totalWidth = wX + wY + currentGap;
  const startXCentered = -totalWidth / 2;
  
  const xPosFinal: [number, number, number] = [startXCentered, 0, 0];
  const yPosFinal: [number, number, number] = [startXCentered + wX + currentGap, 0, 0];

  return (
    <group>
      <Text position={[0, 4, 0]} fontSize={0.5} color="white">
        join(X, Y)
      </Text>

      {progress < 1.5 ? (
        <group>
          <DataVisual data={X} position={xPosFinal} title="X" color={COLORS.primary} />
          <DataVisual data={Y} position={yPosFinal} title="Y" color={COLORS.secondary} />
        </group>
      ) : (
        <group>
           <Text position={[0, 2, 0]} fontSize={0.4} color={COLORS.success}>Result</Text>
           {/* Result is a single structure. We can color parts differently if we want, but DataVisual takes one color. */}
           {/* Let's just show the result object. */}
           <DataVisual 
             data={result} 
             position={[-getWidth(result)/2, 0, 0]} 
             color={COLORS.success} 
           />
        </group>
      )}
    </group>
  );
};
