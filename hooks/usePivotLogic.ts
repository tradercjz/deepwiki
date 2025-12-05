
import { useMemo } from 'react';
import { PIVOT_DATA } from '../constants';

export interface PivotStep {
  index: number;
  input: { sym: string; time: string; price: number };
  targetRowIdx: number;
  targetColIdx: number;
  prevValue: number | null;
  newValue: number;
  debugStr: string;
}

export interface PivotGridState {
  rows: string[]; // Unique Times
  cols: string[]; // Unique Syms
  steps: PivotStep[];
}

export const usePivotLogic = (aggFunc: 'last' | 'sum' | 'count') => {
  return useMemo(() => {
    const rawData = PIVOT_DATA;

    // 1. Determine Grid Dimensions (Unique Keys)
    const rows = Array.from(new Set(rawData.map(d => d.time))).sort();
    const cols = Array.from(new Set(rawData.map(d => d.sym))).sort();

    // 2. Simulate Steps
    // We need to track the "Running State" of the grid to know what the value becomes
    // Grid: Map<RowKey, Map<ColKey, Value>>
    const gridState = new Map<string, Map<string, number>>();

    const steps: PivotStep[] = rawData.map((item, index) => {
      // Initialize Row in State if missing
      if (!gridState.has(item.time)) {
        gridState.set(item.time, new Map());
      }
      const rowMap = gridState.get(item.time)!;
      
      const prevVal = rowMap.get(item.sym) ?? null;
      let newVal = item.price;

      // Aggregation Logic
      if (aggFunc === 'last') {
          newVal = item.price;
      } else if (aggFunc === 'sum') {
          newVal = (prevVal || 0) + item.price;
      } else if (aggFunc === 'count') {
          newVal = (prevVal || 0) + 1;
      }

      // Update State
      rowMap.set(item.sym, newVal);

      return {
        index,
        input: item,
        targetRowIdx: rows.indexOf(item.time),
        targetColIdx: cols.indexOf(item.sym),
        prevValue: prevVal,
        newValue: newVal,
        debugStr: `pivot(${aggFunc}) at [${item.time}, ${item.sym}] -> ${newVal}`
      };
    });

    return {
      rows,
      cols,
      steps
    };
  }, [aggFunc]);
};
