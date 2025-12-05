import React, { useState } from 'react';
import { Plugin } from '../types/plugin';
import { RowFunctionsStage } from '../../components/RowFunctionsStage';
import { RowFuncType } from '../../hooks/useRowFunctionsLogic';

const RowFunctionsPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded text-white">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Function</label>
        <select 
          value={params.func} 
          onChange={(e) => setParams({ ...params, func: e.target.value as RowFuncType })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
        >
          <option value="rowSum">rowSum</option>
          <option value="rowAvg">rowAvg</option>
          <option value="rowMax">rowMax</option>
          <option value="rowMin">rowMin</option>
          <option value="rowProd">rowProd</option>
          <option value="rowCount">rowCount</option>
          <option value="rowVar">rowVar</option>
          <option value="rowStd">rowStd</option>
          <option value="rowWsum">rowWsum (Binary)</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Rows</label>
        <input 
          type="number" 
          value={params.rows} 
          onChange={(e) => setParams({ ...params, rows: Number(e.target.value) })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
          min="1"
          max="10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-400">Columns</label>
        <input 
          type="number" 
          value={params.cols} 
          onChange={(e) => setParams({ ...params, cols: Number(e.target.value) })}
          className="bg-gray-700 p-2 rounded border border-gray-600 focus:border-cyan-500 outline-none"
          min="1"
          max="10"
        />
      </div>
    </div>
  );
};

export const RowFunctionsPlugin: Plugin = {
  id: 'rowFunctions',
  name: 'Row Functions',
  description: 'Visualize row-based calculations (rowSum, rowAvg, etc.) on matrices',
  SceneComponent: RowFunctionsStage,
  ParameterPanelComponent: RowFunctionsPanel,
  defaultParams: {
    func: 'rowSum',
    rows: 5,
    cols: 4
  }
};
