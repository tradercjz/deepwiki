import React, { useState } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';

interface ConcatMatrixStageProps {
  progress: number;
  logic: any;
}

interface HoverState {
  type: 'source' | 'result';
  matrixIndex?: number; // For source
  colIndex: number;
  rowIndex: number;
}

const MatrixVisual: React.FC<{
  matrix: any[]; // Array of columns
  position: [number, number, number];
  title?: string;
  color?: string;
  opacity?: number;
  highlight?: { col: number, row: number } | null; // Highlight specific cell
  highlightCol?: number | null; // Highlight entire column
  highlightRow?: number | null; // Highlight entire row
  onHover?: (col: number, row: number) => void;
  onLeave?: () => void;
}> = ({ matrix, position, title, color = COLORS.primary, opacity = 1, highlight, highlightCol, highlightRow, onHover, onLeave }) => {
  if (!matrix || matrix.length === 0) return null;

  const numCols = matrix.length;
  const numRows = matrix[0].length;
  const cellSize = 0.8;
  const width = numCols * cellSize;
  const height = numRows * cellSize;

  return (
    <group position={position}>
      {title && (
        <Text position={[width / 2 - cellSize / 2, cellSize, 0]} fontSize={0.3} color="white">
          {title}
        </Text>
      )}
      {/* Background */}
      <RoundedBox
        args={[width + 0.2, height + 0.2, 0.1]}
        position={[width / 2 - cellSize / 2, -height / 2 + cellSize / 2, -0.1]}
        radius={0.1}
      >
        <meshStandardMaterial color="#222" transparent opacity={0.8 * opacity} />
      </RoundedBox>

      {matrix.map((col, cIdx) => (
        <group key={cIdx} position={[cIdx * cellSize, 0, 0]}>
          {col.map((val: any, rIdx: number) => {
            const isHighlighted = 
              (highlight && highlight.col === cIdx && highlight.row === rIdx) ||
              (highlightCol === cIdx) ||
              (highlightRow === rIdx);
            
            return (
              <group 
                key={rIdx} 
                position={[0, -rIdx * cellSize, 0]}
                onPointerOver={(e) => { e.stopPropagation(); onHover && onHover(cIdx, rIdx); }}
                onPointerOut={(e) => { onLeave && onLeave(); }}
              >
                {/* Cell Background for hit testing and highlight */}
                <mesh position={[0, 0, -0.05]}>
                  <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
                  <meshBasicMaterial 
                    color={isHighlighted ? 'yellow' : 'black'} 
                    transparent 
                    opacity={isHighlighted ? 0.3 : 0} 
                  />
                </mesh>
                <Text
                  fontSize={0.3}
                  color={isHighlighted ? 'yellow' : color}
                  fillOpacity={opacity}
                >
                  {val}
                </Text>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

export const ConcatMatrixStage: React.FC<ConcatMatrixStageProps> = ({ progress, logic }) => {
  const { matrices, resultMatrix, horizontal, error } = logic;
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  if (error) {
    return (
      <Text position={[0, 0, 0]} color="red" fontSize={0.5}>
        {error}
      </Text>
    );
  }

  if (!matrices || matrices.length === 0) return null;

  // Layout calculation
  const matrixDims = matrices.map((m: any[]) => ({
    cols: m.length,
    rows: m[0].length,
    width: m.length * 0.8,
    height: m[0].length * 0.8
  }));

  const gap = 1.0;
  const t = Math.min(Math.max(progress, 0), 2);
  
  const positions: [number, number, number][] = [];
  
  if (horizontal) {
    const currentGap = gap * (1 - Math.min(t, 1));
    const currentTotalWidth = matrixDims.reduce((sum: number, d: any) => sum + d.width, 0) + (matrixDims.length - 1) * currentGap;
    let startX = -currentTotalWidth / 2;
    let x = startX;
    for (let i = 0; i < matrixDims.length; i++) {
      positions.push([x, 2, 0]);
      x += matrixDims[i].width + currentGap;
    }
  } else {
    const currentGap = gap * (1 - Math.min(t, 1));
    const currentTotalHeight = matrixDims.reduce((sum: number, d: any) => sum + d.height, 0) + (matrixDims.length - 1) * currentGap;
    let startY = currentTotalHeight / 2;
    let y = startY;
    for (let i = 0; i < matrixDims.length; i++) {
      positions.push([-matrixDims[0].width / 2, y, 0]);
      y -= (matrixDims[i].height + currentGap);
    }
  }

  // Determine highlighting
  const getHighlightForSource = (mIdx: number) => {
    if (!hoverState) return {};
    
    if (hoverState.type === 'source' && hoverState.matrixIndex === mIdx) {
      return { highlight: { col: hoverState.colIndex, row: hoverState.rowIndex } };
    }
    
    if (hoverState.type === 'result') {
      // Map result hover to source
      if (horizontal) {
        // Check if result col maps to this matrix
        let colStart = 0;
        for (let i = 0; i < mIdx; i++) colStart += matrixDims[i].cols;
        const colEnd = colStart + matrixDims[mIdx].cols;
        
        if (hoverState.colIndex >= colStart && hoverState.colIndex < colEnd) {
          // Match!
          return { highlight: { col: hoverState.colIndex - colStart, row: hoverState.rowIndex } };
        }
      } else {
        // Vertical
        // Check if result row maps to this matrix
        let rowStart = 0;
        for (let i = 0; i < mIdx; i++) rowStart += matrixDims[i].rows;
        const rowEnd = rowStart + matrixDims[mIdx].rows;
        
        if (hoverState.rowIndex >= rowStart && hoverState.rowIndex < rowEnd) {
          // Match!
          return { highlight: { col: hoverState.colIndex, row: hoverState.rowIndex - rowStart } };
        }
      }
    }
    return {};
  };

  const getHighlightForResult = () => {
    if (!hoverState) return {};
    
    if (hoverState.type === 'result') {
      return { highlight: { col: hoverState.colIndex, row: hoverState.rowIndex } };
    }
    
    if (hoverState.type === 'source' && hoverState.matrixIndex !== undefined) {
      // Map source hover to result
      if (horizontal) {
        let colOffset = 0;
        for (let i = 0; i < hoverState.matrixIndex; i++) colOffset += matrixDims[i].cols;
        return { highlight: { col: colOffset + hoverState.colIndex, row: hoverState.rowIndex } };
      } else {
        let rowOffset = 0;
        for (let i = 0; i < hoverState.matrixIndex; i++) rowOffset += matrixDims[i].rows;
        return { highlight: { col: hoverState.colIndex, row: rowOffset + hoverState.rowIndex } };
      }
    }
    return {};
  };

  return (
    <group>
      <Text position={[0, 4, 0]} fontSize={0.5} color="white">
        concatMatrix(X, {horizontal ? 'true' : 'false'})
      </Text>

      <group position={[0, 0, 0]}>
        {matrices.map((m: any[], i: number) => (
          <MatrixVisual 
            key={i} 
            matrix={m} 
            position={positions[i]} 
            title={`m${i+1}`}
            color={COLORS.primary}
            {...getHighlightForSource(i)}
            onHover={(c, r) => setHoverState({ type: 'source', matrixIndex: i, colIndex: c, rowIndex: r })}
            onLeave={() => setHoverState(null)}
          />
        ))}
      </group>
      
      {/* Result Label and Matrix */}
      {progress > 1.5 && (
        <group position={[0, horizontal ? -2 : -matrixDims.reduce((s:number,d:any)=>s+d.height,0)/2 - 2, 0]}>
          <Text position={[0, 1, 0]} fontSize={0.4} color={COLORS.secondary}>
            Result
          </Text>
          <MatrixVisual 
            matrix={resultMatrix}
            position={[-(resultMatrix.length * 0.8) / 2, 0, 0]}
            color={COLORS.secondary}
             {...getHighlightForResult()}
             onHover={(c, r) => setHoverState({ type: 'result', colIndex: c, rowIndex: r })}
             onLeave={() => setHoverState(null)}
          />
        </group>
      )}
    </group>
  );
};
