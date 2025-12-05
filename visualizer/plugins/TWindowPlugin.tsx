import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { TWindowStage } from '../../components/TWindowStage';
import { useTWindowLogic } from '../../hooks/useTWindowLogic';
import { WindowFunc } from '../../constants';

const TWindowScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const steps = useTWindowLogic(
    params.func || 'min', 
    [params.rangeStart ?? 0, params.rangeEnd ?? 2], 
    params.prevailing ?? false
  );

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps.length, onStepsReady]);

  return (
    <TWindowStage 
        progress={progress} 
        steps={steps} 
        range={[params.rangeStart ?? 0, params.rangeEnd ?? 2]}
    />
  );
};

const TWindowPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4 p-4 text-white w-64">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Function</label>
        <select 
          value={params.func || 'min'}
          onChange={(e) => setParams({ ...params, func: e.target.value as WindowFunc })}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value="min">min</option>
          <option value="max">max</option>
          <option value="avg">avg</option>
          <option value="sum">sum</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
            <label className="block text-sm text-gray-400 mb-1">Range Start</label>
            <input 
              type="number" 
              value={params.rangeStart ?? 0}
              onChange={(e) => setParams({ ...params, rangeStart: Number(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            />
        </div>
        <div>
            <label className="block text-sm text-gray-400 mb-1">Range End</label>
            <input 
              type="number" 
              value={params.rangeEnd ?? 2}
              onChange={(e) => setParams({ ...params, rangeEnd: Number(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input 
            type="checkbox" 
            id="prevailing"
            checked={params.prevailing ?? false}
            onChange={(e) => setParams({ ...params, prevailing: e.target.checked })}
            className="rounded bg-gray-700 border-gray-600"
        />
        <label htmlFor="prevailing" className="text-sm text-gray-400">Prevailing (True)</label>
      </div>
    </div>
  );
};

export const TWindowPlugin: Plugin = {
  id: 'twindow',
  name: 'TWindow',
  description: 'Time/Value-based window function',
  SceneComponent: TWindowScene,
  ParameterPanelComponent: TWindowPanel,
  defaultParams: {
    func: 'min',
    rangeStart: 0,
    rangeEnd: 2,
    prevailing: false
  }
};
