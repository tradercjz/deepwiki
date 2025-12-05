
import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';

interface ColumnDef {
  header: string;
  accessor: (row: any) => string | number | null;
  width: number;
  color?: string;
}

interface Table3DProps {
  title: string;
  data: any[];
  columns: ColumnDef[];
  highlightIndex?: number; // For Input table: which row is being processed
  maxRows?: number;
  onRowHover?: (index: number | null) => void;
}

export const Table3D: React.FC<Table3DProps> = ({ 
  title, 
  data, 
  columns, 
  highlightIndex, 
  maxRows = 15,
  onRowHover
}) => {
  const ROW_HEIGHT = 0.6;
  const HEADER_HEIGHT = 0.8;
  const TOTAL_WIDTH = columns.reduce((sum, col) => sum + col.width, 0);

  return (
    <group>
      {/* Title */}
      <Text position={[TOTAL_WIDTH / 2, HEADER_HEIGHT + 0.8, 0]} fontSize={0.4} color={COLORS.primary} anchorX="center" fontWeight="bold">
        {title}
      </Text>

      {/* Header Row */}
      <group position={[0, HEADER_HEIGHT, 0]}>
        {columns.reduce<{ pos: number; els: React.ReactElement[] }>(
          (acc, col, i) => {
            const x = acc.pos + col.width / 2;
            acc.els.push(
              <group key={`head-${i}`} position={[x, 0, 0]}>
                <mesh position={[0, -0.2, 0]}>
                   <boxGeometry args={[col.width - 0.1, 0.05, 0.1]} />
                   <meshBasicMaterial color="#555" />
                </mesh>
                <Text fontSize={0.25} color="#aaa" anchorY="bottom">
                  {col.header}
                </Text>
              </group>
            );
            acc.pos += col.width;
            return acc;
          },
          { pos: 0, els: [] }
        ).els}
      </group>

      {/* Data Rows */}
      {data.slice(0, maxRows).map((row, rIdx) => {
        const isHighlighted = rIdx === highlightIndex;
        const y = -rIdx * ROW_HEIGHT;
        
        return (
          <group 
            key={`row-${rIdx}`} 
            position={[0, y, 0]}
            onPointerOver={(e) => { e.stopPropagation(); onRowHover && onRowHover(rIdx); }}
            onPointerOut={(e) => { onRowHover && onRowHover(null); }}
          >
            {/* Row Background Highlight / Interactive Zone */}
            <mesh position={[TOTAL_WIDTH/2, 0, -0.05]}>
                <planeGeometry args={[TOTAL_WIDTH + 0.5, ROW_HEIGHT]} />
                <meshBasicMaterial color={isHighlighted ? COLORS.primary : 'black'} transparent opacity={isHighlighted ? 0.2 : 0} />
            </mesh>

            {isHighlighted && (
                <RoundedBox position={[TOTAL_WIDTH/2, 0, -0.1]} args={[TOTAL_WIDTH + 0.5, ROW_HEIGHT - 0.1, 0.1]}>
                    <meshStandardMaterial color={COLORS.primary} transparent opacity={0.2} />
                </RoundedBox>
            )}

            {columns.reduce<{ pos: number; els: React.ReactElement[] }>(
              (acc, col, cIdx) => {
                const x = acc.pos + col.width / 2;
                const rawVal = col.accessor(row);
                const isNull = rawVal === null;
                const val = isNull ? "NULL" : rawVal;
                
                acc.els.push(
                  <Text 
                    key={`cell-${rIdx}-${cIdx}`} 
                    position={[x, 0, 0]} 
                    fontSize={0.22} 
                    color={isHighlighted ? 'white' : (isNull ? '#666' : (col.color || 'white'))}
                    anchorX="center"
                  >
                    {val}
                  </Text>
                );
                acc.pos += col.width;
                return acc;
              },
              { pos: 0, els: [] }
            ).els}
          </group>
        );
      })}
    </group>
  );
};
