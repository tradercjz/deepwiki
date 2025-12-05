import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { EachStage } from '../../components/EachStage';
import { useEachLogic } from '../../hooks/useEachLogic';

const EachLeftScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useEachLogic('left');

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <EachStage
      progress={progress}
      logic={logic}
      mode="left"
    />
  );
};

export const EachLeftPlugin: Plugin = {
  id: 'eachLeft',
  name: 'Each Left',
  description: 'Visualize eachLeft function',
  SceneComponent: EachLeftScene,
  defaultParams: {}
};
