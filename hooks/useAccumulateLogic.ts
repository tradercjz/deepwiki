
import { useMemo } from 'react';
import { ACCUMULATE_DATA, AccFunc } from '../constants';

export interface AccumulateStep {
  index: number;
  input: number;
  prevValue: number | null; // Value carried from previous step (or init)
  newValue: number;         // Result of calc
  debugStr: string;
  history: number[];        // All outputs so far
}

export const useAccumulateLogic = (func: AccFunc) => {
  return useMemo(() => {
    const rawData = ACCUMULATE_DATA;
    const steps: AccumulateStep[] = [];
    const history: number[] = [];

    let accumulator = 0;
    
    // Init logic implies the first item is taken as is if no explicit init provided in simple form,
    // but accumulate(func, X) usually treats first element as init if func is binary and no init.
    // DolphinDB: accumulate(add, 1..3) -> [1, 3, 6]
    // 1st element: 1
    // 2nd element: 1 + 2 = 3
    // 3rd element: 3 + 3 = 6
    
    for (let i = 0; i < rawData.length; i++) {
        const input = rawData[i];
        let prevVal: number | null = null;
        let newVal = 0;
        let debugStr = "";

        if (i === 0) {
            // First element initializes the accumulator
            newVal = input;
            prevVal = null; // No previous state
            debugStr = `Init: ${input}`;
        } else {
            prevVal = accumulator;
            
            if (func === 'sum') {
                newVal = prevVal + input;
                debugStr = `${prevVal} + ${input} = ${newVal}`;
            } else if (func === 'prod') {
                newVal = prevVal * input;
                debugStr = `${prevVal} * ${input} = ${newVal}`;
            } else if (func === 'max') {
                newVal = Math.max(prevVal, input);
                debugStr = `max(${prevVal}, ${input}) = ${newVal}`;
            }
        }

        accumulator = newVal;
        history.push(newVal);

        steps.push({
            index: i,
            input,
            prevValue: prevVal,
            newValue: newVal,
            debugStr,
            history: [...history]
        });
    }

    return steps;
  }, [func]);
};
