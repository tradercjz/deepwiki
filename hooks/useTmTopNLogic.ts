import { useMemo } from 'react';
import { TM_TIMES, TM_INPUTS } from '../constants';

// We need a separate S input for sorting. 
// Let's generate a deterministic S based on indices or just hardcode some interesting values.
// Or we can reuse TM_INPUTS as X and create a new S.
export const TM_S_INPUTS = [5, 8, 1, 9, 7, 2, 6, 3, 4, 5, 8, 1, 9, 7, 2]; // Example S values

export type TmTopNFuncType = 'tmsumTopN' | 'tmavgTopN' | 'tmmaxTopN' | 'tmminTopN' | 'tmcountTopN' | 'tmvarTopN' | 'tmstdTopN';
export type TiesMethod = 'oldest' | 'latest' | 'all';

export interface TmTopNStep {
  time: number;
  val: number;
  sortKey: number;
  windowRange: [number, number];
  windowIndices: number[]; // All indices in time window
  selectedIndices: number[]; // Indices selected after TopN logic
  result: number;
  formula: string;
}

export const useTmTopNLogic = (
  func: TmTopNFuncType,
  window: number,
  top: number,
  ascending: boolean = true,
  tiesMethod: TiesMethod = 'latest'
) => {
  const steps = useMemo(() => {
    const result: TmTopNStep[] = [];
    const times = TM_TIMES;
    const values = TM_INPUTS;
    const sortKeys = TM_S_INPUTS.slice(0, times.length); // Ensure length match

    for (let i = 0; i < times.length; i++) {
      const currentTime = times[i];
      const windowStart = currentTime - window;
      
      // 1. Find indices in window (windowStart, currentTime]
      const windowIndices: number[] = [];
      for (let j = 0; j <= i; j++) {
        if (times[j] > windowStart && times[j] <= currentTime) {
          windowIndices.push(j);
        }
      }

      // 2. Sort indices based on S (sortKeys)
      // We need to handle stable sort for ties logic if needed, but JS sort is stable in modern browsers.
      // However, for 'oldest'/'latest' ties, we might need to be careful.
      // Let's sort primarily by S, and secondarily by index (time) based on tiesMethod?
      // Actually, the doc says: "sort X based on S... if ties, use tiesMethod".
      
      // Let's create objects to sort
      let candidates = windowIndices.map(idx => ({
        idx,
        s: sortKeys[idx],
        time: times[idx] // strictly increasing index implies strictly increasing time usually, or at least non-decreasing
      }));

      candidates.sort((a, b) => {
        if (a.s !== b.s) {
          return ascending ? a.s - b.s : b.s - a.s;
        }
        // Tie breaking
        // If tiesMethod is 'oldest', we prefer smaller index (earlier time)
        // If tiesMethod is 'latest', we prefer larger index (later time)
        // If 'all', we keep them together (handled later)
        if (tiesMethod === 'oldest') {
          return a.idx - b.idx;
        } else if (tiesMethod === 'latest') {
          return b.idx - a.idx;
        }
        return 0; // Keep original order (stable)
      });

      // 3. Select Top N
      let selectedIndices: number[] = [];
      
      if (tiesMethod === 'all') {
        // If 'all', we need to check the boundary.
        // If the Nth element has same S as (N+1)th, include all with that S value?
        // The doc says: "select all elements" (that tie for the last spot?)
        // "If multiple elements have same value and cannot all enter top... select all".
        // This implies if we have [1, 1, 1, 1] and top=3. We take all 4.
        
        if (candidates.length <= top) {
          selectedIndices = candidates.map(c => c.idx);
        } else {
          // Take first top-1
          const cutoffS = candidates[top - 1].s;
          // Take all that are "better or equal" to cutoff?
          // Wait, if ascending=true (small is good).
          // If [1, 2, 3, 3, 4], top=3. 1,2,3. 3 is cutoff. Another 3 exists.
          // So we take all <= 3? No, only those that tie with the boundary?
          // "If there are multiple elements with the same value that cannot all enter the top... select all".
          // This usually means we include the ties at the boundary.
          
          // Let's just take top, and check if top+1 has same S.
          let count = top;
          while (count < candidates.length && candidates[count].s === cutoffS) {
            count++;
          }
          selectedIndices = candidates.slice(0, count).map(c => c.idx);
        }
      } else {
        // 'oldest' or 'latest' already handled by sort order
        selectedIndices = candidates.slice(0, Math.min(top, candidates.length)).map(c => c.idx);
      }

      // 4. Calculate result on X values of selected indices
      const selectedValues = selectedIndices.map(idx => values[idx]);
      let val = 0;
      let formula = '';

      if (selectedValues.length === 0) {
        val = NaN;
        formula = 'No data';
      } else {
        switch (func) {
          case 'tmsumTopN':
            val = selectedValues.reduce((a, b) => a + b, 0);
            formula = `sum([${selectedValues.join(', ')}])`;
            break;
          case 'tmavgTopN':
            val = selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length;
            formula = `avg([${selectedValues.join(', ')}])`;
            break;
          case 'tmmaxTopN':
            val = Math.max(...selectedValues);
            formula = `max([${selectedValues.join(', ')}])`;
            break;
          case 'tmminTopN':
            val = Math.min(...selectedValues);
            formula = `min([${selectedValues.join(', ')}])`;
            break;
          case 'tmcountTopN':
            val = selectedValues.length;
            formula = `count([${selectedValues.join(', ')}])`;
            break;
          case 'tmvarTopN': {
            const avg = selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length;
            const sumSqDiff = selectedValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0);
            val = selectedValues.length > 1 ? sumSqDiff / (selectedValues.length - 1) : 0;
            formula = `var([${selectedValues.join(', ')}])`;
            break;
          }
          case 'tmstdTopN': {
            const avg = selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length;
            const sumSqDiff = selectedValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0);
            const variance = selectedValues.length > 1 ? sumSqDiff / (selectedValues.length - 1) : 0;
            val = Math.sqrt(variance);
            formula = `std([${selectedValues.join(', ')}])`;
            break;
          }
        }
      }

      result.push({
        time: currentTime,
        val: values[i],
        sortKey: sortKeys[i],
        windowRange: [windowStart, currentTime],
        windowIndices,
        selectedIndices,
        result: val,
        formula
      });
    }
    return result;
  }, [func, window, top, ascending, tiesMethod]);

  return steps;
};
