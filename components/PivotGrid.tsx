
import React, { useMemo } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';
import { PivotStep } from '../hooks/usePivotLogic';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

interface PivotGridProps {
  rows: string[];
  cols: string[];
  processedSteps: PivotStep[];
  topY: number;
  onHoverCell: (data: { sourceIndices: number[], cellPosition: THREE.Vector3, value: number } | null) => void;
}

export const PivotGrid: React.FC<PivotGridProps> = ({ rows, cols, processedSteps, topY, onHoverCell }) => {
  const CELL_SIZE = 1.8;

  // Build current state map with source tracking
  // Map Key: "r-c" -> { value, sourceIndices[] }
  const gridMap = useMemo(() => {
      const map = new Map<string, { value: number, sourceIndices: number[] }>();
      
      processedSteps.forEach(s => {
          const key = `${s.targetRowIdx}-${s.targetColIdx}`;
          const existing = map.get(key) || { value: 0, sourceIndices: [] };
          
          existing.value = s.newValue; // Update to latest value
          existing.sourceIndices.push(s.index); // Add this step index to history
          
          map.set(key, existing);
      });
      return map;
  }, [processedSteps]);

  return (
    <group>
        {/* Column Headers (Syms) */}
        {cols.map((col, i) => (
            <group key={`ch-${col}`} position={[i * CELL_SIZE, topY + 0.8, 0]}>
                <Text fontSize={0.35} color={COLORS.secondary} fontWeight="bold" anchorY="bottom">
                    {col}
                </Text>
                <mesh position={[0, -0.2, 0]}>
                    <boxGeometry args={[1.6, 0.05, 0.1]} />
                    <meshBasicMaterial color={COLORS.secondary} />
                </mesh>
            </group>
        ))}

        {/* Row Headers (Times) */}
        {rows.map((row, i) => (
            <group key={`rh-${row}`} position={[-1.2, topY - (i * CELL_SIZE), 0]}>
                <Text fontSize={0.35} color={COLORS.time} anchorX="right" fontWeight="bold">
                    {row}
                </Text>
            </group>
        ))}

        {/* The Grid Cells */}
        {rows.map((row, rIdx) => 
            cols.map((col, cIdx) => {
                const key = `${rIdx}-${cIdx}`;
                const cellData = gridMap.get(key);
                const hasValue = cellData !== undefined;
                
                const posX = cIdx * CELL_SIZE;
                const posY = topY - (rIdx * CELL_SIZE);

                return (
                    <GridCell 
                        key={key}
                        x={posX}
                        y={posY}
                        value={cellData?.value}
                        hasValue={hasValue}
                        onHover={(hovering) => {
                            if (hovering && cellData) {
                                onHoverCell({
                                    sourceIndices: cellData.sourceIndices,
                                    cellPosition: new THREE.Vector3(posX, posY, 0),
                                    value: cellData.value
                                });
                            } else if (hovering && !cellData) {
                                // Hovering empty cell
                                onHoverCell(null);
                            } else {
                                // Mouse out
                                // We rely on the parent or other cell to clear, or clear here?
                                // If we clear here, we might flicker when moving between cells.
                                // But usually OK.
                                // Actually, better to only clear if *this* cell was the one setting it? 
                                // Simplified: always clear on out, next enter will set.
                                // But Scene raycaster order matters.
                                // Let's just set null on out.
                                // However, React events bubble?
                            }
                        }}
                        // We need a specific onOut to clear
                        onOut={() => onHoverCell(null)}
                    />
                );
            })
        )}
        
        {/* Background Plane for Grid */}
        <mesh position={[((cols.length - 1) * CELL_SIZE) / 2, topY - ((rows.length - 1) * CELL_SIZE) / 2, -0.5]}>
            <planeGeometry args={[cols.length * CELL_SIZE + 1, rows.length * CELL_SIZE + 1]} />
            <meshStandardMaterial color="#111122" transparent opacity={0.3} />
        </mesh>
    </group>
  );
};

const GridCell = ({ x, y, value, hasValue, onHover, onOut }: any) => {
    const { scale, colorInt } = useSpring({
        scale: hasValue ? 1 : 0.9,
        colorInt: hasValue ? 1 : 0,
        config: { tension: 200, friction: 15 }
    });

    return (
        <animated.group 
            position={[x, y, 0]} 
            scale={scale}
            onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
            onPointerOut={(e) => { onHover(false); onOut(); }}
        >
            <RoundedBox args={[1.6, 1.6, 0.2]} radius={0.05}>
                <meshStandardMaterial 
                    color={hasValue ? '#003344' : '#111'} 
                    emissive={COLORS.pivotHighlight}
                    emissiveIntensity={hasValue ? 0.3 : 0}
                    transparent opacity={0.8}
                />
            </RoundedBox>
            
            {/* Outline */}
            <mesh>
                 <boxGeometry args={[1.62, 1.62, 0.21]} />
                 <meshBasicMaterial color={hasValue ? COLORS.primary : '#333'} wireframe />
            </mesh>

            {hasValue && (
                <Text position={[0, 0, 0.2]} fontSize={0.5} color="white" fontWeight="bold">
                    {value}
                </Text>
            )}
        </animated.group>
    )
};
