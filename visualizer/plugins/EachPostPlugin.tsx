import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { EachPairStage } from '../../components/EachPairStage';
import { useEachPairLogic } from '../../hooks/useEachPairLogic';
import { PairFunc } from '../../constants';

const EachPostScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useEachPairLogic('post', params.func || 'sub', params.boundaryVal ?? 0);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <EachPairStage
      progress={progress}
      logic={logic}
      mode="post"
    />
  );
};

const EachPostPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'sub'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as PairFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="sub">sub (-)</option>
        <option value="add">add (+)</option>
        <option value="ratio">ratio (/)</option>
      </select>

      <label className="text-sm font-bold">Boundary Value</label>
      <input 
        type="number" 
        value={params.boundaryVal ?? 0} 
        onChange={(e) => setParams({ ...params, boundaryVal: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
    </div>
  );
};

export const EachPostPlugin: Plugin = {
  id: 'eachPost',
  name: 'Each Post',
  description: 'Visualize eachPost function',
  SceneComponent: EachPostScene,
  ParameterPanelComponent: EachPostPanel,
  defaultParams: {
    func: 'sub',
    boundaryVal: 0
  }
};
