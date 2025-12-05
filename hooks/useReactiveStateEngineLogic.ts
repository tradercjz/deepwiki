
import { useMemo } from 'react';
import { RSE_DATA } from '../constants';

export interface RSEGroupState {
  sym: string;
  buffer: number[]; // Sliding window buffer
  currentSum: number;
}

export interface RSEStep {
  index: number;
  data: { time: string; sym: string; price: number };
  groupState: RSEGroupState; // State AFTER update
  prevBuffer: number[]; // State BEFORE update (for visualization)
  removedValue: number | null; // Value evicted from window
  result: number | null;
  outputHistory: { time: string; sym: string; val: number | null }[];
  debugStr: string;
}

export const useReactiveStateEngineLogic = (windowSize: number) => {
  return useMemo(() => {
    const rawData = RSE_DATA;
    const steps: RSEStep[] = [];
    
    // Engine State: Map<Sym, State>
    const engineState = new Map<string, RSEGroupState>();
    const outputHistory: { time: string; sym: string; val: number | null }[] = [];

    const getGroup = (sym: string) => {
        if (!engineState.has(sym)) {
            engineState.set(sym, { sym, buffer: [], currentSum: 0 });
        }
        return engineState.get(sym)!;
    };

    for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        const group = getGroup(item.sym);
        
        // Clone previous buffer for visualization
        const prevBuffer = [...group.buffer];
        let removedValue: number | null = null;
        let debugStr = "";
        let result: number | null = null;

        // Incremental Calculation Logic (mavg)
        // 1. Add new value
        group.buffer.push(item.price);
        group.currentSum += item.price;

        // 2. Check Window Status
        if (group.buffer.length > windowSize) {
            // Full Window Sliding
            removedValue = group.buffer.shift()!;
            group.currentSum -= removedValue;
            
            // Calc Result
            result = group.currentSum / windowSize;
            
            debugStr = `Slide: (${group.currentSum.toFixed(1)} + ${item.price} - ${removedValue}) / ${windowSize} = ${result.toFixed(3)}`;
            
            // Correction because currentSum was already updated above
            // Logic recap: 
            // Sum was (OldSum + New). 
            // Then Remove Old. Sum is (OldSum + New - Old).
            // Result is Sum / Window.
            debugStr = `Window Full [${windowSize}].\nAvg = Sum(${group.buffer.join('+')}) / ${windowSize}`;
            
        } else if (group.buffer.length === windowSize) {
            // Just reached Full
            result = group.currentSum / windowSize;
            debugStr = `Window Filled [${windowSize}].\nAvg = Sum(${group.buffer.join('+')}) / ${windowSize}`;
        } else {
            // Not enough data
            result = null;
            debugStr = `Buffering [${group.buffer.length}/${windowSize}]: [${group.buffer.join(', ')}]\nResult is NULL until window fills.`;
        }

        const formattedResult = result !== null ? Number(result.toFixed(3)) : null;

        // Add to history
        outputHistory.push({
            time: item.time,
            sym: item.sym,
            val: formattedResult
        });

        steps.push({
            index: i,
            data: item,
            groupState: { ...group, buffer: [...group.buffer] }, // Snapshot
            prevBuffer,
            removedValue,
            result: formattedResult,
            outputHistory: [...outputHistory],
            debugStr
        });
    }

    return steps;
  }, [windowSize]);
};
