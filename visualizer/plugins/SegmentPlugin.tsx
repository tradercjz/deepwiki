import React from 'react';
import { Plugin } from '../types/plugin';
import { SegmentStage } from '../../components/SegmentStage';
import { useSegmentLogic } from '../../hooks/useSegmentLogic';

const SegmentScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useSegmentLogic(params.X, params.segmentOffset);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (highlight), 1->2 (result)
    }
  }, [onStepsReady]);

  return <SegmentStage progress={progress} logic={logic} />;
};

const SegmentParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">X (comma separated, use NULL for nulls)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="segmentOffset"
          checked={params.segmentOffset}
          onChange={(e) => setParams({ ...params, segmentOffset: e.target.checked })}
          className="rounded bg-gray-800 border-gray-700"
        />
        <label htmlFor="segmentOffset" className="text-sm text-gray-300">segmentOffset (true: start index, false: group id)</label>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Groups consecutive identical elements.</p>
      </div>
    </div>
  );
};

export const SegmentPlugin: Plugin = {
  id: 'segment',
  name: 'segment',
  description: 'Group consecutive identical elements.',
  SceneComponent: SegmentScene,
  ParameterPanelComponent: SegmentParams,
  defaultParams: {
    X: '1, 1, 2, 4, 4, 5, 2, 5, NULL, NULL',
    segmentOffset: true
  }
};
