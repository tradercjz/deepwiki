import React from 'react';
import { Plugin } from '../types/plugin';
import { ConcatMatrixStage } from '../../components/ConcatMatrixStage';
import { useConcatMatrixLogic } from '../../hooks/useConcatMatrixLogic';

const ConcatMatrixScene: React.FC<{
  isPlaying: boolean;
  progress: number;
  params: any;
  onStepsReady?: (steps: number) => void;
}> = ({ progress, params, onStepsReady }) => {
  const logic = useConcatMatrixLogic(params.X, params.horizontal);

  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(3); // 0->1 (init), 1->2 (move), 2->3 (result)
    }
  }, [onStepsReady]);

  return <ConcatMatrixStage progress={progress} logic={logic} />;
};

const ConcatMatrixParams: React.FC<{
  params: any;
  setParams: (params: any) => void;
}> = ({ params, setParams }) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">X (Tuple of Matrices)</label>
        <textarea
          value={params.X}
          onChange={(e) => setParams({ ...params, X: e.target.value })}
          className="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-xs h-24 font-mono"
          placeholder="[[[1,2],[3,4]], [[5,6],[7,8]]]"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Horizontal</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={params.horizontal}
            onChange={(e) => setParams({ ...params, horizontal: e.target.checked })}
            className="bg-gray-800 border-gray-700 rounded"
          />
          <span className="text-xs text-gray-300">True (Horizontal) / False (Vertical)</span>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 mt-2 leading-tight border-t border-gray-800 pt-2">
        <p>Concatenates multiple matrices horizontally or vertically.</p>
        <p className="mt-1 italic">Input format: List of matrices, where each matrix is a list of columns.</p>
      </div>
    </div>
  );
};

export const ConcatMatrixPlugin: Plugin = {
  id: 'concatMatrix',
  name: 'concatMatrix',
  description: 'Concatenate matrices horizontally or vertically.',
  SceneComponent: ConcatMatrixScene,
  ParameterPanelComponent: ConcatMatrixParams,
  defaultParams: {
    // m1 = matrix(4 0 5, 2 1 8) -> 2 cols, 3 rows. Cols: [4,0,5], [2,1,8]
    // m2 = matrix(2 9 8, 3 7 -3, 6 4 2, 0 5 8) -> 4 cols, 3 rows. Cols: [2,9,8], [3,7,-3], [6,4,2], [0,5,8]
    X: '[[[4,0,5],[2,1,8]], [[2,9,8],[3,7,-3],[6,4,2],[0,5,8]]]',
    horizontal: true
  }
};
