import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { AccumulateStage } from '../../components/AccumulateStage';
import { useAccumulateLogic } from '../../hooks/useAccumulateLogic';
import { AccFunc } from '../../constants';

const AccumulateScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useAccumulateLogic(params.func || 'sum');
  
  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return <AccumulateStage progress={progress} logic={logic} />;
};

const AccumulatePanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'sum'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as AccFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="sum">Sum</option>
        <option value="prod">Product</option>
        <option value="max">Max</option>
      </select>
    </div>
  );
};

export const AccumulatePlugin: Plugin = {
  id: 'accumulate',
  name: 'Accumulate',
  description: 'Visualize the accumulate function (scan)',
  SceneComponent: AccumulateScene,
  ParameterPanelComponent: AccumulatePanel,
  defaultParams: {
    func: 'sum'
  }
};
