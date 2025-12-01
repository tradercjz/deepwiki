import React from 'react';
import { DolphinDBVisualizer } from '../visualizer/DolphinDBVisualizer';
import { AppMode } from '../visualizer/constants';

interface VisualizerModalProps {
  isOpen: boolean;
  mode: AppMode | null;
  onClose: () => void;
}

export const VisualizerModal: React.FC<VisualizerModalProps> = ({ isOpen, mode, onClose }) => {
  if (!isOpen || !mode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-300">
      <div className="w-full h-full relative">
        <DolphinDBVisualizer initialMode={mode} onClose={onClose} />
      </div>
    </div>
  );
};