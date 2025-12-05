import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { WindowStage } from '../../components/WindowStage';
import { useWindowLogic } from '../../hooks/useWindowLogic';
import { WindowFunc } from '../../constants';

const WindowScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const range: [number, number] = [params.rangeStart || 1, params.rangeEnd || 3];
  const steps = useWindowLogic(params.func || 'min', range);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps, onStepsReady]);

  return (
    <WindowStage
      progress={progress}
      steps={steps}
      range={range}
    />
  );
};

const WindowPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'min'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as WindowFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="min">min</option>
        <option value="max">max</option>
        <option value="sum">sum</option>
        <option value="avg">avg</option>
      </select>

      <label className="text-sm font-bold mt-2">Range Start (d1)</label>
      <input 
        type="number" 
        value={params.rangeStart ?? 1} 
        onChange={(e) => setParams({ ...params, rangeStart: parseInt(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />

      <label className="text-sm font-bold mt-2">Range End (d2)</label>
      <input 
        type="number" 
        value={params.rangeEnd ?? 3} 
        onChange={(e) => setParams({ ...params, rangeEnd: parseInt(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
      <div className="text-xs text-gray-400 mt-1">
        Window = [i + d1, i + d2]
      </div>
    </div>
  );
};

export const WindowPlugin: Plugin = {
  id: 'window',
  name: 'Window',
  description: 'Visualize sliding window operation',
  SceneComponent: WindowScene,
  ParameterPanelComponent: WindowPanel,
  defaultParams: {
    func: 'min',
    rangeStart: 1,
    rangeEnd: 3
  }
};
