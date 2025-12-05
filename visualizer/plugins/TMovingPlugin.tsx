import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { TMovingStage } from '../../components/TMovingStage';
import { useTMovingLogic } from '../../hooks/useTMovingLogic';
import { WindowFunc } from '../../constants';

const TMovingScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const windowSize = params.window || 3;
  const steps = useTMovingLogic(params.func || 'avg', windowSize);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps, onStepsReady]);

  return (
    <TMovingStage
      progress={progress}
      steps={steps}
      windowSize={windowSize}
    />
  );
};

const TMovingPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'avg'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as WindowFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="min">min</option>
        <option value="max">max</option>
        <option value="sum">sum</option>
        <option value="avg">avg</option>
      </select>

      <label className="text-sm font-bold mt-2">Window Size</label>
      <input 
        type="number" 
        value={params.window ?? 3} 
        onChange={(e) => setParams({ ...params, window: parseInt(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
      <div className="text-xs text-gray-400 mt-1">
        Window = (Ti - window, Ti]
      </div>
    </div>
  );
};

export const TMovingPlugin: Plugin = {
  id: 'tmoving',
  name: 'TMoving',
  description: 'Visualize time-based moving window',
  SceneComponent: TMovingScene,
  ParameterPanelComponent: TMovingPanel,
  defaultParams: {
    func: 'avg',
    window: 3
  }
};
