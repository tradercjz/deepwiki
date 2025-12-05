import React from 'react';
import { Plugin } from '../types/plugin';
import { RegroupStage } from '../../components/RegroupStage';
import { useRegroupLogic } from '../../hooks/useRegroupLogic';

const RegroupScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useRegroupLogic(params.X, params.Label, params.Func, params.ByRow);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(2); // 0->1
    }
  }, [onStepsReady]);

  return <RegroupStage progress={progress} logic={logic} byRow={params.ByRow} />;
};

const RegroupParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">X (Matrix)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
          placeholder="e.g. [[1,2],[3,4]]"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Label (Vector)</label>
        <input
          type="text"
          value={params.Label}
          onChange={(e) => setParams({ ...params, Label: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
          placeholder="e.g. [1,2,1,2]"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Func</label>
        <select
          value={params.Func}
          onChange={(e) => setParams({ ...params, Func: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        >
            <option value="sum">sum</option>
            <option value="avg">avg</option>
            <option value="max">max</option>
            <option value="min">min</option>
            <option value="first">first</option>
            <option value="last">last</option>
            <option value="count">count</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={params.ByRow}
          onChange={(e) => setParams({ ...params, ByRow: e.target.checked })}
          id="byRow"
        />
        <label htmlFor="byRow" className="text-xs text-gray-400">byRow</label>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Groups rows (or columns) of a matrix by label and applies an aggregation function.</p>
      </div>
    </div>
  );
};

export const RegroupPlugin: Plugin = {
  id: 'regroup',
  name: 'regroup',
  description: 'Groups rows/cols of a matrix by label.',
  SceneComponent: RegroupScene,
  ParameterPanelComponent: RegroupParams,
  defaultParams: {
    X: '[[11,6,6,10,4],[6,7,5,2,16],[2,16,14,19,9],[17,6,13,10,2]]',
    Label: '[1,2,1,2]',
    Func: 'max',
    ByRow: false
  }
};
