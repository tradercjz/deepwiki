
import { useMemo } from 'react';
import { ROLLING_AAPL, ROLLING_SPY } from '../constants';

export interface RollingStep {
    windowIndex: number;
    startIndex: number;
    endIndex: number; // startIndex + window
    xSlice: number[];
    ySlice: number[];
    beta: number;
    cov: number;
    varY: number;
    debugStr: string;
}

export const useRollingLogic = (window: number, step: number) => {
    return useMemo(() => {
        const X = ROLLING_AAPL;
        const Y = ROLLING_SPY;
        const steps: RollingStep[] = [];

        // Logic: rolling(beta, [X, Y], window, step)
        // Starts when first window appears (index 0 to window-1? No, usually end based)
        // Rolling assumes 'step' frequency.
        
        // Iterate through data length
        let currentStart = 0;
        let winCount = 0;

        while (currentStart + window <= X.length) {
            const currentEnd = currentStart + window;
            const xSlice = X.slice(currentStart, currentEnd);
            const ySlice = Y.slice(currentStart, currentEnd);

            // Calculate Beta: Cov(x,y) / Var(y)
            const n = xSlice.length;
            const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
            const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

            let cov = 0;
            let varY = 0;

            for (let k = 0; k < n; k++) {
                cov += (xSlice[k] - meanX) * (ySlice[k] - meanY);
                varY += (ySlice[k] - meanY) ** 2;
            }
            
            // Sample cov/var usually divides by n-1, population by n. 
            // Since it's a ratio, n cancels out anyway.
            
            const beta = varY !== 0 ? cov / varY : 0;

            steps.push({
                windowIndex: winCount,
                startIndex: currentStart,
                endIndex: currentEnd - 1, // inclusive for visual
                xSlice,
                ySlice,
                beta: Number(beta.toFixed(6)),
                cov: cov,
                varY: varY,
                debugStr: `Win ${winCount}: Cov(${cov.toFixed(4)}) / Var(${varY.toFixed(4)})`
            });

            currentStart += step;
            winCount++;
        }

        return steps;
    }, [window, step]);
};
