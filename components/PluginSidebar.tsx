import React from 'react';
import { Plugin } from '../types/plugin';

interface PluginSidebarProps {
  plugins: Plugin[];
  activePluginId: string;
  onSelectPlugin: (id: string) => void;
}

export const PluginSidebar: React.FC<PluginSidebarProps> = ({ plugins, activePluginId, onSelectPlugin }) => {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 text-white p-4 overflow-y-auto z-10 border-r border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">DolphinDB Viz</h2>
      <div className="space-y-2">
        {plugins.map(plugin => (
          <button
            key={plugin.id}
            onClick={() => onSelectPlugin(plugin.id)}
            className={`w-full text-left p-2 rounded transition-colors ${
              activePluginId === plugin.id 
                ? 'bg-cyan-900 text-cyan-100 border border-cyan-500' 
                : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <div className="font-bold">{plugin.name}</div>
            <div className="text-xs opacity-70 truncate">{plugin.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
