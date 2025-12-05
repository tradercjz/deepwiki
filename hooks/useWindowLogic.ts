import { useMemo } from 'react';
import { WINDOW_DATA, WindowFunc } from '../constants';

export interface WindowStep {
    index: number;
    inputValue: number | null;
    windowIndices: number[];
    windowValues: (number | null)[];
    result: number | null;
    calcStr: string;
}

export const useWindowLogic = (func: WindowFunc, range: [number, number]) => {
    return useMemo(() => {
        const data = WINDOW_DATA;
        const [d1, d2] = range;
        const steps: WindowStep[] = [];

        for (let i = 0; i < data.length; i++) {
            const start = i + d1;
            const end = i + d2;
            
            const windowIndices: number[] = [];
            const windowValues: (number | null)[] = [];
            const validValues: number[] = [];

            // Collect window data
            // Window is inclusive [start, end]
            for (let j = start; j <= end; j++) {
                if (j >= 0 && j < data.length) {
                    windowIndices.push(j);
                    const val = data[j];
                    windowValues.push(val);
                    if (val !== null) {
                        validValues.push(val);
                    }
                }
            }

            // Calculate result
            let result: number | null = null;
            let calcStr = "";

            if (validValues.length === 0) {
                // If no valid values in window, result is null (usually)
                // DolphinDB behavior: if window has no elements, result is null?
                // Example: window(min, x, 1:3) last element has empty window?
                // Wait, example output has 5 elements for 6 inputs? No, example output: [-1, -1, -1, 2, 4, ]
                // The last comma suggests a 6th element which is empty/null.
                result = null;
                calcStr = "Empty Window";
            } else {
                if (func === 'min') {
                    result = Math.min(...validValues);
                    calcStr = `min(${windowValues.map(v => v === null ? 'NULL' : v).join(', ')}) = ${result}`;
                } else if (func === 'max') {
                    result = Math.max(...validValues);
                    calcStr = `max(${windowValues.map(v => v === null ? 'NULL' : v).join(', ')}) = ${result}`;
                } else if (func === 'sum') {
                    result = validValues.reduce((a, b) => a + b, 0);
                    calcStr = `sum(${windowValues.map(v => v === null ? 'NULL' : v).join(', ')}) = ${result}`;
                } else if (func === 'avg') {
                    const sum = validValues.reduce((a, b) => a + b, 0);
                    result = parseFloat((sum / validValues.length).toFixed(2));
                    calcStr = `avg(${windowValues.map(v => v === null ? 'NULL' : v).join(', ')}) = ${result}`;
                }
            }

            steps.push({
                index: i,
                inputValue: data[i],
                windowIndices,
                windowValues,
                result,
                calcStr
            });
        }

        return steps;
    }, [func, range]);
};
