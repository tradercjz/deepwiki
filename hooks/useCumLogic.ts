import { useMemo } from 'react';
import { CUM_X, CUM_Y, CumFunc } from '../constants';

export interface CumStep {
  index: number;
  windowIndices: number[]; // [0, ..., index]
  inputX: number[];
  inputY: number[]; // Only for binary
  currentValX: number;
  currentValY: number;
  calculation: string; // e.g. "sum(1, 3, 2) = 6"
  result: number;
  resultVector: number[]; // Result up to this point
}

// Helper functions
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
const prod = (arr: number[]) => arr.reduce((a, b) => a * b, 1);
const max = (arr: number[]) => Math.max(...arr);
const min = (arr: number[]) => Math.min(...arr);

const median = (arr: number[]) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

const rank = (arr: number[], val: number) => {
    // Rank of val in arr. 0-based rank.
    // Default tiesMethod='min', so we take the first occurrence index.
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted.indexOf(val); 
};

const count = (arr: number[]) => arr.filter(x => x !== null && x !== undefined).length;

const percentile = (arr: number[], p: number) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const variance = (arr: number[], population: boolean) => {
    if (arr.length < 2 && !population) return 0;
    if (arr.length === 0) return 0;
    const m = avg(arr);
    const sqDiff = arr.map(x => Math.pow(x - m, 2));
    const s = sum(sqDiff);
    return s / (population ? arr.length : arr.length - 1);
};

const std = (arr: number[], population: boolean) => Math.sqrt(variance(arr, population));

const covar = (x: number[], y: number[], population: boolean) => {
    if (x.length !== y.length || x.length === 0) return 0;
    if (x.length < 2 && !population) return 0;
    const mx = avg(x);
    const my = avg(y);
    const prodDiff = x.map((xi, i) => (xi - mx) * (y[i] - my));
    const s = sum(prodDiff);
    return s / (population ? x.length : x.length - 1);
};

const corr = (x: number[], y: number[]) => {
    const cv = covar(x, y, false);
    const sx = std(x, false);
    const sy = std(y, false);
    if (sx === 0 || sy === 0) return 0;
    return cv / (sx * sy);
};

const beta = (y: number[], x: number[]) => {
    const cv = covar(x, y, true);
    const vx = variance(x, true);
    if (vx === 0) return 0;
    return cv / vx;
};

export const useCumLogic = (func: CumFunc, param?: number): CumStep[] => {
  return useMemo(() => {
    const steps: CumStep[] = [];
    const resultVector: number[] = [];
    
    let currentStreak = 0;

    for (let i = 0; i < CUM_X.length; i++) {
      const windowIndices = Array.from({ length: i + 1 }, (_, k) => k);
      const windowX = CUM_X.slice(0, i + 1);
      const windowY = CUM_Y.slice(0, i + 1);
      const currentX = CUM_X[i];
      const currentY = CUM_Y[i];
      
      let result = 0;
      let calcStr = '';

      switch (func) {
        // Unary
        case 'cumsum':
          result = sum(windowX);
          calcStr = `sum(${windowX.join(', ')})`;
          break;
        case 'cumprod':
          result = prod(windowX);
          calcStr = `prod(${windowX.join(', ')})`;
          break;
        case 'cummax':
          result = max(windowX);
          calcStr = `max(${windowX.join(', ')})`;
          break;
        case 'cummin':
          result = min(windowX);
          calcStr = `min(${windowX.join(', ')})`;
          break;
        case 'cumavg':
          result = parseFloat(avg(windowX).toFixed(2));
          calcStr = `avg(${windowX.join(', ')})`;
          break;
        case 'cummed':
          result = median(windowX);
          calcStr = `median(${windowX.join(', ')})`;
          break;
        case 'cumfirstNot':
          result = windowX[0]; 
          calcStr = `first(${windowX.join(', ')})`;
          break;
        case 'cumlastNot':
          result = windowX[windowX.length - 1];
          calcStr = `last(${windowX.join(', ')})`;
          break;
        case 'cumrank':
          result = rank(windowX, currentX);
          calcStr = `rank(${currentX} in [${windowX.join(', ')}])`;
          break;
        case 'cumcount':
          result = count(windowX);
          calcStr = `count(${windowX.join(', ')})`;
          break;
        case 'cumpercentile':
          const p = param ?? 50;
          result = parseFloat(percentile(windowX, p).toFixed(2));
          calcStr = `percentile(${p}, [${windowX.join(', ')}])`;
          break;
        case 'cumstd':
          result = parseFloat(std(windowX, false).toFixed(2));
          calcStr = `std(${windowX.join(', ')})`;
          break;
        case 'cumstdp':
          result = parseFloat(std(windowX, true).toFixed(2));
          calcStr = `stdp(${windowX.join(', ')})`;
          break;
        case 'cumvar':
          result = parseFloat(variance(windowX, false).toFixed(2));
          calcStr = `var(${windowX.join(', ')})`;
          break;
        case 'cumvarp':
          result = parseFloat(variance(windowX, true).toFixed(2));
          calcStr = `varp(${windowX.join(', ')})`;
          break;
        case 'cumsum2':
          result = sum(windowX.map(x => x * x));
          calcStr = `sum(x^2)`;
          break;
        case 'cumsum3':
          result = sum(windowX.map(x => x * x * x));
          calcStr = `sum(x^3)`;
          break;
        case 'cumsum4':
          result = sum(windowX.map(x => x * x * x * x));
          calcStr = `sum(x^4)`;
          break;
        case 'cumnunique':
          result = new Set(windowX).size;
          calcStr = `nunique(${windowX.join(', ')})`;
          break;
        case 'cumPositiveStreak':
          if (currentX > 0) {
            currentStreak += currentX;
          } else {
            currentStreak = 0;
          }
          result = currentStreak;
          calcStr = currentX > 0 ? `streak + ${currentX}` : `reset (<=0)`;
          break;

        // Binary
        case 'cumwsum':
          result = windowX.reduce((acc, x, idx) => acc + x * windowY[idx], 0);
          calcStr = `sum(X*Y)`;
          break;
        case 'cumwavg':
          const num = windowX.reduce((acc, x, idx) => acc + x * windowY[idx], 0);
          const den = windowY.reduce((acc, y) => acc + y, 0);
          result = den !== 0 ? parseFloat((num / den).toFixed(2)) : 0;
          calcStr = `sum(X*Y) / sum(Y)`;
          break;
        case 'cumcovar':
          result = parseFloat(covar(windowX, windowY, false).toFixed(2));
          calcStr = `covar(X, Y)`;
          break;
        case 'cumcorr':
          result = parseFloat(corr(windowX, windowY).toFixed(2));
          calcStr = `corr(X, Y)`;
          break;
        case 'cumbeta':
          result = parseFloat(beta(windowY, windowX).toFixed(2));
          calcStr = `beta(Y~X)`;
          break;
      }

      resultVector.push(result);

      steps.push({
        index: i,
        windowIndices,
        inputX: CUM_X,
        inputY: CUM_Y,
        currentValX: currentX,
        currentValY: currentY,
        calculation: `${calcStr} = ${result}`,
        result,
        resultVector: [...resultVector]
      });
    }

    return steps;
  }, [func, param]);
};
