import { useMemo } from 'react';
import { DATA_INPUTS } from '../constants';

export type MFuncType = 
    | 'msum' 
    | 'mavg' 
    | 'mmax' 
    | 'mmin' 
    | 'mcount' 
    | 'mprod' 
    | 'mvar' 
    | 'mstd';

export interface MFunctionStep {
    index: number;
    windowIndices: number[];
    windowValues: number[];
    result: number | null;
    formula: string;
    isNull: boolean;
}

const calculateM = (func: MFuncType, values: number[]): number => {
    if (values.length === 0) return 0;
    
    switch (func) {
        case 'msum':
            return values.reduce((a, b) => a + b, 0);
        case 'mavg':
            return values.reduce((a, b) => a + b, 0) / values.length;
        case 'mmax':
            return Math.max(...values);
        case 'mmin':
            return Math.min(...values);
        case 'mcount':
            return values.length;
        case 'mprod':
            return values.reduce((a, b) => a * b, 1);
        case 'mvar': {
            if (values.length < 2) return 0; // Population var? Sample var? DolphinDB mvar is usually sample variance? Documentation says mvar is sample variance (divide by n-1), mvarp is population.
            // Let's assume sample variance for mvar.
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const sumSqDiff = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
            return sumSqDiff / (values.length - 1);
        }
        case 'mstd': {
            if (values.length < 2) return 0;
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const sumSqDiff = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
            return Math.sqrt(sumSqDiff / (values.length - 1));
        }
        default:
            return 0;
    }
};

export const useMFunctionsLogic = (func: MFuncType, window: number, minPeriods?: number) => {
    return useMemo(() => {
        const X = DATA_INPUTS;
        const steps: MFunctionStep[] = [];
        const effectiveMinPeriods = minPeriods !== undefined ? minPeriods : window;

        for (let i = 0; i < X.length; i++) {
            // Window range: [start, end] inclusive
            // End is current index i
            // Start is i - window + 1
            let start = i - window + 1;
            if (start < 0) start = 0;
            
            const windowIndices: number[] = [];
            const windowValues: number[] = [];
            
            for (let j = start; j <= i; j++) {
                windowIndices.push(j);
                windowValues.push(X[j]);
            }

            // Check if we have enough periods
            // The window size is effectively the number of elements we *could* have looked at?
            // Or is it the number of elements actually in the window?
            // "前(window - 1)个元素为 NULL" implies we need 'window' elements to produce a result if minPeriods not set.
            // But wait, if i < window - 1, we have i+1 elements.
            // So if count < effectiveMinPeriods, result is NULL.
            
            // Actually, for standard m functions:
            // At index i (0-based), we have i+1 elements available from start.
            // If i+1 < effectiveMinPeriods, result is NULL.
            
            // Wait, standard behavior:
            // msum(X, 3) -> [NULL, NULL, val, val...]
            // i=0 (1 element) < 3 -> NULL
            // i=1 (2 elements) < 3 -> NULL
            // i=2 (3 elements) >= 3 -> Result
            
            // However, the window slice logic above:
            // i=0, start=0, len=1.
            // i=2, start=0, len=3.
            // i=3, start=1, len=3.
            
            const count = windowValues.length;
            // The actual number of elements in the sliding window is 'count'.
            // But we also need to consider if we've reached the *capacity* to start reporting.
            // If minPeriods is set, we report as soon as we have minPeriods elements.
            // If minPeriods is NOT set, we report when we have 'window' elements.
            
            // Wait, documentation says:
            // 1. If no minPeriods, first (window - 1) elements are NULL.
            // This means we need at least 'window' elements.
            // 2. If minPeriods specified, first (minPeriods - 1) elements are NULL.
            
            // But wait, does the window slice logic naturally handle this?
            // At i=0, we have 1 element. If window=3, we need 3. 1 < 3, so NULL.
            // At i=2, we have 3 elements. 3 >= 3, so Result.
            
            // What if window=3, minPeriods=1?
            // i=0, have 1 element. 1 >= 1 -> Result.
            
            // So the condition is: count >= effectiveMinPeriods?
            // Let's verify.
            // msum(X, 3) (minPeriods default 3).
            // i=0: count=1. 1 < 3 -> NULL. Correct.
            // i=2: count=3. 3 >= 3 -> Result. Correct.
            
            // msum(X, 3, 1).
            // i=0: count=1. 1 >= 1 -> Result. Correct.
            
            // One edge case: what if we are at the beginning and window is truncated?
            // The slice logic `start = max(0, i - window + 1)` handles truncation at start.
            // So `count` is the actual number of elements in the window.
            
            // However, there is a nuance.
            // "m 系列函数对数据内的每个元素进行一次窗口计算"
            // If I have 10 elements, and window is 3.
            // i=0: window is [0].
            // i=1: window is [0, 1].
            // i=2: window is [0, 1, 2].
            // i=3: window is [1, 2, 3].
            
            // So `count` accurately reflects the number of elements in the current window.
            // And `effectiveMinPeriods` determines if that count is sufficient.
            
            let result: number | null = null;
            let isNull = true;
            let formula = '';

            if (count >= effectiveMinPeriods) {
                result = calculateM(func, windowValues);
                isNull = false;
                result = Number(result.toFixed(4)); // Format for display
                
                // Generate formula string
                if (func === 'msum') formula = windowValues.join(' + ');
                else if (func === 'mavg') formula = `(${windowValues.join(' + ')}) / ${count}`;
                else if (func === 'mmax') formula = `max(${windowValues.join(', ')})`;
                else if (func === 'mmin') formula = `min(${windowValues.join(', ')})`;
                else if (func === 'mprod') formula = windowValues.join(' * ');
                else formula = `${func}(${windowValues.join(', ')})`;
            } else {
                formula = 'NULL (Not enough periods)';
            }

            steps.push({
                index: i,
                windowIndices,
                windowValues,
                result,
                formula,
                isNull
            });
        }

        return steps;
    }, [func, window, minPeriods]);
};
