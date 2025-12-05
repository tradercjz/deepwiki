import React from 'react';
import { Plugin } from '../types/plugin';
import { BucketStage } from '../../components/BucketStage';
import { useBucketLogic } from '../../hooks/useBucketLogic';

const BucketScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useBucketLogic(params.rangeStart, params.rangeEnd, params.bucketNum, params.includeOutbound);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (show), 1->2 (move), 2->3 (result)
    }
  }, [onStepsReady]);

  return <BucketStage progress={progress} logic={logic} />;
};

const BucketParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Range Start</label>
            <input
            type="number"
            value={params.rangeStart}
            onChange={(e) => setParams({ ...params, rangeStart: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
            />
        </div>
        <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Range End</label>
            <input
            type="number"
            value={params.rangeEnd}
            onChange={(e) => setParams({ ...params, rangeEnd: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
            />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Bucket Num</label>
        <input
          type="number"
          min="1"
          max="10"
          value={params.bucketNum}
          onChange={(e) => setParams({ ...params, bucketNum: Number(e.target.value) })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeOutbound"
          checked={params.includeOutbound}
          onChange={(e) => setParams({ ...params, includeOutbound: e.target.checked })}
          className="rounded bg-gray-800 border-gray-700"
        />
        <label htmlFor="includeOutbound" className="text-sm text-gray-300">Include Outbound</label>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Assigns values to buckets based on range.</p>
        <p className="mt-1">
          Bucket Size: {(params.rangeEnd - params.rangeStart) / params.bucketNum}
        </p>
      </div>
    </div>
  );
};

export const BucketPlugin: Plugin = {
  id: 'bucket',
  name: 'bucket',
  description: 'Assign values to buckets.',
  SceneComponent: BucketScene,
  ParameterPanelComponent: BucketParams,
  defaultParams: {
    rangeStart: 12,
    rangeEnd: 54,
    bucketNum: 2,
    includeOutbound: false
  }
};
