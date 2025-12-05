import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { GroupingStage } from '../../components/GroupingStage';
import { useGroupingLogic } from '../../hooks/useGroupingLogic';
import { GroupFunc } from '../../constants';

const ContextbyScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useGroupingLogic('contextby', params.func || 'sum');

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <GroupingStage
      progress={progress}
      logic={logic}
      mode="contextby"
    />
  );
};

const ContextbyPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
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
    </div>
  );
};

export const ContextbyPlugin: Plugin = {
  id: 'contextby',
  name: 'Context By',
  description: 'Visualize contextby operation',
  SceneComponent: ContextbyScene,
  ParameterPanelComponent: ContextbyPanel,
  defaultParams: {
    func: 'sum'
  }
};
