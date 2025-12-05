import React from 'react';
import { Plugin } from '../types/plugin';
import { ReshapeStage } from '../../components/ReshapeStage';
import { useReshapeLogic } from '../../hooks/useReshapeLogic';

const ReshapeScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useReshapeLogic(params.X, params.Dim);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(2); // 0->1
    }
  }, [onStepsReady]);

  return <ReshapeStage progress={progress} logic={logic} />;
};

const ReshapeParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">X (Vector or Matrix)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
          placeholder="e.g. 1..6 or [[1,2],[3,4]]"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Dim (Vector)</label>
        <input
          type="text"
          value={params.Dim}
          onChange={(e) => setParams({ ...params, Dim: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
          placeholder="e.g. [2,3]"
        />
      </div>
      <div className="text-xs text-gray-500 mt-2">
        <p>Reshapes X into a matrix with dimensions specified by Dim. Data is filled column by column.</p>
      </div>
    </div>
  );
};

export const ReshapePlugin: Plugin = {
  id: 'reshape',
  name: 'reshape',
  description: 'Reshapes a vector/matrix into new dimensions.',
  SceneComponent: ReshapeScene,
  ParameterPanelComponent: ReshapeParams,
  defaultParams: {
    X: '[1,2,3,4,5,6]',
    Dim: '[2,3]'
  }
};
