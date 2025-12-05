import React from 'react';
import { Plugin } from '../types/plugin';
import { UnionStage } from '../../components/UnionStage';
import { useUnionLogic } from '../../hooks/useUnionLogic';

const UnionScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useUnionLogic(params.X, params.Y);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (init), 1->2 (result)
    }
  }, [onStepsReady]);

  return <UnionStage progress={progress} logic={logic} />;
};

const UnionParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">X (Set/Vector)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Y (Set/Vector)</label>
        <input
          type="text"
          value={params.Y}
          onChange={(e) => setParams({ ...params, Y: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
        />
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Returns the union of two sets.</p>
      </div>
    </div>
  );
};

export const UnionPlugin: Plugin = {
  id: 'union',
  name: 'union',
  description: 'Returns the union of two sets.',
  SceneComponent: UnionScene,
  ParameterPanelComponent: UnionParams,
  defaultParams: {
    X: '[5, 5, 3, 4]',
    Y: '[8, 9, 9, 4, 6]'
  }
};
