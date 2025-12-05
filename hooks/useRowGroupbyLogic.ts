import { useMemo } from 'react';
import { ROWGROUPBY_M, ROWGROUPBY_G, GroupFunc } from '../constants';

export interface RowGroupbyStep {
  rowIndex: number;
  inputM: number[];
  inputG: number[];
  sortedPairs: { m: number; g: number }[];
  groups: { key: number; values: number[]; result: number }[];
  finalResult: { keys: number[]; values: number[] };
}

export const useRowGroupbyLogic = (func: GroupFunc, ascending: boolean = true) => {
  const steps = useMemo(() => {
    const resultSteps: RowGroupbyStep[] = [];
    const M = ROWGROUPBY_M;
    const G = ROWGROUPBY_G;

    for (let i = 0; i < M.length; i++) {
      const rowM = M[i];
      const rowG = G[i];

      // 1. Pair and Sort
      const pairs = rowM.map((m, idx) => ({ m, g: rowG[idx] }));
      
      pairs.sort((a, b) => {
        if (ascending) return a.g - b.g;
        return b.g - a.g;
      });

      // 2. Group
      const groups: { key: number; values: number[]; result: number }[] = [];
      let currentGroup: { key: number; values: number[] } | null = null;

      for (const pair of pairs) {
        if (!currentGroup || currentGroup.key !== pair.g) {
          if (currentGroup) {
             // Calculate result for previous group
             groups.push({
                 ...currentGroup,
                 result: calculate(func, currentGroup.values)
             });
          }
          currentGroup = { key: pair.g, values: [pair.m] };
        } else {
          currentGroup.values.push(pair.m);
        }
      }
      if (currentGroup) {
         groups.push({
             ...currentGroup,
             result: calculate(func, currentGroup.values)
         });
      }

      // 3. Final Result
      const finalKeys = groups.map(g => g.key);
      const finalValues = groups.map(g => g.result);

      resultSteps.push({
        rowIndex: i,
        inputM: rowM,
        inputG: rowG,
        sortedPairs: pairs,
        groups,
        finalResult: { keys: finalKeys, values: finalValues }
      });
    }

    return resultSteps;
  }, [func, ascending]);

  return steps;
};

const calculate = (func: GroupFunc, values: number[]): number => {
    if (values.length === 0) return 0;
    switch (func) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'avg':
            return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
        case 'max':
            return Math.max(...values);
        case 'count':
            return values.length;
        default:
            return 0;
    }
};
