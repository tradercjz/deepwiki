import React from 'react';
import { Plugin } from '../types/plugin';
import { VolumeBarStage } from '../../components/VolumeBarStage';
import { useVolumeBarLogic } from '../../hooks/useVolumeBarLogic';

const VolumeBarScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useVolumeBarLogic(params.X, params.interval, params.label);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (group), 1->2 (result)
    }
  }, [onStepsReady]);

  return <VolumeBarStage progress={progress} logic={logic} />;
};

const VolumeBarParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">X (comma separated)</label>
        <input
          type="text"
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Interval (threshold)</label>
        <input
          type="number"
          value={params.interval}
          onChange={(e) => setParams({ ...params, interval: Number(e.target.value) })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Label Mode</label>
        <select
          value={params.label}
          onChange={(e) => setParams({ ...params, label: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        >
            <option value="seq">seq (0, 1, 2...)</option>
            <option value="left">left (cumSum before group)</option>
            <option value="right">right (cumSum after group)</option>
        </select>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Groups elements by cumulative sum threshold.</p>
      </div>
    </div>
  );
};

export const VolumeBarPlugin: Plugin = {
  id: 'volumeBar',
  name: 'volumeBar',
  description: 'Group elements by cumulative sum threshold.',
  SceneComponent: VolumeBarScene,
  ParameterPanelComponent: VolumeBarParams,
  defaultParams: {
    X: '1, 3, 4, 2, 2, 1, 1, 1, 1, 6, 8',
    interval: 4,
    label: 'seq'
  }
};
