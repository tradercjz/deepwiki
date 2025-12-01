
import { useMemo } from 'react';
import { TM_INPUTS, TM_TIMES } from '../constants';

export interface TmSeriesResult {
  index: number;
  val0: number; // The X input
  time: number; // The T input
  result: number | null;
  contributingIndices: number[]; // Indices of inputs that fall in the window
  debugStr: string;
  source: 'calc';
}

export const useTmSeriesLogic = (windowSize: number) => {
  return useMemo(() => {
    const computed: TmSeriesResult[] = [];

    // Use specific TM Example Data
    const inputs = TM_INPUTS;
    const times = TM_TIMES;

    for (let i = 0; i < inputs.length; i++) {
      const currentTime = times[i];
      const currentVal = inputs[i];
      
      // tmsum Logic:
      // Window is (T - window, T]
      // Find all j such that: (currentTime - window) < times[j] <= currentTime
      // AND j <= i (Respecting the order of rows, important for identical timestamps)
      
      const minTime = currentTime - windowSize;
      const contributingIndices: number[] = [];
      let sum = 0;
      let count = 0;

      // Scan up to current index i
      for (let j = 0; j <= i; j++) {
        const t = times[j];
        if (t > minTime && t <= currentTime) {
            contributingIndices.push(j);
            sum += inputs[j];
            count++;
        }
      }

      // If no data points (shouldn't happen as it includes itself usually), return null or 0
      const result = count > 0 ? sum : null;
      
      computed.push({
        index: i,
        val0: currentVal,
        time: currentTime,
        result: result,
        contributingIndices,
        debugStr: `tmsum window (${minTime}, ${currentTime}] includes indices [${contributingIndices.join(',')}]`,
        source: 'calc'
      });
    }

    return computed;
  }, [windowSize]);
};