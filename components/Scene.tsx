
import React from 'react';
import { OrbitControls, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { FactoryFloor } from './FactoryFloor';
import { DataPipeline } from './DataPipeline';
import { PivotStage } from './PivotStage';
import { TSEngineStage } from './TSEngineStage';
import { RSEStage } from './RSEStage';
import { CSEStage } from './CSEStage';
import { AsofStage } from './AsofStage';
import { AggrTopNStage } from './AggrTopNStage';
import { AccumulateStage } from './AccumulateStage';
import { EachStage } from './EachStage';
import { EachPairStage } from './EachPairStage';
import { GroupingStage } from './GroupingStage';
import { SegmentbyStage } from './SegmentbyStage';
import { RollingStage } from './RollingStage';
import { FuncType, AppMode } from '../constants';

interface SceneProps {
  mode: AppMode;
  progress: number;
  results: any[];
  pivotLogic: any;
  tsEngineLogic: any;
  rseLogic: any;
  cseLogic: any;
  asofLogic: any;
  aggrTopNLogic: any;
  accumulateLogic: any;
  eachLogic: any;
  eachPairLogic: any;
  groupingLogic: any;
  segmentbyLogic: any;
  rollingLogic: any;
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  funcWindow: number;
  funcType: FuncType;
  tsWindowSize: number;
}

export const Scene: React.FC<SceneProps> = ({
  mode,
  progress,
  results,
  pivotLogic,
  tsEngineLogic,
  rseLogic,
  cseLogic,
  asofLogic,
  aggrTopNLogic,
  accumulateLogic,
  eachLogic,
  eachPairLogic,
  groupingLogic,
  segmentbyLogic,
  rollingLogic,
  hoveredIndex,
  setHoveredIndex,
  funcWindow,
  funcType,
  tsWindowSize
}) => {
  return (
    <>
      {/* --- Lights --- */}
      <ambientLight intensity={0.5} color="#001133" />
      <pointLight position={[10, 10, 5]} intensity={1.5} color="#00f0ff" />
      <pointLight position={[-10, 5, -5]} intensity={1} color="#ff00aa" />
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.6} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        shadow-bias={-0.0001}
      />

      {/* --- Environment --- */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <FactoryFloor />
      <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />

      {/* --- Visualization Stages --- */}
      
      {(mode === 'conditionalIterate' || mode === 'tmFunction') && (
        <DataPipeline 
          progress={progress} 
          results={results}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          funcWindow={funcWindow}
          funcType={funcType}
          mode={mode}
        />
      )}

      {mode === 'pivot' && (
        <PivotStage 
          progress={progress}
          logic={pivotLogic}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      )}

      {mode === 'createTimeSeriesEngine' && (
        <TSEngineStage 
          progress={progress}
          logic={tsEngineLogic}
          windowSize={tsWindowSize}
        />
      )}

      {mode === 'createReactiveStateEngine' && (
        <RSEStage 
          progress={progress}
          logic={rseLogic}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      )}

      {mode === 'createCrossSectionalEngine' && (
        <CSEStage 
          progress={progress}
          logic={cseLogic}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      )}

      {mode === 'asof' && (
        <AsofStage 
          progress={progress}
          logic={asofLogic}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      )}

      {mode === 'aggrTopN' && (
        <AggrTopNStage 
          progress={progress}
          logic={aggrTopNLogic}
        />
      )}

      {mode === 'accumulate' && (
        <AccumulateStage 
          progress={progress}
          logic={accumulateLogic}
        />
      )}

      {(mode === 'eachLeft' || mode === 'eachRight') && (
        <EachStage 
          progress={progress}
          logic={eachLogic}
          mode={mode === 'eachLeft' ? 'left' : 'right'}
        />
      )}

      {(mode === 'eachPre' || mode === 'eachPost') && (
        <EachPairStage 
          progress={progress}
          logic={eachPairLogic}
          mode={mode === 'eachPre' ? 'pre' : 'post'}
        />
      )}

      {(mode === 'groupby' || mode === 'contextby') && (
        <GroupingStage 
          progress={progress}
          logic={groupingLogic}
          setHoveredIndex={setHoveredIndex}
        />
      )}

      {mode === 'segmentby' && (
        <SegmentbyStage 
          progress={progress}
          logic={segmentbyLogic}
        />
      )}

      {mode === 'rolling' && (
        <RollingStage 
          progress={progress}
          logic={rollingLogic}
        />
      )}

      {/* --- Camera Controls --- */}
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.2}
        enablePan={true}
        zoomSpeed={0.5}
      />

      {/* --- Post Processing --- */}
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};
