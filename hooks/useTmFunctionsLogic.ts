import { useMemo } from 'react';
import { TM_TIMES, TM_INPUTS } from '../constants';

export type TmFuncType = 'tmsum' | 'tmavg' | 'tmmax' | 'tmmin' | 'tmcount' | 'tmprod' | 'tmvar' | 'tmstd';

export interface TmFunctionStep {
  index: number;
  time: number;
  val: number;
  windowIndices: number[]; // Indices of elements in the window
  windowRange: [number, number]; // (Start Time, End Time]
  result: number;
  formula: string;
}

export const useTmFunctionsLogic = (func: TmFuncType, window: number) => {
  const logic = useMemo(() => {
    const steps: TmFunctionStep[] = [];
    const T = TM_TIMES;
    const X = TM_INPUTS;

    for (let i = 0; i < T.length; i++) {
      const currentTime = T[i];
      const startTime = currentTime - window; // Exclusive
      
      // Find indices j such that startTime < T[j] <= currentTime
      // Since T is sorted, we can just iterate or search.
      // Also, for standard tm functions, it usually includes the current row and previous rows within window.
      // But wait, if multiple rows have same time, do they include each other?
      // DolphinDB docs: "For each element Ti in T ... window range is (Ti - window, Ti]"
      // So yes, all records with T[j] in that range are included.
      
      const windowIndices: number[] = [];
      const windowValues: number[] = [];

      for (let j = 0; j <= i; j++) { // Only look at past and current? 
        // Actually tm functions are usually causal (history), so j <= i is implied if T is sorted?
        // But if T has duplicates, say T=[1, 1], i=0 (first 1).
        // Range (1-w, 1]. Both 1s are in range.
        // Does tmsum at i=0 include i=1? No, usually it's a moving window on the sequence, but defined by time.
        // In DolphinDB, `tmsum(T, X, window)` returns a vector of same length.
        // For row i, it considers rows j where T[j] is in range.
        // Usually it implies j <= i (causal) OR it considers all j?
        // Standard moving window functions in DolphinDB are causal (only use current and previous data).
        // Let's assume causal: j <= i.
        
        if (T[j] > startTime && T[j] <= currentTime) {
            windowIndices.push(j);
            windowValues.push(X[j]);
        }
      }

      let result = 0;
      let formula = '';

      switch (func) {
        case 'tmsum':
          result = windowValues.reduce((a, b) => a + b, 0);
          formula = `sum(${windowValues.join(', ')})`;
          break;
        case 'tmavg':
          result = windowValues.length ? windowValues.reduce((a, b) => a + b, 0) / windowValues.length : 0;
          formula = `avg(${windowValues.join(', ')})`;
          break;
        case 'tmmax':
          result = windowValues.length ? Math.max(...windowValues) : 0; // Should be null if empty but 0 for simplicity
          formula = `max(${windowValues.join(', ')})`;
          break;
        case 'tmmin':
          result = windowValues.length ? Math.min(...windowValues) : 0;
          formula = `min(${windowValues.join(', ')})`;
          break;
        case 'tmcount':
          result = windowValues.length;
          formula = `count(${windowValues.join(', ')})`;
          break;
        case 'tmprod':
          result = windowValues.reduce((a, b) => a * b, 1);
          formula = `prod(${windowValues.join(', ')})`;
          break;
        case 'tmvar':
            if (windowValues.length > 1) {
                const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
                const sqDiff = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
                result = sqDiff / (windowValues.length - 1);
            } else {
                result = 0; // Or null
            }
            formula = `var(...)`;
            break;
        case 'tmstd':
            if (windowValues.length > 1) {
                const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
                const sqDiff = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
                result = Math.sqrt(sqDiff / (windowValues.length - 1));
            } else {
                result = 0;
            }
            formula = `std(...)`;
            break;
      }

      steps.push({
        index: i,
        time: currentTime,
        val: X[i],
        windowIndices,
        windowRange: [startTime, currentTime],
        result,
        formula
      });
    }

    return steps;
  }, [func, window]);

  return logic;
};
