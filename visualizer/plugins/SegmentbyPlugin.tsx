import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { SegmentbyStage } from '../../components/SegmentbyStage';
import { useSegmentbyLogic } from '../../hooks/useSegmentbyLogic';
import { SegmentFunc } from '../../constants';

const SegmentbyScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useSegmentbyLogic(params.func || 'cumsum');

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(4);
    }
  }, [logic, onStepsReady]);

  return (
    <SegmentbyStage
      progress={progress}
      logic={logic}
    />
  );
};

const SegmentbyPanel: React.FC<{ params: any; setParams: (p: any) => void }> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded text-white">
      <label className="text-sm font-bold">Function</label>
      <select 
        value={params.func || 'cumsum'} 
        onChange={(e) => setParams({ ...params, func: e.target.value as SegmentFunc })}
        className="bg-gray-700 p-1 rounded"
      >
        <option value="cumsum">cumsum</option>
        <option value="cummax">cummax</option>
        <option value="cummin">cummin</option>
      </select>
    </div>
  );
};

export const SegmentbyPlugin: Plugin = {
  id: 'segmentby',
  name: 'Segment By',
  description: 'Visualize segmentby operation',
  SceneComponent: SegmentbyScene,
  ParameterPanelComponent: SegmentbyPanel,
  defaultParams: {
    func: 'cumsum'
  }

};
