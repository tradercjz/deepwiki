import { useMemo } from 'react';
import { TMOVING_T, TMOVING_X, WindowFunc } from '../constants';

export interface TMovingStep {
  tIndex: number;
  tValue: number;
  inputValue: number;
  windowIndices: number[];
  windowRange: [number, number]; // [start, end] (exclusive start, inclusive end)
  result: number | null;
  calcStr: string;
}

export const useTMovingLogic = (
  func: WindowFunc,
  windowSize: number
): TMovingStep[] => {
  const steps = useMemo(() => {
    const resultSteps: TMovingStep[] = [];
    const T = TMOVING_T;
    const X = TMOVING_X;

    for (let i = 0; i < T.length; i++) {
      const Ti = T[i];
      const windowStart = Ti - windowSize;
      const windowEnd = Ti;

      // Find indices j where windowStart < T[j] <= windowEnd
      const windowIndices: number[] = [];
      const windowValues: number[] = [];

      // tmoving is a rolling function, so it only considers rows up to the current row i.
      for (let j = 0; j <= i; j++) {
        if (T[j] > windowStart && T[j] <= windowEnd) {
          windowIndices.push(j);
          windowValues.push(X[j]);
        }
      }

      let val: number | null = null;
      let calcStr = '';

      if (windowValues.length > 0) {
        switch (func) {
          case 'min':
            val = Math.min(...windowValues);
            calcStr = `min([${windowValues.join(', ')}]) = ${val}`;
            break;
          case 'max':
            val = Math.max(...windowValues);
            calcStr = `max([${windowValues.join(', ')}]) = ${val}`;
            break;
          case 'sum':
            val = windowValues.reduce((a, b) => a + b, 0);
            calcStr = `sum([${windowValues.join(', ')}]) = ${val}`;
            break;
          case 'avg':
            const sum = windowValues.reduce((a, b) => a + b, 0);
            val = parseFloat((sum / windowValues.length).toFixed(2));
            calcStr = `avg([${windowValues.join(', ')}]) = ${val}`;
            break;
        }
      } else {
        val = null;
        calcStr = 'Empty Window -> NULL';
      }

      resultSteps.push({
        tIndex: i,
        tValue: Ti,
        inputValue: X[i],
        windowIndices,
        windowRange: [windowStart, windowEnd],
        result: val,
        calcStr
      });
    }

    return resultSteps;
  }, [func, windowSize]);

  return steps;
};
