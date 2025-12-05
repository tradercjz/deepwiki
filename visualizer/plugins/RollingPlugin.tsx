import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { RollingStage } from '../../components/RollingStage';
import { useRollingLogic } from '../../hooks/useRollingLogic';

const RollingScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useRollingLogic(params.window || 10, params.step || 1);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <RollingStage
      progress={progress}
      logic={logic}
    />
  );
};

const RollingPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Window Size</label>
      <input 
        type="number" 
        value={params.window || 10} 
        onChange={(e) => setParams({ ...params, window: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />

      <label className="text-sm font-bold">Step</label>
      <input 
        type="number" 
        value={params.step || 1} 
        onChange={(e) => setParams({ ...params, step: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
    </div>
  );
};

export const RollingPlugin: Plugin = {
  id: 'rolling',
  name: 'Rolling',
  description: 'Visualize rolling window operation (Beta)',
  SceneComponent: RollingScene,
  ParameterPanelComponent: RollingPanel,
  defaultParams: {
    window: 10,
    step: 1
  }
};
