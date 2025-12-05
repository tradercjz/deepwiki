import React from 'react';
import { Plugin } from '../types/plugin';
import { ShuffleStage } from '../../components/ShuffleStage';
import { useShuffleLogic } from '../../hooks/useShuffleLogic';

const ShuffleInPlaceScene: React.FC<{
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

const ShuffleInPlaceParams: React.FC<{
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
        <p>Randomly permutes elements of X in-place.</p>
      </div>
    </div>
  );
};

export const ShuffleInPlacePlugin: Plugin = {
  id: 'shuffle_inplace',
  name: 'shuffle!',
  description: 'Randomly permutes elements of a vector in-place.',
  SceneComponent: ShuffleInPlaceScene,
  ParameterPanelComponent: ShuffleInPlaceParams,
  defaultParams: {
    X: '1..10'
  }
};
