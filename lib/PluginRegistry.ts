import { Plugin } from '../types/plugin';

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private listeners: Set<() => void> = new Set();

  register(plugin: Plugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id ${plugin.id} already registered. Overwriting.`);
    }
    this.plugins.set(plugin.id, plugin);
    this.notify();
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export const registry = new PluginRegistry();
