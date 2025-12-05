import React, { useState, useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { CSEStage } from '../../components/CSEStage';
import { useCrossSectionalEngineLogic } from '../../hooks/useCrossSectionalEngineLogic';

const CSEScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const logic = useCrossSectionalEngineLogic();

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <CSEStage
      progress={progress}
      logic={logic}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
    />
  );
};

const CSEPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.cseFunc || 'sum'} 
        onChange={(e) => setParams({ ...params, cseFunc: e.target.value })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="sum">sum</option>
        <option value="avg">avg</option>
        <option value="max">max</option>
      </select>
    </div>
  );
};

export const CrossSectionalEnginePlugin: Plugin = {
  id: 'createCrossSectionalEngine',
  name: 'Cross Sectional Engine',
  description: 'Visualize cross sectional engine',
  SceneComponent: CSEScene,
  ParameterPanelComponent: CSEPanel,
  defaultParams: {
    cseFunc: 'sum'
  }
};
