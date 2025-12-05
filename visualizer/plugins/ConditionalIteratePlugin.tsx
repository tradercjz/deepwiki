import React, { useState, useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { DataPipeline } from '../../components/DataPipeline';
import { useConditionalIterateLogic } from '../../hooks/useConditionalIterate';
import { FuncType, DEFAULTS } from '../../constants';

const ConditionalIterateScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const results = useConditionalIterateLogic(params.threshold, params.funcType, params.funcWindow);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(results.length);
    }
  }, [results, onStepsReady]);

  return (
    <DataPipeline
      progress={progress}
      results={results}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      funcWindow={params.funcWindow}
      funcType={params.funcType}
      mode="conditionalIterate"
    />
  );
};

const ConditionalIteratePanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Threshold</label>
      <input 
        type="number" 
        value={params.threshold} 
        onChange={(e) => setParams({ ...params, threshold: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />

      <label className="text-sm font-bold">Function Type</label>
      <select 
        value={params.funcType} 
        onChange={(e) => setParams({ ...params, funcType: e.target.value as FuncType })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="msum">msum</option>
        <option value="mavg">mavg</option>
        <option value="mmax">mmax</option>
        <option value="mmin">mmin</option>
        <option value="tmsum">tmsum</option>
      </select>

      <label className="text-sm font-bold">Window Size</label>
      <input 
        type="number" 
        value={params.funcWindow} 
        onChange={(e) => setParams({ ...params, funcWindow: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
    </div>
  );
};

export const ConditionalIteratePlugin: Plugin = {
  id: 'conditionalIterate',
  name: 'Conditional Iterate',
  description: 'Visualize conditional iteration logic',
  SceneComponent: ConditionalIterateScene,
  ParameterPanelComponent: ConditionalIteratePanel,
  defaultParams: {
    threshold: DEFAULTS.threshold,
    funcType: DEFAULTS.funcType,
    funcWindow: DEFAULTS.funcWindow
  }
};
