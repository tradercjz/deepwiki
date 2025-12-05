import React from 'react';
import { Plugin } from '../types/plugin';
import { FlattenStage } from '../../components/FlattenStage';
import { useFlattenLogic } from '../../hooks/useFlattenLogic';

const FlattenScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useFlattenLogic(params.X);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(2); // 0->1 (flatten)
    }
  }, [onStepsReady]);

  return <FlattenStage progress={progress} logic={logic} />;
};

const FlattenParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">X (Tuple/Vector string, e.g. (1, (2, [3,4]), [5,6]))</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Converts a matrix, tuple, or list of vectors into a one-dimensional vector (or partially flattened tuple).</p>
      </div>
    </div>
  );
};

export const FlattenPlugin: Plugin = {
  id: 'flatten',
  name: 'flatten',
  description: 'Converts a matrix, tuple, or list of vectors into a one-dimensional vector.',
  SceneComponent: FlattenScene,
  ParameterPanelComponent: FlattenParams,
  defaultParams: {
    X: '(1, (2, (3, 4, 5)), (6, 7), 8, [9])'
  }
};
