import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { CumTopNStage } from '../../components/CumTopNStage';
import { useCumTopNLogic } from '../../hooks/useCumTopNLogic';
import { CumTopNFunc } from '../../constants';

const CumTopNScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const steps = useCumTopNLogic(
    params.func || 'cumsumTopN', 
    params.top, 
    params.ascending, 
    params.tiesMethod
  );

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps, onStepsReady]);

  return (
    <CumTopNStage
      progress={progress}
      steps={steps}
      func={params.func || 'cumsumTopN'}
    />
  );
};

const CumTopNPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'cumsumTopN'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as CumTopNFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <optgroup label="TopN Unary">
            <option value="cumsumTopN">cumsumTopN</option>
            <option value="cumavgTopN">cumavgTopN</option>
            <option value="cumstdTopN">cumstdTopN</option>
            <option value="cumstdpTopN">cumstdpTopN</option>
            <option value="cumvarTopN">cumvarTopN</option>
            <option value="cumvarpTopN">cumvarpTopN</option>
            <option value="cumskewTopN">cumskewTopN</option>
            <option value="cumkurtosisTopN">cumkurtosisTopN</option>
        </optgroup>
        <optgroup label="TopN Binary">
            <option value="cumbetaTopN">cumbetaTopN</option>
            <option value="cumcorrTopN">cumcorrTopN</option>
            <option value="cumcovarTopN">cumcovarTopN</option>
            <option value="cumwsumTopN">cumwsumTopN</option>
        </optgroup>
      </select>

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-xs">Top N</label>
        <input 
            type="number" 
            min="1" 
            value={params.top || 3} 
            onChange={(e) => setParams({ ...params, top: parseInt(e.target.value) })}
            className="bg-gray-700 p-1 rounded text-sm"
        />
      </div>
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-xs">Sort Order</label>
        <select 
            value={params.ascending === false ? 'false' : 'true'} 
            onChange={(e) => setParams({ ...params, ascending: e.target.value === 'true' })}
            className="bg-gray-700 p-1 rounded text-sm"
        >
            <option value="true">Ascending</option>
            <option value="false">Descending</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-xs">Ties Method</label>
        <select 
            value={params.tiesMethod || 'latest'} 
            onChange={(e) => setParams({ ...params, tiesMethod: e.target.value })}
            className="bg-gray-700 p-1 rounded text-sm"
        >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="all">All</option>
        </select>
      </div>
      
      <div className="text-xs text-gray-400 mt-2">
        Cumulative Window: Start is fixed at 0, End moves right.
        TopN selects elements based on S vector.
      </div>
    </div>
  );
};

export const CumTopNPlugin: Plugin = {
  id: 'cumTopN',
  name: 'Cum TopN Series',
  description: 'Visualize cumulative TopN window functions',
  SceneComponent: CumTopNScene,
  ParameterPanelComponent: CumTopNPanel,
  defaultParams: {
    func: 'cumsumTopN',
    top: 3,
    ascending: true,
    tiesMethod: 'latest'
  }
};
