import React from 'react';
import { Plugin } from '../types/plugin';
import { TmFunctionsStage } from '../../components/TmFunctionsStage';
import { TmFuncType } from '../../hooks/useTmFunctionsLogic';

const TmFunctionsPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded text-white">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Function</label>
        <select
          value={params.func}
          onChange={(e) => setParams({ ...params, func: e.target.value as TmFuncType })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
        >
          <option value="tmsum">tmsum</option>
          <option value="tmavg">tmavg</option>
          <option value="tmmax">tmmax</option>
          <option value="tmmin">tmmin</option>
          <option value="tmcount">tmcount</option>
          <option value="tmprod">tmprod</option>
          <option value="tmvar">tmvar</option>
          <option value="tmstd">tmstd</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Window Size (Time)</label>
        <input
          type="number"
          min="1"
          value={params.window}
          onChange={(e) => setParams({ ...params, window: Math.max(1, parseInt(e.target.value) || 1) })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
        />
        <div className="text-xs text-gray-500">
          Window range: (T - window, T]
        </div>
      </div>
    </div>
  );
};

export const TmFunctionsPlugin: Plugin = {
  id: 'tmFunctions',
  name: 'TM Functions',
  description: 'Visualize time-based moving window functions (tmsum, tmavg, etc.)',
  SceneComponent: TmFunctionsStage,
  ParameterPanelComponent: TmFunctionsPanel,
  defaultParams: {
    func: 'tmsum',
    window: 3
  }
};
