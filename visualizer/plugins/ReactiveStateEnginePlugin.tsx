import React, { useState, useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { RSEStage } from '../../components/RSEStage';
import { useReactiveStateEngineLogic } from '../../hooks/useReactiveStateEngineLogic';

const RSEScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const logic = useReactiveStateEngineLogic(params.rseFunc || 'msum');

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <RSEStage
      progress={progress}
      logic={logic}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
    />
  );
};

const RSEPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.rseFunc || 'msum'} 
        onChange={(e) => setParams({ ...params, rseFunc: e.target.value })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="msum">msum</option>
        <option value="mavg">mavg</option>
        <option value="cumsum">cumsum</option>
      </select>
    </div>
  );
};

export const ReactiveStateEnginePlugin: Plugin = {
  id: 'createReactiveStateEngine',
  name: 'Reactive State Engine',
  description: 'Visualize reactive state engine',
  SceneComponent: RSEScene,
  ParameterPanelComponent: RSEPanel,
  defaultParams: {
    rseFunc: 'msum'
  }
};
