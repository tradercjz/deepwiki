
import { useMemo } from 'react';
import { TS_ENGINE_DATA } from '../constants';

export interface WindowState {
  id: string; // "A-1000"
  sym: string;
  start: number;
  end: number;
  currentSum: number;
  count: number;
  isFinalized: boolean; // Has the stream passed this window?
  lastUpdateIdx: number | null; // Index of data that last updated this
}

export interface TSEngineStep {
  index: number;
  data: { time: number; sym: string; value: number };
  activeWindows: WindowState[];
  finalizedWindows: WindowState[]; // Newly finalized in this step
  outputHistory: { time: number; sym: string; sum: number }[]; // Cumulative output for display
  debugStr: string;
}

export const useTimeSeriesEngineLogic = (windowSize: number, step: number) => {
  return useMemo(() => {
    const rawData = TS_ENGINE_DATA;
    const computedSteps: TSEngineStep[] = [];

    // Global State of all windows ever created
    // Map<WindowID, WindowState>
    const allWindows = new Map<string, WindowState>();
    
    // Track all outputs generated so far
    const globalOutputHistory: { time: number; sym: string; sum: number }[] = [];

    // Helper to get or create window
    const getWindow = (sym: string, start: number) => {
      const id = `${sym}-${start}`;
      if (!allWindows.has(id)) {
        allWindows.set(id, {
          id,
          sym,
          start,
          end: start + windowSize,
          currentSum: 0,
          count: 0,
          isFinalized: false,
          lastUpdateIdx: null
        });
      }
      return allWindows.get(id)!;
    };

    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];
      
      // 1. Identify which windows this point falls into
      // S <= item.time < S + windowSize
      
      const minStart = Math.ceil((item.time - windowSize) / step) * step;
      const maxStart = Math.floor(item.time / step) * step; // start <= time

      const affectedWindows: WindowState[] = [];

      // Loop through potential window starts
      for (let s = minStart; s <= maxStart; s += step) {
         if (s <= item.time && item.time < s + windowSize) {
             const win = getWindow(item.sym, s);
             
             win.currentSum += item.value;
             win.count += 1;
             win.lastUpdateIdx = i;
             affectedWindows.push({ ...win });
             allWindows.set(win.id, win); 
         }
      }

      // 2. Check for finalization
      const finalizedThisStep: WindowState[] = [];
      const currentActiveSnapshot: WindowState[] = [];

      allWindows.forEach((win) => {
          // Check closure
          // Window closes if current data time >= win.end
          if (!win.isFinalized && item.time >= win.end) {
              win.isFinalized = true;
              finalizedThisStep.push({ ...win });
              // Add to global output history
              globalOutputHistory.push({
                  time: win.end, // Use Window End time for output
                  sym: win.sym,
                  sum: win.currentSum
              });
          }
          currentActiveSnapshot.push({ ...win });
      });

      computedSteps.push({
          index: i,
          data: item,
          activeWindows: currentActiveSnapshot.sort((a,b) => (a.start - b.start) || a.sym.localeCompare(b.sym)),
          finalizedWindows: finalizedThisStep,
          outputHistory: [...globalOutputHistory], // Clone array
          debugStr: `Time ${item.time}: Added ${item.value} to ${affectedWindows.length} windows`
      });
    }

    return computedSteps;
  }, [windowSize, step]);
};
