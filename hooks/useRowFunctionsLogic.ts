import { useMemo } from 'react';

export type RowFuncType = 
  | 'rowSum' | 'rowAvg' | 'rowMax' | 'rowMin' | 'rowProd' 
  | 'rowCount' | 'rowVar' | 'rowStd' | 'rowWsum';

export interface RowStep {
  rowIndex: number;
  rowValues: number[]; // Values in the current row of X
  rowWeights?: number[]; // Values in the current row of Y (for binary funcs)
  result: number;
  formula: string;
}

// Helper to generate sample matrix data
export const generateMatrix = (rows: number, cols: number, seed: number = 0) => {
  const matrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      // Simple pseudo-random generation
      const val = Math.floor(Math.abs(Math.sin(seed + i * cols + j) * 100)) % 20 + 1;
      row.push(val);
    }
    matrix.push(row);
  }
  return matrix;
};

export const useRowFunctionsLogic = (
  func: RowFuncType,
  rows: number = 5,
  cols: number = 4
) => {
  // Generate data
  const matrixX = useMemo(() => generateMatrix(rows, cols, 1), [rows, cols]);
  const matrixY = useMemo(() => generateMatrix(rows, cols, 2), [rows, cols]); // For binary funcs

  const steps = useMemo(() => {
    const newSteps: RowStep[] = [];

    for (let i = 0; i < rows; i++) {
      const rowX = matrixX[i];
      const rowY = matrixY[i];
      let result = 0;
      let formula = '';

      switch (func) {
        case 'rowSum':
          result = rowX.reduce((a, b) => a + b, 0);
          formula = `sum([${rowX.join(', ')}])`;
          break;
        case 'rowAvg':
          result = rowX.reduce((a, b) => a + b, 0) / rowX.length;
          formula = `avg([${rowX.join(', ')}])`;
          break;
        case 'rowMax':
          result = Math.max(...rowX);
          formula = `max([${rowX.join(', ')}])`;
          break;
        case 'rowMin':
          result = Math.min(...rowX);
          formula = `min([${rowX.join(', ')}])`;
          break;
        case 'rowProd':
          result = rowX.reduce((a, b) => a * b, 1);
          formula = `prod([${rowX.join(', ')}])`;
          break;
        case 'rowCount':
          result = rowX.length;
          formula = `count([${rowX.join(', ')}])`;
          break;
        case 'rowVar': {
          const mean = rowX.reduce((a, b) => a + b, 0) / rowX.length;
          const sqDiff = rowX.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0);
          result = sqDiff / (rowX.length - 1);
          formula = `var([${rowX.join(', ')}])`;
          break;
        }
        case 'rowStd': {
          const mean = rowX.reduce((a, b) => a + b, 0) / rowX.length;
          const sqDiff = rowX.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0);
          result = Math.sqrt(sqDiff / (rowX.length - 1));
          formula = `std([${rowX.join(', ')}])`;
          break;
        }
        case 'rowWsum':
          result = rowX.reduce((acc, x, idx) => acc + x * rowY[idx], 0);
          formula = `wsum(X, Y)`;
          break;
      }

      newSteps.push({
        rowIndex: i,
        rowValues: rowX,
        rowWeights: func === 'rowWsum' ? rowY : undefined,
        result,
        formula
      });
    }

    return newSteps;
  }, [func, rows, cols, matrixX, matrixY]);

  return { steps, matrixX, matrixY };
};
