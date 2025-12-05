import { useMemo } from 'react';
import { CUM_X, CUM_Y, CUM_S, CumTopNFunc } from '../constants';

export interface CumTopNStep {
  index: number;
  windowIndices: number[]; // [0, ..., index]
  inputX: number[];
  inputY: number[]; // Only for binary
  inputS: number[];
  currentValX: number;
  currentValY: number;
  currentValS: number;
  calculation: string; // e.g. "sum(TopN) = 6"
  result: number;
  resultVector: number[]; // Result up to this point
  topNIndices: number[]; // Indices of elements selected for TopN calculation
}

// Helper functions
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

const variance = (arr: number[], population: boolean) => {
    if (arr.length < 2 && !population) return 0;
    if (arr.length === 0) return 0;
    const m = avg(arr);
    const sqDiff = arr.map(x => Math.pow(x - m, 2));
    const s = sum(sqDiff);
    return s / (population ? arr.length : arr.length - 1);
};

const std = (arr: number[], population: boolean) => Math.sqrt(variance(arr, population));

const skew = (arr: number[], population: boolean) => {
    if (arr.length < 3 && !population) return 0;
    if (arr.length === 0) return 0;
    const m = avg(arr);
    const s = std(arr, population);
    if (s === 0) return 0;
    const n = arr.length;
    const sumCubedDiff = sum(arr.map(x => Math.pow(x - m, 3)));
    
    if (population) {
        return sumCubedDiff / (n * Math.pow(s, 3));
    } else {
        return (n * sumCubedDiff) / ((n - 1) * (n - 2) * Math.pow(s, 3));
    }
};

const kurtosis = (arr: number[], population: boolean) => {
    if (arr.length < 4 && !population) return 0;
    if (arr.length === 0) return 0;
    const m = avg(arr);
    const s = std(arr, population);
    if (s === 0) return 0;
    const n = arr.length;
    const sumQuadDiff = sum(arr.map(x => Math.pow(x - m, 4)));
    
    if (population) {
        return sumQuadDiff / (n * Math.pow(s, 4)) - 3;
    } else {
        const k = (n * (n + 1) * sumQuadDiff) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(s, 4));
        const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
        return k - correction;
    }
};

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

export const useCumTopNLogic = (func: CumTopNFunc, top: number = 3, ascending: boolean = true, tiesMethod: 'oldest' | 'latest' | 'all' = 'latest'): CumTopNStep[] => {
  return useMemo(() => {
    const steps: CumTopNStep[] = [];
    const resultVector: number[] = [];
    
    for (let i = 0; i < CUM_X.length; i++) {
      const windowIndices = Array.from({ length: i + 1 }, (_, k) => k);
      const windowX = CUM_X.slice(0, i + 1);
      const windowY = CUM_Y.slice(0, i + 1);
      const windowS = CUM_S.slice(0, i + 1);
      const currentX = CUM_X[i];
      const currentY = CUM_Y[i];
      const currentS = CUM_S[i];
      
      let result = 0;
      let calcStr = '';
      let topNIndices: number[] = [];

      // Handle TopN Logic
      let activeX: number[] = [];
      let activeY: number[] = [];

      const topK = top;
      // Create items with original index
      const items = windowIndices.map(idx => ({
          idx,
          s: windowS[idx],
          x: windowX[idx],
          y: windowY[idx]
      }));

      // Sort by S
      items.sort((a, b) => {
          if (a.s !== b.s) {
              return ascending ? a.s - b.s : b.s - a.s;
          }
          return 0; 
      });

      // Select Top K
      let selectedItems = [];
      
      if (items.length <= topK) {
          selectedItems = items;
      } else {
          const cutOffItem = items[topK - 1];
          const cutOffVal = cutOffItem.s;
          
          const betterItems = items.filter(item => ascending ? item.s < cutOffVal : item.s > cutOffVal);
          const equalItems = items.filter(item => item.s === cutOffVal);
          
          const needed = topK - betterItems.length;
          
          if (tiesMethod === 'all') {
              selectedItems = [...betterItems, ...equalItems];
          } else {
              equalItems.sort((a, b) => tiesMethod === 'oldest' ? a.idx - b.idx : b.idx - a.idx);
              const selectedEqual = equalItems.slice(0, needed);
              selectedItems = [...betterItems, ...selectedEqual];
          }
      }

      topNIndices = selectedItems.map(item => item.idx);
      activeX = selectedItems.map(item => item.x);
      activeY = selectedItems.map(item => item.y);

      switch (func) {
        // TopN Unary
        case 'cumsumTopN':
          result = sum(activeX);
          calcStr = `sum(TopN)`;
          break;
        case 'cumavgTopN':
          result = parseFloat(avg(activeX).toFixed(2));
          calcStr = `avg(TopN)`;
          break;
        case 'cumstdTopN':
          result = parseFloat(std(activeX, false).toFixed(2));
          calcStr = `std(TopN)`;
          break;
        case 'cumstdpTopN':
          result = parseFloat(std(activeX, true).toFixed(2));
          calcStr = `stdp(TopN)`;
          break;
        case 'cumvarTopN':
          result = parseFloat(variance(activeX, false).toFixed(2));
          calcStr = `var(TopN)`;
          break;
        case 'cumvarpTopN':
          result = parseFloat(variance(activeX, true).toFixed(2));
          calcStr = `varp(TopN)`;
          break;
        case 'cumskewTopN':
          result = parseFloat(skew(activeX, true).toFixed(2));
          calcStr = `skew(TopN)`;
          break;
        case 'cumkurtosisTopN':
          result = parseFloat(kurtosis(activeX, true).toFixed(2));
          calcStr = `kurt(TopN)`;
          break;

        // TopN Binary
        case 'cumbetaTopN':
          result = parseFloat(beta(activeY, activeX).toFixed(2));
          calcStr = `beta(TopN Y~X)`;
          break;
        case 'cumcorrTopN':
          result = parseFloat(corr(activeX, activeY).toFixed(2));
          calcStr = `corr(TopN)`;
          break;
        case 'cumcovarTopN':
          result = parseFloat(covar(activeX, activeY, false).toFixed(2));
          calcStr = `covar(TopN)`;
          break;
        case 'cumwsumTopN':
          result = activeX.reduce((acc, x, idx) => acc + x * activeY[idx], 0);
          calcStr = `sum(TopN X*Y)`;
          break;
      }

      resultVector.push(result);

      steps.push({
        index: i,
        windowIndices,
        inputX: CUM_X,
        inputY: CUM_Y,
        inputS: CUM_S,
        currentValX: currentX,
        currentValY: currentY,
        currentValS: currentS,
        calculation: `${calcStr} = ${result}`,
        result,
        resultVector: [...resultVector],
        topNIndices
      });
    }

    return steps;
  }, [func, top, ascending, tiesMethod]);
};
