
import React from 'react';
import { OrbitControls, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { FactoryFloor } from './FactoryFloor';
import { DataPipeline } from './DataPipeline';
import { PivotStage } from './PivotStage';
import { TSEngineStage } from './TSEngineStage';
import { FuncType, AppMode } from '../constants';
import { PivotGridState } from '../hooks/usePivotLogic';
import { TSEngineStep } from '../hooks/useTimeSeriesEngineLogic';

interface SceneProps {
  mode: AppMode;
  progress: number;
  results: any[];
  pivotLogic?: PivotGridState;
  tsEngineLogic?: TSEngineStep[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  funcWindow: number;
  funcType: FuncType;
  tsWindowSize?: number;
}

export const Scene: React.FC<SceneProps> = ({ 
  mode,
  progress, 
  results,
  pivotLogic,
  tsEngineLogic,
  hoveredIndex,
  setHoveredIndex,
  funcWindow,
  funcType,
  tsWindowSize
}) => {
  // Dynamic Camera Target
  let cameraTarget = [0, 0, 0];
  if (mode === 'pivot') cameraTarget = [0, -2, 0];
  else if (mode === 'createTimeSeriesEngine') cameraTarget = [0, 0, 0];
  else cameraTarget = [5, 0, 0];

  // Dynamic Camera Position
  let cameraPos: [number, number, number] = [5, 5, 14];
  if (mode === 'createTimeSeriesEngine') cameraPos = [0, 10, 24]; // Pull back for wider view

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 10, 60]} />

      <ambientLight intensity={0.5} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#00f0ff"
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#ff00aa" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group position={mode === 'pivot' || mode === 'createTimeSeriesEngine' ? [0, 0, 0] : [-4, 0, 0]}>
        
        {/* Render Logic based on Mode */}
        
        {(mode === 'conditionalIterate' || mode === 'tmFunction') && (
          <DataPipeline 
            mode={mode}
            progress={progress} 
            results={results}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            funcWindow={funcWindow}
            funcType={funcType}
          />
        )}
        
        {mode === 'pivot' && pivotLogic && (
             <PivotStage 
                progress={progress}
                logic={pivotLogic}
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
             />
        )}

        {mode === 'createTimeSeriesEngine' && tsEngineLogic && (
            <TSEngineStage 
                progress={progress}
                logic={tsEngineLogic}
                windowSize={tsWindowSize || 10}
            />
        )}
        
        {mode === 'stateIterate' && (
            <mesh position={[4, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="gray" wireframe />
            </mesh>
        )}

        <FactoryFloor />
      </group>

      <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={50}
        target={cameraTarget as [number, number, number]}
      />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};
