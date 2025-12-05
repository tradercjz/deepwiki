import React from 'react';
import { Plugin } from '../types/plugin';
import { DigitizeStage } from '../../components/DigitizeStage';
import { useDigitizeLogic } from '../../hooks/useDigitizeLogic';

const DigitizeScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const rawX = React.useMemo(() => 
    params.x.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n)), 
    [params.x]
  );
  
  const rawBins = React.useMemo(() => 
    params.bins.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n)), 
    [params.bins]
  );

  const logic = useDigitizeLogic(rawX, rawBins, params.right);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (drop), 1->2 (label), 2->3 (result)
    }
  }, [onStepsReady]);

  return <DigitizeStage progress={progress} logic={logic} />;
};

const DigitizeParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">x (comma separated)</label>
        <input
          type="text"
          value={params.x}
          onChange={(e) => setParams({ ...params, x: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">bins (monotonic)</label>
        <input
          type="text"
          value={params.bins}
          onChange={(e) => setParams({ ...params, bins: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="right"
          checked={params.right}
          onChange={(e) => setParams({ ...params, right: e.target.checked })}
          className="rounded bg-gray-800 border-gray-700"
        />
        <label htmlFor="right" className="text-sm text-gray-300">Right (include right boundary)</label>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Returns the indices of the bins to which each value in input array belongs.</p>
      </div>
    </div>
  );
};

export const DigitizePlugin: Plugin = {
  id: 'digitize',
  name: 'digitize',
  description: 'Return the indices of the bins to which each value in input array belongs.',
  SceneComponent: DigitizeScene,
  ParameterPanelComponent: DigitizeParams,
  defaultParams: {
    x: '0.2, 6.4, 3.0, 1.6',
    bins: '0.0, 1.0, 2.5, 4.0, 10.0',
    right: false
  }
};
