import React, { useEffect } from 'react';
import { Plugin } from '../types/plugin';
import { EachStage } from '../../components/EachStage';
import { useEachLogic } from '../../hooks/useEachLogic';

const EachRightScene: React.FC<{ isPlaying: boolean; progress: number; params: any; onStepsReady?: (steps: number) => void }> = ({ isPlaying, progress, params, onStepsReady }) => {
  const logic = useEachLogic('right');

  useEffect(() => {
    if (onStepsReady) {
      onStepsReady(logic.length);
    }
  }, [logic, onStepsReady]);

  return (
    <EachStage
      progress={progress}
      logic={logic}
      mode="right"
    />
  );
};

export const EachRightPlugin: Plugin = {
  id: 'eachRight',
  name: 'Each Right',
  description: 'Visualize eachRight function',
  SceneComponent: EachRightScene,
  defaultParams: {}
};
