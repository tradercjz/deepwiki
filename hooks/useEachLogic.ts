
import { useMemo } from 'react';
import { EACH_DATA_X, EACH_DATA_Y } from '../constants';

export interface EachStep {
    index: number;
    mode: 'left' | 'right';
    activeIndices: { x: number, y: number }[]; // Indices affected in this step
    results: { row: number, col: number, val: number }[]; // Matrix cells filled this step
    debugStr: string;
}

export const useEachLogic = (mode: 'left' | 'right') => {
    return useMemo(() => {
        const X = EACH_DATA_X;
        const Y = EACH_DATA_Y;
        const steps: EachStep[] = [];

        // Operation: X + Y (Simple Add)
        // eachLeft: For each X, iterate all Y
        // eachRight: For each Y, iterate all X

        if (mode === 'left') {
            // Iterate X (Columns)
            for (let i = 0; i < X.length; i++) {
                const xVal = X[i];
                const activeIndices: { x: number, y: number }[] = [];
                const results: { row: number, col: number, val: number }[] = [];

                for (let j = 0; j < Y.length; j++) {
                    const yVal = Y[j];
                    activeIndices.push({ x: i, y: j });
                    results.push({ row: j, col: i, val: xVal + yVal });
                }

                steps.push({
                    index: i,
                    mode,
                    activeIndices,
                    results,
                    debugStr: `X[${i}] (${xVal}) + Y[:]`
                });
            }
        } else {
            // Iterate Y (Rows)
            for (let j = 0; j < Y.length; j++) {
                const yVal = Y[j];
                const activeIndices: { x: number, y: number }[] = [];
                const results: { row: number, col: number, val: number }[] = [];

                for (let i = 0; i < X.length; i++) {
                    const xVal = X[i];
                    activeIndices.push({ x: i, y: j });
                    results.push({ row: j, col: i, val: xVal + yVal });
                }

                steps.push({
                    index: j,
                    mode,
                    activeIndices,
                    results,
                    debugStr: `X[:] + Y[${j}] (${yVal})`
                });
            }
        }

        return steps;
    }, [mode]);
};
