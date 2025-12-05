import React, { useMemo } from 'react';
import { Text, Line, Html } from '@react-three/drei';
import { COLORS, SPACING } from '../constants';
import { useRowFunctionsLogic, RowFuncType } from '../hooks/useRowFunctionsLogic';

interface RowFunctionsStageProps {
  isPlaying: boolean;
  progress: number;
  params: {
    func: RowFuncType;
    rows: number;
    cols: number;
  };
  onStepsReady?: (steps: number) => void;
}

export const RowFunctionsStage: React.FC<RowFunctionsStageProps> = ({
  isPlaying,
  progress,
  params,
  onStepsReady
}) => {
  const { func, rows, cols } = params;
  const { steps, matrixX, matrixY } = useRowFunctionsLogic(func, rows, cols);

  // Notify parent about total steps
  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps.length, onStepsReady]);

  // Current step based on progress
  const currentStepIndex = Math.min(Math.floor(progress), steps.length - 1);
  const currentStep = steps[currentStepIndex];

  // Layout constants
  const CELL_SIZE = 1.2;
  const GAP = 0.2;
  const MATRIX_GAP = 2.0; // Gap between Matrix X and Y (if binary)
  
  // Calculate positions
  const matrixXPos = useMemo(() => {
    return matrixX.map((row, r) => 
      row.map((_, c) => ({
        x: c * (CELL_SIZE + GAP) - (cols * (CELL_SIZE + GAP)) / 2,
        y: (rows - 1 - r) * (CELL_SIZE + GAP) - (rows * (CELL_SIZE + GAP)) / 2,
        z: 0
      }))
    );
  }, [rows, cols, matrixX]);

  const isBinary = func === 'rowWsum'; // Add other binary funcs here if needed

  const matrixYPos = useMemo(() => {
    if (!isBinary) return null;
    const offsetX = cols * (CELL_SIZE + GAP) + MATRIX_GAP;
    return matrixY.map((row, r) => 
      row.map((_, c) => ({
        x: c * (CELL_SIZE + GAP) - (cols * (CELL_SIZE + GAP)) / 2 + offsetX,
        y: (rows - 1 - r) * (CELL_SIZE + GAP) - (rows * (CELL_SIZE + GAP)) / 2,
        z: 0
      }))
    );
  }, [rows, cols, matrixY, isBinary]);

  const resultPos = useMemo(() => {
    const offsetX = isBinary 
      ? (cols * (CELL_SIZE + GAP) * 2 + MATRIX_GAP + MATRIX_GAP) 
      : (cols * (CELL_SIZE + GAP) + MATRIX_GAP);
      
    return steps.map((_, r) => ({
      x: offsetX - (cols * (CELL_SIZE + GAP)) / 2, // Align somewhat to the right
      y: (rows - 1 - r) * (CELL_SIZE + GAP) - (rows * (CELL_SIZE + GAP)) / 2,
      z: 0
    }));
  }, [rows, cols, steps, isBinary]);

  return (
    <group>
      {/* Title and Info Panel */}
      <Html 
        position={[0, rows * 0.8 + 2, 0]} 
        transform 
        sprite 
        style={{ pointerEvents: 'none', width: '1000px', display: 'flex', justifyContent: 'center' }}
      >
        <div className="text-white font-mono text-sm flex flex-col gap-2 items-center bg-black/50 p-4 rounded-xl backdrop-blur-md border border-gray-700">
          <div className="font-bold text-lg text-cyan-400">
            {func}({isBinary ? 'X, Y' : 'X'})
          </div>
          
          {currentStep && (
            <div className="bg-gray-900/90 p-3 rounded border border-gray-700 shadow-xl backdrop-blur-sm flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Current Row</span>
                <span className="text-purple-400 font-bold text-lg">Row {currentStep.rowIndex}</span>
              </div>
              
              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Values</span>
                <span className="text-yellow-400">
                  [{currentStep.rowValues.join(', ')}]
                </span>
                {isBinary && currentStep.rowWeights && (
                  <span className="text-blue-400 text-xs">
                    Weights: [{currentStep.rowWeights.join(', ')}]
                  </span>
                )}
              </div>

              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Result</span>
                <span className="text-green-400 font-bold text-lg">{currentStep.result.toFixed(2)}</span>
              </div>

              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Formula</span>
                <span className="text-gray-400 font-mono text-xs bg-black/30 px-2 py-1 rounded">{currentStep.formula}</span>
              </div>
            </div>
          )}
        </div>
      </Html>

      {/* Matrix X */}
      <group>
        <Text position={[matrixXPos[0][0].x, matrixXPos[0][0].y + 1.5, 0]} fontSize={0.5} color={COLORS.primary} anchorX="left">
          Matrix X
        </Text>
        {matrixX.map((row, r) => 
          row.map((val, c) => {
            const pos = matrixXPos[r][c];
            const isCurrentRow = r === currentStepIndex;
            const isProcessed = r <= currentStepIndex;
            
            return (
              <group key={`x-${r}-${c}`} position={[pos.x, pos.y, pos.z]}>
                <mesh>
                  <boxGeometry args={[CELL_SIZE, CELL_SIZE, 0.5]} />
                  <meshStandardMaterial 
                    color={isCurrentRow ? COLORS.gold : (isProcessed ? COLORS.primary : COLORS.inactive)} 
                    transparent 
                    opacity={isCurrentRow ? 1 : 0.6} 
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.3]}
                  fontSize={0.4}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                >
                  {val}
                </Text>
              </group>
            );
          })
        )}
      </group>

      {/* Matrix Y (if binary) */}
      {isBinary && matrixYPos && (
        <group>
          <Text position={[matrixYPos[0][0].x, matrixYPos[0][0].y + 1.5, 0]} fontSize={0.5} color={COLORS.secondary} anchorX="left">
            Matrix Y
          </Text>
          {matrixY.map((row, r) => 
            row.map((val, c) => {
              const pos = matrixYPos[r][c];
              const isCurrentRow = r === currentStepIndex;
              const isProcessed = r <= currentStepIndex;
              
              return (
                <group key={`y-${r}-${c}`} position={[pos.x, pos.y, pos.z]}>
                  <mesh>
                    <boxGeometry args={[CELL_SIZE, CELL_SIZE, 0.5]} />
                    <meshStandardMaterial 
                      color={isCurrentRow ? COLORS.gold : (isProcessed ? COLORS.secondary : COLORS.inactive)} 
                      transparent 
                      opacity={isCurrentRow ? 1 : 0.6} 
                    />
                  </mesh>
                  <Text
                    position={[0, 0, 0.3]}
                    fontSize={0.4}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {val}
                  </Text>
                </group>
              );
            })
          )}
        </group>
      )}

      {/* Result Vector */}
      <group>
        <Text position={[resultPos[0].x, resultPos[0].y + 1.5, 0]} fontSize={0.5} color={COLORS.success} anchorX="center">
          Result
        </Text>
        {steps.map((step, r) => {
          const pos = resultPos[r];
          const isCurrentRow = r === currentStepIndex;
          const isProcessed = r <= currentStepIndex;

          if (!isProcessed) return null;

          return (
            <group key={`res-${r}`} position={[pos.x, pos.y, pos.z]}>
              <mesh>
                <boxGeometry args={[CELL_SIZE * 1.5, CELL_SIZE, 0.5]} />
                <meshStandardMaterial 
                  color={isCurrentRow ? COLORS.success : COLORS.success} 
                  transparent 
                  opacity={isCurrentRow ? 1 : 0.8} 
                />
              </mesh>
              <Text
                position={[0, 0, 0.3]}
                fontSize={0.4}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {step.result.toFixed(2)}
              </Text>
            </group>
          );
        })}
      </group>

      {/* Connecting Lines (Visualizing the flow) */}
      {currentStep && (
        <group>
           {/* Line from X row to Result */}
           <Line
              points={[
                [matrixXPos[currentStepIndex][cols-1].x + CELL_SIZE/2, matrixXPos[currentStepIndex][cols-1].y, 0],
                [isBinary ? matrixYPos![currentStepIndex][0].x - CELL_SIZE/2 : resultPos[currentStepIndex].x - CELL_SIZE*0.75, resultPos[currentStepIndex].y, 0]
              ]}
              color={COLORS.gold}
              lineWidth={2}
              dashed
              dashScale={2}
           />
           
           {/* Line from Y row to Result (if binary) */}
           {isBinary && matrixYPos && (
             <Line
                points={[
                  [matrixYPos[currentStepIndex][cols-1].x + CELL_SIZE/2, matrixYPos[currentStepIndex][cols-1].y, 0],
                  [resultPos[currentStepIndex].x - CELL_SIZE*0.75, resultPos[currentStepIndex].y, 0]
                ]}
                color={COLORS.gold}
                lineWidth={2}
                dashed
                dashScale={2}
             />
           )}
        </group>
      )}
    </group>
  );
};
