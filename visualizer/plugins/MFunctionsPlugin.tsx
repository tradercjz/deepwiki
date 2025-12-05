import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { MFunctionsStage } from '../../components/MFunctionsStage';
import { useMFunctionsLogic, MFuncType } from '../../hooks/useMFunctionsLogic';

const MFunctionsScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useMFunctionsLogic(params.func || 'msum', params.window || 3, params.minPeriods);

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <MFunctionsStage
      progress={progress}
      logic={logic}
      funcName={params.func || 'msum'}
    />
  );
};

const MFunctionsPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'msum'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as MFuncType })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="msum">msum</option>
        <option value="mavg">mavg</option>
        <option value="mmax">mmax</option>
        <option value="mmin">mmin</option>
        <option value="mcount">mcount</option>
        <option value="mprod">mprod</option>
        <option value="mvar">mvar</option>
        <option value="mstd">mstd</option>
      </select>

      <label className="text-sm font-bold">Window Size</label>
      <input 
        type="number" 
        value={params.window || 3} 
        onChange={(e) => setParams({ ...params, window: Number(e.target.value) })}
        className="bg-gray-700 p-1 rounded"
        min="2"
      />

      <label className="text-sm font-bold">Min Periods (Optional)</label>
      <input 
        type="number" 
        value={params.minPeriods !== undefined ? params.minPeriods : ''} 
        onChange={(e) => {
            const val = e.target.value;
            setParams({ ...params, minPeriods: val === '' ? undefined : Number(val) });
        }}
        placeholder="Default: window"
        className="bg-gray-700 p-1 rounded"
        min="1"
      />
    </div>
  );
};

export const MFunctionsPlugin: Plugin = {
  id: 'm-functions',
  name: 'M Functions',
  description: 'Visualize moving window functions (msum, mavg, etc.)',
  SceneComponent: MFunctionsScene,
  ParameterPanelComponent: MFunctionsPanel,
  defaultParams: {
    func: 'msum',
    window: 3,
    minPeriods: undefined
  }
};
