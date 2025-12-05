
import { useMemo } from 'react';
import { ASOF_X, ASOF_Y } from '../constants';

export interface AsofStep {
  index: number;
  yQuery: number;
  targetIndex: number; // The result index
  matchedValue: number | null;
  outputHistory: { y: number; index: number; val: number | string }[];
  debugStr: string;
}

export const useAsofLogic = () => {
  return useMemo(() => {
    const X = ASOF_X;
    const Y = ASOF_Y;
    const steps: AsofStep[] = [];
    const outputHistory: { y: number; index: number; val: number | string }[] = [];

    // asof(X, Y) -> For each y in Y, find largest index i where X[i] <= y
    // Logic: X is sorted.
    
    Y.forEach((y, i) => {
        let bestIdx = -1;
        
        // Linear scan logic for visualization (matches "find last <= y")
        for (let k = 0; k < X.length; k++) {
            if (X[k] <= y) {
                bestIdx = k;
            } else {
                // Since X is sorted, once X[k] > y, we can stop
                break; 
            }
        }

        const matchedVal = bestIdx !== -1 ? X[bestIdx] : null;
        
        // Add to history AFTER processing
        outputHistory.push({
            y: y,
            index: bestIdx,
            val: matchedVal !== null ? matchedVal : 'None'
        });
        
        steps.push({
            index: i,
            yQuery: y,
            targetIndex: bestIdx,
            matchedValue: matchedVal,
            outputHistory: [...outputHistory], // Pass full history up to this point
            debugStr: `asof(X, ${y}) -> Index ${bestIdx}`
        });
    });

    return steps;
  }, []);
};
