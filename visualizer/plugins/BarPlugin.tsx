import React from 'react';
import { Plugin } from '../types/plugin';
import { BarStage } from '../../components/BarStage';
import { useBarLogic } from '../../hooks/useBarLogic';

const BarScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useBarLogic(params.X, params.interval, params.closed);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(4);
    }
  }, [onStepsReady]);

  return <BarStage progress={progress} logic={logic} />;
};

const BarParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">X (Vector/Scalar)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
          placeholder="e.g. 1..10"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Interval</label>
        <input
          type="text"
          value={params.interval}
          onChange={(e) => setParams({ ...params, interval: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
          placeholder="e.g. 3 or 1d"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Closed</label>
        <select
          value={params.closed}
          onChange={(e) => setParams({ ...params, closed: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
        >
          <option value="left">left</option>
          <option value="right">right</option>
        </select>
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Calculates grouping key based on interval.</p>
        <p className="mt-1 italic">
          {params.closed === 'left' 
            ? "Left: X - (X % interval)" 
            : "Right: Snaps to right boundary"}
        </p>
      </div>
    </div>
  );
};

export const BarPlugin: Plugin = {
  id: 'bar',
  name: 'bar',
  description: 'Group data into intervals (buckets).',
  SceneComponent: BarScene,
  ParameterPanelComponent: BarParams,
  defaultParams: {
    X: '1, 3, 5, 7, 9, 10, 12, 14, 15, 18',
    interval: '3',
    closed: 'left'
  }
};
