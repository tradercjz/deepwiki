import React from 'react';
import { Plugin } from '../types/plugin';
import { JoinInPlaceStage } from '../../components/JoinInPlaceStage';
import { useJoinLogic } from '../../hooks/useJoinLogic';

const JoinInPlaceScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useJoinLogic(params.X, params.Y);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (init), 1->2 (move), 2->3 (result)
    }
  }, [onStepsReady]);

  return <JoinInPlaceStage progress={progress} logic={logic} />;
};

const JoinInPlaceParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">X</label>
        <textarea
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs h-16 font-mono"
          placeholder="[1,2,3]"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Y</label>
        <textarea
          value={params.Y}
          onChange={(e) => setParams({ ...params, Y: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs h-16 font-mono"
          placeholder="[4,5,6]"
        />
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Merges Y into X (in-place).</p>
        <p className="mt-1 italic">Supports Scalars, Vectors, and Matrices (as JSON arrays).</p>
      </div>
    </div>
  );
};

export const JoinInPlacePlugin: Plugin = {
  id: 'join!',
  name: 'join!',
  description: 'Merge Y into X (in-place).',
  SceneComponent: JoinInPlaceScene,
  ParameterPanelComponent: JoinInPlaceParams,
  defaultParams: {
    X: '[1,2,3]',
    Y: '[4,5,6]'
  }
};
