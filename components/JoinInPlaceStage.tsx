import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';

interface JoinInPlaceStageProps {
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
    const cols = data.value;
    const numCols = cols.length;
    
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

export const JoinInPlaceStage: React.FC<JoinInPlaceStageProps> = ({ progress, logic }) => {
  const { X, Y, result, error } = logic;

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!X || !Y) return null;

  // Animation:
  // 0-1: Show X and Y.
  // 1-2: Y moves into X.
  // 2-3: Show Result as X.

  const t = Math.min(Math.max(progress, 0), 2);
  
  const getWidth = (d: any) => {
    if (d.type === 'scalar') return 1;
    if (d.type === 'vector') return d.value.length * 0.8;
    if (d.type === 'matrix') return d.value.length * 0.8;
    return 0;
  };

  const wX = getWidth(X);
  const wY = getWidth(Y);
  
  const gap = 2;
  const currentGap = gap * (1 - Math.min(t, 1));
  
  const totalWidth = wX + wY + currentGap;
  const startXCentered = -totalWidth / 2;
  
  const xPosFinal: [number, number, number] = [startXCentered, 0, 0];
  const yPosFinal: [number, number, number] = [startXCentered + wX + currentGap, 0, 0];

  return (
    <group>
      <Text position={[0, 4, 0]} fontSize={0.5} color="white">
        join!(X, Y)
      </Text>

      {progress < 1.5 ? (
        <group>
          <DataVisual data={X} position={xPosFinal} title="X" color={COLORS.primary} />
          <DataVisual data={Y} position={yPosFinal} title="Y" color={COLORS.secondary} />
        </group>
      ) : (
        <group>
           <Text position={[0, 2, 0]} fontSize={0.4} color={COLORS.primary}>X (Modified)</Text>
           <DataVisual 
             data={result} 
             position={[-getWidth(result)/2, 0, 0]} 
             color={COLORS.primary} 
           />
        </group>
      )}
    </group>
  );
};
