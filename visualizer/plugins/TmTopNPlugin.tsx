import React from 'react';
import { Plugin } from '../types/plugin';
import { TmTopNStage } from '../../components/TmTopNStage';
import { TmTopNFuncType, TiesMethod } from '../../hooks/useTmTopNLogic';

const TmTopNPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded text-white">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Function</label>
        <select 
          value={params.func} 
          onChange={(e) => setParams({ ...params, func: e.target.value as TmTopNFuncType })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
        >
          <option value="tmsumTopN">tmsumTopN</option>
          <option value="tmavgTopN">tmavgTopN</option>
          <option value="tmmaxTopN">tmmaxTopN</option>
          <option value="tmminTopN">tmminTopN</option>
          <option value="tmcountTopN">tmcountTopN</option>
          <option value="tmvarTopN">tmvarTopN</option>
          <option value="tmstdTopN">tmstdTopN</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Window Size (Time)</label>
        <input 
          type="number" 
          value={params.window} 
          onChange={(e) => setParams({ ...params, window: Number(e.target.value) })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
          min="1"
          max="10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Top N</label>
        <input 
          type="number" 
          value={params.top} 
          onChange={(e) => setParams({ ...params, top: Number(e.target.value) })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
          min="1"
          max="10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Sort Order</label>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={params.ascending} 
            onChange={(e) => setParams({ ...params, ascending: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">{params.ascending ? 'Ascending' : 'Descending'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Ties Method</label>
        <select 
          value={params.tiesMethod} 
          onChange={(e) => setParams({ ...params, tiesMethod: e.target.value as TiesMethod })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
        >
          <option value="latest">latest</option>
          <option value="oldest">oldest</option>
          <option value="all">all</option>
        </select>
      </div>
    </div>
  );
};

export const TmTopNPlugin: Plugin = {
  id: 'tmTopN',
  name: 'TM TopN Functions',
  description: 'Visualize time-based moving window TopN functions (tmsumTopN, tmavgTopN, etc.)',
  SceneComponent: TmTopNStage,
  ParameterPanelComponent: TmTopNPanel,
  defaultParams: {
    func: 'tmsumTopN',
    window: 3,
    top: 3,
    ascending: true,
    tiesMethod: 'latest'
  }
};
