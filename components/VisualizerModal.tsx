import React from 'react';
import { DolphinDBVisualizer } from '../visualizer/DolphinDBVisualizer';
import { AppMode } from '../visualizer/constants';

interface VisualizerModalProps {
  isOpen: boolean;
  pluginId?: string;
  initialParams?: any;
  onClose: () => void;
}

export const VisualizerModal: React.FC<VisualizerModalProps> = ({ isOpen, pluginId, initialParams, onClose }) => {
  if (!isOpen || !pluginId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-300">
      <div className="w-full h-full relative">
        <DolphinDBVisualizer 
            pluginId={pluginId} 
            initialParams={initialParams} 
            onClose={onClose} 
        />
      </div>
    </div>
  );
};