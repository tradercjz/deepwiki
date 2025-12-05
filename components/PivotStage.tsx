
import React, { useRef, useState } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { PivotGridState } from '../hooks/usePivotLogic';
import { PivotGrid } from './PivotGrid';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface PivotStageProps {
  progress: number;
  logic: PivotGridState;
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
}

export const PivotStage: React.FC<PivotStageProps> = ({
  progress,
  logic,
  hoveredIndex,
  setHoveredIndex
}) => {
  const activeIndex = Math.floor(progress);
  const transition = progress % 1; // 0 to 1

  // Layout Constants
  const LIST_X = -6;
  const GRID_X = 4;
  const HEADER_Y = 3.5; // Aligned Top Y for Headers
  const LIST_ITEM_HEIGHT = 0.7; // Compacted from 0.85
  
  // Align Grid Headers (PivotGrid renders headers at topY + 0.8) with List Header (HEADER_Y)
  // HEADER_Y = topY + 0.8  =>  topY = HEADER_Y - 0.8
  const ITEM_START_Y = HEADER_Y - 0.8;

  // Interaction State
  const [hoveredCellData, setHoveredCellData] = useState<{
      sourceIndices: number[];
      cellPosition: THREE.Vector3;
      value: number;
  } | null>(null);

  // The item currently being processed (for animation)
  const currentStep = logic.steps[activeIndex];

  return (
    <group position={[0, -1, 0]}> 
      {/* 1. Source List (Left Side) */}
      <group position={[LIST_X, 0, 0]}>
        <Text position={[0, HEADER_Y, 0]} fontSize={0.4} color={COLORS.primary} anchorX="center" fontWeight="bold">
          Input Stream (Table)
        </Text>
        <Text position={[0, HEADER_Y - 0.5, 0]} fontSize={0.2} color="#888" anchorX="center">
          Row=Time, Col=Sym
        </Text>

        {logic.steps.map((step, i) => {
          // Static List Logic: Items are fixed, they don't scroll.
          const offset = i * -LIST_ITEM_HEIGHT;
          
          const isProcessed = i <= activeIndex;
          const isActive = i === activeIndex;
          const isSourceHovered = hoveredCellData?.sourceIndices.includes(i);
          
          // Dynamic Styling
          let opacity = 0.5;
          let color = '#222';
          let emissive = '#000';
          let scale = 1;

          if (isActive) {
              opacity = 1;
              color = COLORS.primary;
              emissive = COLORS.primary;
              scale = 1.05;
          } else if (isSourceHovered) {
              opacity = 1;
              color = COLORS.gold;
              emissive = COLORS.gold;
              scale = 1.05;
          } else if (isProcessed) {
              opacity = 0.3; // Dim processed items
          }

          return (
            <group key={`list-${i}`} position={[0, ITEM_START_Y + offset, 0]}>
              <RoundedBox args={[4, LIST_ITEM_HEIGHT - 0.1, 0.2]} radius={0.1}>
                 <meshStandardMaterial 
                    color={color} 
                    emissive={emissive}
                    emissiveIntensity={isActive || isSourceHovered ? 0.5 : 0}
                    transparent opacity={opacity} 
                 />
              </RoundedBox>
              <Text position={[-1.5, 0, 0.2]} fontSize={0.22} color="white" anchorX="left">
                {step.input.time}
              </Text>
              <Text position={[-0.2, 0, 0.2]} fontSize={0.22} color={isSourceHovered ? 'white' : "yellow"} anchorX="left">
                {step.input.sym}
              </Text>
              <Text position={[1.2, 0, 0.2]} fontSize={0.22} color={isSourceHovered ? 'white' : "#00ff00"} anchorX="left">
                {step.input.price}
              </Text>
            </group>
          )
        })}
      </group>

      {/* 2. Flying Data Animation */}
      {currentStep && (
          <FlyingPacket 
            step={currentStep} 
            transition={transition} 
            startX={LIST_X + 2} 
            startY={ITEM_START_Y + (activeIndex * -LIST_ITEM_HEIGHT)} 
            gridBaseX={GRID_X}
            gridBaseY={ITEM_START_Y} // Align landing with grid top logic
            rows={logic.rows}
            cols={logic.cols}
          />
      )}

      {/* 3. The Pivot Grid (Right Side) */}
      <group position={[GRID_X, 0, 0]}>
         <PivotGrid 
            rows={logic.rows}
            cols={logic.cols}
            processedSteps={logic.steps.slice(0, activeIndex + (transition > 0.8 ? 1 : 0))}
            onHoverCell={setHoveredCellData}
            topY={ITEM_START_Y} 
         />
      </group>
      
      {/* 4. Connection Lines (Visualizing Data Lineage) */}
      {hoveredCellData && hoveredCellData.sourceIndices.map(idx => {
          // Static offset calculation
          const offset = idx * -LIST_ITEM_HEIGHT;
          const sourcePos = new THREE.Vector3(LIST_X + 2, ITEM_START_Y + offset, 0);
          
          const gridLocalPos = hoveredCellData.cellPosition; 
          // Grid Group is at [GRID_X, 0, 0]
          const targetPos = new THREE.Vector3(GRID_X + gridLocalPos.x, gridLocalPos.y, gridLocalPos.z);

          return (
              <group key={`conn-${idx}`}>
                  <Line 
                    points={[sourcePos, targetPos]} 
                    color={COLORS.gold} 
                    lineWidth={1} 
                    transparent opacity={0.6} 
                    vertexColors={[[1, 0.8, 0], [0, 1, 0]]} // Gradient Gold to Green
                  />
              </group>
          )
      })}
      
      {/* 5. Calculation Bubble */}
      {hoveredCellData && (
          <group position={[GRID_X, HEADER_Y + 1.5, 0]}>
             <Text fontSize={0.3} color={COLORS.gold} anchorX="center" outlineWidth={0.02}>
                Cell Value: {hoveredCellData.value}
             </Text>
             <Text position={[0, -0.4, 0]} fontSize={0.2} color="#aaa" anchorX="center">
                Derived from {hoveredCellData.sourceIndices.length} record(s)
             </Text>
          </group>
      )}

    </group>
  );
};

// Sub-component for the projectile animation
const FlyingPacket = ({ step, transition, startX, startY, gridBaseX, gridBaseY, rows, cols }: any) => {
    // Grid Logic: Rows go down Y, Cols go right X
    // Note: PivotGrid uses same CELL_SIZE = 1.8 constant. 
    // We must match it or pass it. Hardcoding 1.8 here to match PivotGrid.tsx
    const CELL_SIZE = 1.8;
    
    // Target Y Calculation matching PivotGrid: topY - (rIdx * CELL_SIZE)
    const targetX = gridBaseX + (step.targetColIdx * CELL_SIZE); 
    const targetY = gridBaseY - (step.targetRowIdx * CELL_SIZE); 

    // Parabolic Arc
    const x = startX + (targetX - startX) * transition;
    const linearY = startY + (targetY - startY) * transition;
    const arcHeight = 3 * Math.sin(transition * Math.PI); 
    const y = linearY + arcHeight;

    return (
        <group position={[x, y, 2]}>
             <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={COLORS.val1} emissive={COLORS.val1} emissiveIntensity={2} />
             </mesh>
             <pointLight distance={3} intensity={2} color={COLORS.val1} />
        </group>
    );
};
