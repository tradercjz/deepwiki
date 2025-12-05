import React from 'react';
import { Plugin } from '../types/plugin';
import { ShuffleStage } from '../../components/ShuffleStage';
import { useShuffleLogic } from '../../hooks/useShuffleLogic';

const ShuffleScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useShuffleLogic(params.X);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(2); // 0->1
    }
  }, [onStepsReady]);

  return <ShuffleStage progress={progress} logic={logic} />;
};

const ShuffleParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">X (Vector)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
          placeholder="e.g. 1..10"
        />
      </div>
      <div className="text-xs text-gray-500 mt-2">
        <p>Returns a new vector with elements of X randomly permuted.</p>
      </div>
    </div>
  );
};

export const ShufflePlugin: Plugin = {
  id: 'shuffle',
  name: 'shuffle',
  description: 'Randomly permutes elements of a vector.',
  SceneComponent: ShuffleScene,
  ParameterPanelComponent: ShuffleParams,
  defaultParams: {
    X: '1..10'
  }
};
