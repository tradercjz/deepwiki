import React from 'react';
import { Plugin } from '../types/plugin';
import { UnionAllStage } from '../../components/UnionAllStage';
import { useUnionAllLogic } from '../../hooks/useUnionAllLogic';

const UnionAllScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useUnionAllLogic(params.tableA, params.tableB, params.byColName);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (init), 1->2 (A moves), 2->3 (B moves)
    }
  }, [onStepsReady]);

  return <UnionAllStage progress={progress} logic={logic} />;
};

const UnionAllParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Table A</label>
        <input
          type="text"
          value={params.tableA}
          onChange={(e) => setParams({ ...params, tableA: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Table B</label>
        <input
          type="text"
          value={params.tableB}
          onChange={(e) => setParams({ ...params, tableB: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={params.byColName}
          onChange={(e) => setParams({ ...params, byColName: e.target.checked })}
          className="form-checkbox h-3 w-3 text-blue-600"
        />
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">byColName</label>
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Merges two tables. If byColName is true, merges by column name; otherwise by position.</p>
      </div>
    </div>
  );
};

export const UnionAllPlugin: Plugin = {
  id: 'unionAll',
  name: 'unionAll',
  description: 'Merges two tables.',
  SceneComponent: UnionAllScene,
  ParameterPanelComponent: UnionAllParams,
  defaultParams: {
    tableA: 'table(1..3 as id, 4..6 as x)',
    tableB: 'table(7..9 as id, 10..12 as x)',
    byColName: false
  }
};
