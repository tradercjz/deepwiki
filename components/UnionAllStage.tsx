import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface UnionAllStageProps {
  progress: number;
  logic: any;
}

const Cell: React.FC<{
  val: any;
  position: [number, number, number];
  width: number;
  color: string;
  opacity?: number;
}> = ({ val, position, width, color, opacity = 1 }) => {
  return (
    <group position={position}>
      <RoundedBox args={[width - 0.1, 0.5, 0.1]} radius={0.05}>
        <meshStandardMaterial color={color} transparent opacity={opacity * 0.3} />
      </RoundedBox>
      <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" fillOpacity={opacity} anchorX="center" anchorY="middle">
        {val}
      </Text>
    </group>
  );
};

const Row: React.FC<{
  data: any[];
  position: [number, number, number];
  colWidths: number[];
  color: string;
  opacity?: number;
}> = ({ data, position, colWidths, color, opacity = 1 }) => {
  let currentX = - (colWidths.reduce((a, b) => a + b, 0) / 2);
  
  return (
    <group position={position}>
      {data.map((val, idx) => {
        const width = colWidths[idx];
        const x = currentX + width / 2;
        currentX += width;
        return (
          <Cell 
            key={idx} 
            val={val} 
            position={[x, 0, 0]} 
            width={width} 
            color={color} 
            opacity={opacity} 
          />
        );
      })}
    </group>
  );
};

export const UnionAllStage: React.FC<UnionAllStageProps> = ({ progress, logic }) => {
  const { tableA, tableB, result, byColName, error } = logic;

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!tableA || !tableB) return null;

  // Prepare data for rendering
  const colsA = Object.keys(tableA);
  const colsB = Object.keys(tableB);
  const resultCols = Object.keys(result);

  const numRowsA = tableA[colsA[0]].length;
  const numRowsB = tableB[colsB[0]].length;
  const numRowsResult = result[resultCols[0]].length;

  const rowsA = [];
  for (let i = 0; i < numRowsA; i++) {
    rowsA.push(colsA.map(col => tableA[col][i]));
  }

  const rowsB = [];
  for (let i = 0; i < numRowsB; i++) {
    rowsB.push(colsB.map(col => tableB[col][i]));
  }

  const rowsResult = [];
  for (let i = 0; i < numRowsResult; i++) {
    rowsResult.push(resultCols.map(col => result[col][i]));
  }

  // Layout
  const colWidth = 1.2;
  const colWidthsA = colsA.map(() => colWidth);
  const colWidthsB = colsB.map(() => colWidth);
  const colWidthsResult = resultCols.map(() => colWidth);

  const tableAWidth = colWidthsA.reduce((a, b) => a + b, 0);
  const tableBWidth = colWidthsB.reduce((a, b) => a + b, 0);
  
  const startPosA = new THREE.Vector3(-tableAWidth / 2 - 1, 2, 0);
  const startPosB = new THREE.Vector3(tableBWidth / 2 + 1, 2, 0);
  const resultStartPos = new THREE.Vector3(0, -2, 0);

  // Animation Logic
  // 0-1: Static
  // 1-2: Table A moves to Result (copy)
  // 2-3: Table B moves to Result (copy)

  const renderStaticTable = (
    rows: any[][],
    cols: string[],
    startPos: THREE.Vector3,
    colWidths: number[],
    color: string,
    label: string
  ) => {
    return (
      <group>
        <Text position={[startPos.x, startPos.y + 0.8, 0]} fontSize={0.3} color="white">{label}</Text>
        {/* Headers */}
        <group position={[startPos.x, startPos.y + 0.4, 0]}>
           <Row 
              data={cols} 
              position={[0, 0, 0]} 
              colWidths={colWidths} 
              color="#555" 
           />
        </group>
        {/* Rows */}
        {rows.map((row, rIdx) => (
          <Row 
            key={`static-${label}-${rIdx}`}
            data={row}
            position={[startPos.x, startPos.y - rIdx * 0.6, 0]}
            colWidths={colWidths}
            color={color}
            opacity={0.5} // Dim original slightly to show it's the source
          />
        ))}
      </group>
    );
  };

  const renderMovingRows = (
    sourceRows: any[][], 
    sourceCols: string[],
    startPos: THREE.Vector3, 
    startTime: number, 
    color: string,
    isTableB: boolean = false
  ) => {
    if (progress < startTime) return null;

    return sourceRows.map((row, rIdx) => {
      const initialPos = new THREE.Vector3(
        startPos.x,
        startPos.y - rIdx * 0.6,
        startPos.z
      );

      let currentPos = initialPos;
      let currentData = row;
      let currentWidths = isTableB ? colWidthsB : colWidthsA;

      const t = Math.min(Math.max(progress - startTime, 0), 1);
      
      const targetRowIdx = isTableB ? numRowsA + rIdx : rIdx;
      const targetPos = new THREE.Vector3(
          resultStartPos.x,
          resultStartPos.y - targetRowIdx * 0.6,
          resultStartPos.z
      );

      // Interpolate position
      currentPos = new THREE.Vector3().lerpVectors(initialPos, targetPos, t);
      
      if (t > 0.5) {
          // Use result data structure for this row
          const resRow = rowsResult[targetRowIdx];
          currentData = resRow;
          currentWidths = colWidthsResult;
      }

      return (
        <Row 
          key={`${isTableB ? 'B' : 'A'}-${rIdx}`} 
          data={currentData} 
          position={[currentPos.x, currentPos.y, currentPos.z + 0.1]} // Slightly above static
          colWidths={currentWidths}
          color={color}
        />
      );
    });
  };

  return (
    <group>
      <Text position={[0, 4, 0]} fontSize={0.5} color="white">
        unionAll(tableA, tableB{byColName ? ', byColName=true' : ''})
      </Text>

      {/* Static Original Tables */}
      {renderStaticTable(rowsA, colsA, startPosA, colWidthsA, COLORS.primary, "Table A")}
      {renderStaticTable(rowsB, colsB, startPosB, colWidthsB, COLORS.secondary, "Table B")}

      {/* Result Headers (fade in?) */}
      {progress > 0.5 && (
        <group position={[resultStartPos.x, resultStartPos.y + 0.4, 0]}>
            <Text position={[0, 0.4, 0]} fontSize={0.3} color="white">Result</Text>
            <Row 
                data={resultCols} 
                position={[0, 0, 0]} 
                colWidths={colWidthsResult} 
                color="#555" 
            />
        </group>
      )}

      {/* Moving Rows (Copies) */}
      {renderMovingRows(rowsA, colsA, startPosA, 1, COLORS.primary)}
      {renderMovingRows(rowsB, colsB, startPosB, 2, COLORS.secondary, true)}

    </group>
  );
};
