import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { RowGroupbyStage } from '../../components/RowGroupbyStage';
import { useRowGroupbyLogic } from '../../hooks/useRowGroupbyLogic';
import { GroupFunc, RowGroupbyMode } from '../../constants';

const RowGroupbyScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const steps = useRowGroupbyLogic(params.func || 'sum', params.ascending ?? true);

  useEffect(() => {
    if (onStepsReady) {
      // We have 5 phases of animation
      onStepsReady(5);
    }
  }, [steps, onStepsReady]);

  return (
    <RowGroupbyStage
      progress={progress}
      steps={steps}
      mode={params.mode || 'tuple'}
    />
  );
};

const RowGroupbyPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'sum'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as GroupFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="sum">sum</option>
        <option value="avg">avg</option>
        <option value="max">max</option>
        <option value="count">count</option>
      </select>

      <label className="text-sm font-bold mt-2">Output Mode</label>
      <select 
        value={params.mode || 'tuple'} 
        onChange={(e) => setParams({ ...params, mode: e.target.value as RowGroupbyMode })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="tuple">Tuple (Keys, Values)</option>
        <option value="dict">Dictionary</option>
        <option value="table">Table</option>
      </select>

      <label className="text-sm font-bold mt-2">Sort Order</label>
      <div className="flex items-center gap-2">
        <input 
            type="checkbox" 
            checked={params.ascending ?? true} 
            onChange={(e) => setParams({ ...params, ascending: e.target.checked })}
        />
        <span className="text-sm">Ascending</span>
      </div>
    </div>
  );
};

export const RowGroupbyPlugin: Plugin = {
  id: 'rowGroupby',
  name: 'RowGroupby',
  description: 'Visualize row-based grouping and aggregation',
  SceneComponent: RowGroupbyScene,
  ParameterPanelComponent: RowGroupbyPanel,
  defaultParams: {
    func: 'sum',
    ascending: true,
    mode: 'tuple'
  }
};
