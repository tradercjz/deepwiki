
import { useMemo } from 'react';
import { DATA_INPUTS, DATA_VAL1, DATA_TIME, FuncType } from '../constants';

export interface ConditionalIterateResult {
  index: number;
  val0: number;
  val1: number;
  time: number;
  result: number | null;
  isConditionMet: boolean;
  source: 'reset' | 'iter';
  debugStr: string;
  funcUsed: FuncType;
}

export const useConditionalIterateLogic = (
  threshold: number, 
  funcType: FuncType, 
  funcWindow: number
) => {
  return useMemo(() => {
    const computed: ConditionalIterateResult[] = [];
    // Y stores the history of factor[]. Types: number | null.
    const Y: (number | null)[] = [];

    for (let k = 0; k < DATA_INPUTS.length; k++) {
      const val0 = DATA_INPUTS[k];
      const val1 = DATA_VAL1[k]; 
      const time = DATA_TIME[k];
      
      let resultY: number | null = null;
      let debugStr = "";
      let source: 'reset' | 'iter' = 'iter';
      
      const isConditionMet = val0 > threshold;

      if (isConditionMet) {
          // Rule 1: If val0 > threshold, factor[k] = val1
          resultY = val1;
          source = 'reset';
          debugStr = `Condition (${val0} > ${threshold}) TRUE: Result = val1 (${val1})`;
      } else {
          source = 'iter';
          // Rule 2: factor[k] = falseIterFunc(factor)[k-1]
          if (k === 0) {
              resultY = null;
              debugStr = `History empty -> NULL`;
          } else {
              const currentIdx = k - 1; 

              if (funcType === 'move') {
                  const shift = funcWindow; 
                  const targetIdx = currentIdx - shift;
                  
                  if (targetIdx >= 0 && targetIdx < Y.length) {
                      resultY = Y[targetIdx];
                  } else {
                      resultY = null; // Out of bounds
                  }
                  debugStr = `move(Y, ${shift}) at idx ${currentIdx} -> Y[${targetIdx}]`;
              } else if (funcType === 'tmsum') {
                  // Time-based Moving Sum logic
                  // Window is based on TIME, not index.
                  // Reference Time T[currentIdx]. Range: (T - window, T]
                  const refTime = DATA_TIME[currentIdx];
                  const minTime = refTime - funcWindow;
                  
                  const windowValues: number[] = [];
                  
                  // Iterate through history to find items in time range
                  // Logic: Look at all PREVIOUS items up to currentIdx
                  for (let i = 0; i <= currentIdx; i++) {
                      const t = DATA_TIME[i];
                      // Window: (minTime, refTime]
                      if (t > minTime && t <= refTime) {
                          const v = Y[i];
                          if (v !== null) windowValues.push(v);
                      }
                  }
                  
                  if (windowValues.length === 0) {
                      resultY = null; // Or 0? Usually NULL if nothing to sum in window depending on strictness, assuming NULL for visual consistency
                      // NOTE: DolphinDB tmsum usually returns 0 if window is empty?
                      // But conditionalIterate keeps context. Let's return 0 if values exist but are 0, or NULL if no records.
                      // For this visualizer, let's treat empty window as NULL to show gaps.
                      resultY = 0; 
                  } else {
                      resultY = windowValues.reduce((a, b) => a + b, 0);
                  }
                  debugStr = `tmsum(T, Y, ${funcWindow}) at T=${refTime} (Range: ${minTime} < t <= ${refTime})`;

              } else {
                  // Standard Index-based Window functions
                  const startIdx = currentIdx - funcWindow + 1;
                  const endIdx = currentIdx;

                  const windowValues: number[] = [];
                  for (let i = startIdx; i <= endIdx; i++) {
                      if (i >= 0 && i < Y.length) {
                          const v = Y[i];
                          if (v !== null) windowValues.push(v);
                      }
                  }
                  
                  if (windowValues.length === 0) {
                      resultY = null;
                      debugStr = `Window Empty -> NULL`;
                  } else {
                      if (funcType === 'msum') {
                          resultY = windowValues.reduce((a, b) => a + b, 0);
                      } else if (funcType === 'mavg') {
                          resultY = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
                      } else if (funcType === 'mmax') {
                          resultY = Math.max(...windowValues);
                      } else if (funcType === 'mmin') {
                          resultY = Math.min(...windowValues);
                      } else if (funcType === 'mcount') {
                          resultY = windowValues.length;
                      }
                      debugStr = `${funcType}(Y, ${funcWindow}) at idx ${currentIdx}`;
                  }
              }
          }
      }

      // Formatting
      if (resultY !== null) {
          resultY = Math.round(resultY * 100) / 100;
      }
      
      Y.push(resultY);

      computed.push({
        index: k,
        val0,
        val1,
        time,
        result: resultY,
        isConditionMet,
        source, 
        debugStr,
        funcUsed: funcType
      });
    }
    return computed;
  }, [threshold, funcType, funcWindow]);
};
