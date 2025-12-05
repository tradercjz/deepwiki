import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { AggrTopNStage } from '../../components/AggrTopNStage';
import { useAggrTopNLogic, AggrFunc } from '../../hooks/useAggrTopNLogic';

const AggrTopNScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useAggrTopNLogic(params.func || 'sum', params.top || 3, params.ascending ?? false);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <AggrTopNStage
      progress={progress}
      logic={logic}
    />
  );
};

const AggrTopNPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'sum'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as AggrFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="sum">sum</option>
        <option value="max">max</option>
        <option value="min">min</option>
        <option value="avg">avg</option>
        <option value="count">count</option>
      </select>

      <label className="text-sm font-bold">Top N</label>
      <input 
        type="number" 
        value={params.top || 3} 
        onChange={(e) => setParams({ ...params, top: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />

      <label className="flex items-center gap-2 text-sm font-bold">
        <input 
          type="checkbox" 
          checked={params.ascending ?? false} 
          onChange={(e) => setParams({ ...params, ascending: e.target.checked })}
        />
        Ascending
      </label>
    </div>
  );
};

export const AggrTopNPlugin: Plugin = {
  id: 'aggrTopN',
  name: 'Aggr Top N',
  description: 'Visualize aggregate top N',
  SceneComponent: AggrTopNScene,
  ParameterPanelComponent: AggrTopNPanel,
  defaultParams: {
    func: 'sum',
    top: 3,
    ascending: false
  }
};
