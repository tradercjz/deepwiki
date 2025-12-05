import React, { useState } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';

interface MergeStageProps {
  progress: number;
  logic: any;
}

const TableVisual: React.FC<{
  index: any[];
  data: any[][];
  position: [number, number, number];
  title?: string;
  color?: string;
  highlightRow?: number;
  onRowHover?: (rowIdx: number | null) => void;
  highlightIndices?: number[]; // Indices to highlight
}> = ({ index, data, position, title, color = COLORS.primary, highlightRow, onRowHover, highlightIndices }) => {
  if (!index || !data) return null;

  const numRows = index.length;
  const numCols = data.length; // data is array of columns

  return (
    <group position={position}>
      {title && <Text position={[numCols * 0.4, 1, 0]} fontSize={0.3} color="white">{title}</Text>}
      
      {/* Index Column */}
      <group position={[-0.8, 0, 0]}>
        <Text position={[0, 0.5, 0]} fontSize={0.2} color="gray">Index</Text>
        {index.map((val: any, rIdx: number) => {
          const isHighlighted = highlightRow === rIdx || (highlightIndices && highlightIndices.includes(rIdx));
          return (
            <group 
              key={rIdx} 
              position={[0, -rIdx * 0.6, 0]}
              onPointerOver={() => onRowHover && onRowHover(rIdx)}
              onPointerOut={() => onRowHover && onRowHover(null)}
            >
              <RoundedBox args={[0.7, 0.5, 0.1]} radius={0.05}>
                <meshStandardMaterial color={isHighlighted ? "#666" : "#444"} emissive={isHighlighted ? "#444" : "black"} />
              </RoundedBox>
              <Text position={[0, 0, 0.1]} fontSize={0.2} color="white">{val}</Text>
            </group>
          );
        })}
      </group>

      {/* Data Columns */}
      {data.map((col: any[], cIdx: number) => (
        <group key={cIdx} position={[cIdx * 0.8, 0, 0]}>
          <Text position={[0, 0.5, 0]} fontSize={0.2} color="gray">Col {cIdx}</Text>
          {col.map((val: any, rIdx: number) => {
            const isHighlighted = highlightRow === rIdx || (highlightIndices && highlightIndices.includes(rIdx));
            return (
              <group 
                key={rIdx} 
                position={[0, -rIdx * 0.6, 0]}
                onPointerOver={() => onRowHover && onRowHover(rIdx)}
                onPointerOut={() => onRowHover && onRowHover(null)}
              >
                <RoundedBox args={[0.7, 0.5, 0.1]} radius={0.05}>
                  <meshStandardMaterial 
                    color={val === null ? "#333" : color} 
                    emissive={isHighlighted ? (val === null ? "#222" : color) : "black"}
                    emissiveIntensity={isHighlighted ? 0.5 : 0}
                  />
                </RoundedBox>
                <Text position={[0, 0, 0.1]} fontSize={0.2} color="white">{val === null ? "NULL" : val}</Text>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

export const MergeStage: React.FC<MergeStageProps> = ({ progress, logic }) => {
  const { left, right, result, error, how } = logic;
  const [hoveredResultRow, setHoveredResultRow] = useState<number | null>(null);

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!left || !right) return null;

  // Animation:
  // 0-1: Show Left and Right.
  // 1-2: Show Result below.
  
  const leftWidth = (left.data.length + 1) * 0.8;
  const rightWidth = (right.data.length + 1) * 0.8;
  
  const startX = -3;
  
  // Determine highlighted rows in Left and Right based on hovered Result row
  let highlightLeftIdx: number[] = [];
  let highlightRightIdx: number[] = [];
  let tooltipText = "";

  if (hoveredResultRow !== null && result.sourceIndices && result.sourceIndices[hoveredResultRow]) {
    const source = result.sourceIndices[hoveredResultRow];
    if (source.lIdx !== -1) highlightLeftIdx.push(source.lIdx);
    if (source.rIdx !== -1) highlightRightIdx.push(source.rIdx);
    
    const idxVal = result.index[hoveredResultRow];
    tooltipText = `Row ${hoveredResultRow}: Index ${idxVal}\nMatched Left[${source.lIdx}] & Right[${source.rIdx}]`;
    if (source.lIdx === -1) tooltipText = `Row ${hoveredResultRow}: Index ${idxVal}\nRight only (Right[${source.rIdx}])`;
    if (source.rIdx === -1) tooltipText = `Row ${hoveredResultRow}: Index ${idxVal}\nLeft only (Left[${source.lIdx}])`;
  }

  return (
    <group>
      <Text position={[0, 4, 0]} fontSize={0.5} color="white">
        merge(left, right, '{how}')
      </Text>

      <group position={[0, 1, 0]}>
        <TableVisual 
          index={left.index} 
          data={left.data} 
          position={[startX, 0, 0]} 
          title="Left" 
          color={COLORS.primary} 
          highlightIndices={highlightLeftIdx}
        />
        <TableVisual 
          index={right.index} 
          data={right.data} 
          position={[startX + leftWidth + 1, 0, 0]} 
          title="Right" 
          color={COLORS.secondary} 
          highlightIndices={highlightRightIdx}
        />
      </group>

      {progress >= 1 && (
        <group position={[0, -3, 0]}>
           <Text position={[0, 1, 0]} fontSize={0.4} color={COLORS.success}>Result</Text>
           <TableVisual 
             index={result.index} 
             data={result.data} 
             position={[-((result.data.length+1)*0.8)/2, 0, 0]} 
             color={COLORS.success} 
             onRowHover={setHoveredResultRow}
             highlightRow={hoveredResultRow !== null ? hoveredResultRow : undefined}
           />
           {hoveredResultRow !== null && (
             <group position={[3, 0, 0]}>
               <RoundedBox args={[4, 1.5, 0.1]} radius={0.1}>
                 <meshStandardMaterial color="#222" opacity={0.9} transparent />
               </RoundedBox>
               <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" maxWidth={3.8} textAlign="center">
                 {tooltipText}
               </Text>
             </group>
           )}
        </group>
      )}
    </group>
  );
};
