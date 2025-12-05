import React, { useState, useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { PivotStage } from '../../components/PivotStage';
import { usePivotLogic } from '../../hooks/usePivotLogic';

const PivotScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const logic = usePivotLogic(params.pivotFunc);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <PivotStage
      progress={progress}
      logic={logic}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
    />
  );
};

const PivotPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Pivot Function</label>
      <select 
        value={params.pivotFunc} 
        onChange={(e) => setParams({ ...params, pivotFunc: e.target.value })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="last">last</option>
        <option value="sum">sum</option>
        <option value="count">count</option>
      </select>
    </div>
  );
};

export const PivotPlugin: Plugin = {
  id: 'pivot',
  name: 'Pivot',
  description: 'Visualize pivot table operations',
  SceneComponent: PivotScene,
  ParameterPanelComponent: PivotPanel,
  defaultParams: {
    pivotFunc: 'last'
  }
};
