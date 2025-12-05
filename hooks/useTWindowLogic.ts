import { useMemo } from 'react';
import { TWINDOW_T, TWINDOW_X, WindowFunc } from '../constants';

export interface TWindowStep {
  index: number;
  tValue: number;
  inputValue: number | null;
  windowIndices: number[];
  windowRange: [number, number]; // [Start, End] values
  result: number | null;
  calcStr: string;
}

export const useTWindowLogic = (func: WindowFunc, range: [number, number], prevailing: boolean = false) => {
  const steps = useMemo(() => {
    const t = TWINDOW_T;
    const x = TWINDOW_X;
    const resultSteps: TWindowStep[] = [];

    for (let i = 0; i < t.length; i++) {
      const ti = t[i];
      const start = ti + range[0];
      const end = ti + range[1];
      
      let windowIndices: number[] = [];

      // Find indices j where t[j] is in [start, end]
      // Note: T is non-strictly increasing.
      for (let j = 0; j < t.length; j++) {
        const tj = t[j];
        if (tj >= start && tj <= end) {
          windowIndices.push(j);
        }
      }

      // Handle prevailing=true logic for Left Boundary
      if (prevailing) {
        // "When its window left boundary matches multiple identical values... if prevailing=true, the window only contains the last value"
        // This implies we filter out duplicates of 'start' except the last one?
        // But 'start' might not be in T.
        // The example: T=1,1... Range=0:2. Ti=1. Start=1.
        // Indices with 1 are 0, 1.
        // If prevailing=true, we only keep 1?
        
        // Let's implement based on the example observation:
        // If multiple indices have value == start, only keep the largest index among them.
        
        const startValIndices = windowIndices.filter(idx => t[idx] === start);
        if (startValIndices.length > 1) {
            const maxIdx = Math.max(...startValIndices);
            // Remove all other indices that have value == start
            windowIndices = windowIndices.filter(idx => t[idx] !== start || idx === maxIdx);
        }
      }

      // Calculate result
      const windowValues = windowIndices.map(idx => x[idx]).filter(v => v !== null) as number[];
      let res: number | null = null;

      if (windowValues.length > 0) {
        switch (func) {
          case 'min':
            res = Math.min(...windowValues);
            break;
          case 'max':
            res = Math.max(...windowValues);
            break;
          case 'avg':
            res = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
            res = parseFloat(res.toFixed(2));
            break;
          case 'sum':
            res = windowValues.reduce((a, b) => a + b, 0);
            break;
        }
      }

      const valuesStr = windowIndices.map(idx => x[idx] === null ? 'NULL' : x[idx]).join(', ');
      const calcStr = `${func}([${valuesStr}]) = ${res === null ? 'NULL' : res}`;

      resultSteps.push({
        index: i,
        tValue: ti,
        inputValue: x[i],
        windowIndices,
        windowRange: [start, end],
        result: res,
        calcStr
      });
    }

    return resultSteps;
  }, [func, range, prevailing]);

  return steps;
};
