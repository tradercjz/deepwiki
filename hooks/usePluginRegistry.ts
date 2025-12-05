import { useState, useEffect } from 'react';
import { registry } from '../lib/PluginRegistry';
import { Plugin } from '../types/plugin';

export function usePluginRegistry() {
  const [plugins, setPlugins] = useState<Plugin[]>(registry.getAll());

  useEffect(() => {
    const unsubscribe = registry.subscribe(() => {
      setPlugins(registry.getAll());
    });
    return unsubscribe;
  }, []);

  return plugins;
}
