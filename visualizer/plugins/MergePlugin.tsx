import React from 'react';
import { Plugin } from '../types/plugin';
import { MergeStage } from '../../components/MergeStage';
import { useMergeLogic } from '../../hooks/useMergeLogic';

const MergeScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useMergeLogic(params.left, params.right, params.how);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (init), 1->2 (result)
    }
  }, [onStepsReady]);

  return <MergeStage progress={progress} logic={logic} />;
};

const MergeParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Left (JSON)</label>
        <textarea
          value={params.left}
          onChange={(e) => setParams({ ...params, left: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs h-16 font-mono"
          placeholder='{"index": [1,2], "data": [[10,20]]}'
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Right (JSON)</label>
        <textarea
          value={params.right}
          onChange={(e) => setParams({ ...params, right: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs h-16 font-mono"
          placeholder='{"index": [2,3], "data": [[30,40]]}'
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">How</label>
        <select
          value={params.how}
          onChange={(e) => setParams({ ...params, how: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs"
        >
          <option value="inner">inner</option>
          <option value="outer">outer</option>
          <option value="left">left</option>
          <option value="right">right</option>
          <option value="asof">asof</option>
        </select>
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Merges two indexed series/matrices.</p>
        <p className="mt-1 italic">Input format: JSON with "index" and "data" arrays.</p>
      </div>
    </div>
  );
};

export const MergePlugin: Plugin = {
  id: 'merge',
  name: 'merge',
  description: 'Merge two indexed series/matrices.',
  SceneComponent: MergeScene,
  ParameterPanelComponent: MergeParams,
  defaultParams: {
    left: '{"index": [1,2,3], "data": [[10,20,30]]}',
    right: '{"index": [2,3,4], "data": [[200,300,400]]}',
    how: 'inner'
  }
};
