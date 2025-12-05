import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { TSEngineStage } from '../../components/TSEngineStage';
import { useTimeSeriesEngineLogic } from '../../hooks/useTimeSeriesEngineLogic';
import { DEFAULTS } from '../../constants';

const TSEngineScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useTimeSeriesEngineLogic(params.tsWindowSize, params.tsStep);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <TSEngineStage
      progress={progress}
      logic={logic}
      windowSize={params.tsWindowSize}
    />
  );
};

const TSEnginePanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Window Size (ms)</label>
      <input 
        type="number" 
        value={params.tsWindowSize} 
        onChange={(e) => setParams({ ...params, tsWindowSize: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
      <label className="text-sm font-bold">Step (ms)</label>
      <input 
        type="number" 
        value={params.tsStep} 
        onChange={(e) => setParams({ ...params, tsStep: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
      />
    </div>
  );
};

export const TimeSeriesEnginePlugin: Plugin = {
  id: 'createTimeSeriesEngine',
  name: 'Time Series Engine',
  description: 'Visualize time series engine processing',
  SceneComponent: TSEngineScene,
  ParameterPanelComponent: TSEnginePanel,
  defaultParams: {
    tsWindowSize: DEFAULTS.tsWindowSize,
    tsStep: DEFAULTS.tsStep
  }
};
