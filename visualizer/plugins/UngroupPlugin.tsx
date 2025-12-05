import React from 'react';
import { Plugin } from '../types/plugin';
import { UngroupStage } from '../../components/UngroupStage';
import { useUngroupLogic } from '../../hooks/useUngroupLogic';

const UngroupScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useUngroupLogic(params.IDs, params.Values);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(2); // 0->1
    }
  }, [onStepsReady]);

  return <UngroupStage progress={progress} logic={logic} />;
};

const UngroupParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">IDs (Vector)</label>
        <input
          type="text"
          value={params.IDs}
          onChange={(e) => setParams({ ...params, IDs: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
          placeholder="e.g. [1, 2]"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Values (Tuple of Vectors)</label>
        <input
          type="text"
          value={params.Values}
          onChange={(e) => setParams({ ...params, Values: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
          placeholder="e.g. ([10, 20], [30])"
        />
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Expands array columns in a table. Each element in the array becomes a new row, duplicating other columns.</p>
      </div>
    </div>
  );
};

export const UngroupPlugin: Plugin = {
  id: 'ungroup',
  name: 'ungroup',
  description: 'Expands array columns in a table.',
  SceneComponent: UngroupScene,
  ParameterPanelComponent: UngroupParams,
  defaultParams: {
    IDs: '[1, 2]',
    Values: '([10, 20], [30, 40, 50])'
  }
};
