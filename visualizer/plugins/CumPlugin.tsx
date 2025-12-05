import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { CumStage } from '../../components/CumStage';
import { useCumLogic } from '../../hooks/useCumLogic';
import { CumFunc } from '../../constants';

const CumScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const steps = useCumLogic(
    params.func || 'cumsum', 
    params.percent
  );

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps, onStepsReady]);

  return (
    <CumStage
      progress={progress}
      steps={steps}
      func={params.func || 'cumsum'}
    />
  );
};

const CumPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'cumsum'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as CumFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <optgroup label="Basic Unary">
            <option value="cumsum">cumsum</option>
            <option value="cumprod">cumprod</option>
            <option value="cummax">cummax</option>
            <option value="cummin">cummin</option>
            <option value="cumavg">cumavg</option>
            <option value="cummed">cummed (Median)</option>
        </optgroup>
        <optgroup label="Advanced Unary">
            <option value="cumfirstNot">cumfirstNot</option>
            <option value="cumlastNot">cumlastNot</option>
            <option value="cumrank">cumrank</option>
            <option value="cumcount">cumcount</option>
            <option value="cumpercentile">cumpercentile</option>
            <option value="cumnunique">cumnunique</option>
            <option value="cumPositiveStreak">cumPositiveStreak</option>
        </optgroup>
        <optgroup label="Statistics">
            <option value="cumstd">cumstd (Sample Std)</option>
            <option value="cumstdp">cumstdp (Pop Std)</option>
            <option value="cumvar">cumvar (Sample Var)</option>
            <option value="cumvarp">cumvarp (Pop Var)</option>
            <option value="cumsum2">cumsum2 (Sum Squares)</option>
            <option value="cumsum3">cumsum3 (Sum Cubes)</option>
            <option value="cumsum4">cumsum4 (Sum 4th)</option>
        </optgroup>
        <optgroup label="Binary">
            <option value="cumwsum">cumwsum (Weighted Sum)</option>
            <option value="cumwavg">cumwavg (Weighted Avg)</option>
            <option value="cumcovar">cumcovar</option>
            <option value="cumcorr">cumcorr</option>
            <option value="cumbeta">cumbeta (Slope Y~X)</option>
        </optgroup>
      </select>

      {params.func === 'cumpercentile' && (
        <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs">Percentile (0-100)</label>
            <input 
                type="number" 
                min="0" 
                max="100" 
                value={params.percent || 50} 
                onChange={(e) => setParams({ ...params, percent: parseFloat(e.target.value) })}
                className="bg-gray-700 p-1 rounded text-sm"
            />
        </div>
      )}
      
      <div className="text-xs text-gray-400 mt-2">
        Cumulative Window: Start is fixed at 0, End moves right.
      </div>
    </div>
  );
};

export const CumPlugin: Plugin = {
  id: 'cum',
  name: 'Cum Series',
  description: 'Visualize cumulative window functions',
  SceneComponent: CumScene,
  ParameterPanelComponent: CumPanel,
  defaultParams: {
    func: 'cumsum',
    percent: 50
  }
};
