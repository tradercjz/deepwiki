import React from 'react';
import { Plugin } from '../types/plugin';
import { DailyAlignedBarStage } from '../../components/DailyAlignedBarStage';
import { useDailyAlignedBarLogic } from '../../hooks/useDailyAlignedBarLogic';

const DailyAlignedBarScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useDailyAlignedBarLogic(params.sessions, params.intervalMinutes, params.mergeSessionEnd);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(4); // 0->1 (show), 1->2 (grid), 2->3 (move), 3->4 (table)
    }
  }, [onStepsReady]);

  return <DailyAlignedBarStage progress={progress} logic={logic} />;
};

const DailyAlignedBarParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Sessions (HH:MM-HH:MM, ...)</label>
        <input
          type="text"
          value={params.sessions}
          onChange={(e) => setParams({ ...params, sessions: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Interval (minutes)</label>
        <input
          type="number"
          min="1"
          max="120"
          value={params.intervalMinutes}
          onChange={(e) => setParams({ ...params, intervalMinutes: Number(e.target.value) })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="mergeSessionEnd"
          checked={params.mergeSessionEnd}
          onChange={(e) => setParams({ ...params, mergeSessionEnd: e.target.checked })}
          className="rounded bg-gray-800 border-gray-700"
        />
        <label htmlFor="mergeSessionEnd" className="text-sm text-gray-300">Merge Session End</label>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Aligns timestamps to daily sessions.</p>
      </div>
    </div>
  );
};

export const DailyAlignedBarPlugin: Plugin = {
  id: 'dailyAlignedBar',
  name: 'dailyAlignedBar',
  description: 'Align timestamps to daily sessions.',
  SceneComponent: DailyAlignedBarScene,
  ParameterPanelComponent: DailyAlignedBarParams,
  defaultParams: {
    sessions: '09:30-11:30, 13:00-15:00',
    intervalMinutes: 60,
    mergeSessionEnd: false
  }
};
