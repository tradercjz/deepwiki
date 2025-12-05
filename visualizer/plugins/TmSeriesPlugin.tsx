import React, { useState, useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { DataPipeline } from '../../components/DataPipeline';
import { useTmSeriesLogic } from '../../hooks/useTmSeriesLogic';
import { DEFAULTS } from '../../constants';

const TmSeriesScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const results = useTmSeriesLogic(params.funcWindow);

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
      funcType="tmsum"
      mode="tmFunction"
    />
  );
};

const TmSeriesPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Window Size (Time)</label>
      <input 
        type="number" 
        value={params.funcWindow} 
        onChange={(e) => setParams({ ...params, funcWindow: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
    </div>
  );
};

export const TmSeriesPlugin: Plugin = {
  id: 'tmFunction',
  name: 'TM Series Function',
  description: 'Visualize time-based moving functions',
  SceneComponent: TmSeriesScene,
  ParameterPanelComponent: TmSeriesPanel,
  defaultParams: {
    funcWindow: DEFAULTS.funcWindow
  }
};
