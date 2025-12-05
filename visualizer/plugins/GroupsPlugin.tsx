import React from 'react';
import { Plugin } from '../types/plugin';
import { GroupsStage } from '../../components/GroupsStage';
import { useGroupsLogic } from '../../hooks/useGroupsLogic';

const GroupsScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useGroupsLogic(params.X, params.mode);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (group), 1->2 (result)
    }
  }, [onStepsReady]);

  return <GroupsStage progress={progress} logic={logic} />;
};

const GroupsParams: React.FC<{
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

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Mode</label>
        <select
          value={params.mode}
          onChange={(e) => setParams({ ...params, mode: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        >
            <option value="dict">dict</option>
            <option value="table">table</option>
            <option value="vector">vector</option>
            <option value="tuple">tuple</option>
        </select>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Groups indices by unique values.</p>
      </div>
    </div>
  );
};

export const GroupsPlugin: Plugin = {
  id: 'groups',
  name: 'groups',
  description: 'Group indices by unique values.',
  SceneComponent: GroupsScene,
  ParameterPanelComponent: GroupsParams,
  defaultParams: {
    X: 'NULL, NULL, 12, 15, 12, 16, 15, 14, NULL, NULL',
    mode: 'dict'
  }
};
