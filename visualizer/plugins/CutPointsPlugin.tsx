import React from 'react';
import { Plugin } from '../types/plugin';
import { CutPointsStage } from '../../components/CutPointsStage';
import { useCutPointsLogic } from '../../hooks/useCutPointsLogic';

const CutPointsScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const rawX = React.useMemo(() => 
    params.X.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n)), 
    [params.X]
  );
  
  const rawFreq = React.useMemo(() => 
    params.freq ? params.freq.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n)) : undefined,
    [params.freq]
  );

  const logic = useCutPointsLogic(rawX, params.binNum, rawFreq);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (show), 1->2 (cut), 2->3 (result)
    }
  }, [onStepsReady]);

  return <CutPointsStage progress={progress} logic={logic} />;
};

const CutPointsParams: React.FC<{
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
        <label className="text-xs text-gray-400 mb-1 block">Bin Num</label>
        <input
          type="number"
          min="1"
          max="10"
          value={params.binNum}
          onChange={(e) => setParams({ ...params, binNum: Number(e.target.value) })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Freq (optional, comma separated)</label>
        <input
          type="text"
          value={params.freq || ''}
          onChange={(e) => setParams({ ...params, freq: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
          placeholder="e.g. 1, 1, 1, 3"
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>Distributes data evenly into bins.</p>
      </div>
    </div>
  );
};

export const CutPointsPlugin: Plugin = {
  id: 'cutPoints',
  name: 'cutPoints',
  description: 'Find cut points for equal-depth binning.',
  SceneComponent: CutPointsScene,
  ParameterPanelComponent: CutPointsParams,
  defaultParams: {
    X: '2, 3, 1, 4',
    binNum: 2,
    freq: ''
  }
};
