import { useMemo } from 'react';
import { parse, Value } from '../lib/dolphindbParser';

export const useUnionAllLogic = (tableAStr: string, tableBStr: string, byColName: boolean) => {
  return useMemo(() => {
    try {
      const tableAVal = parse(tableAStr);
      const tableBVal = parse(tableBStr);

      if (!tableAVal || !tableBVal || tableAVal.type !== 'table' || tableBVal.type !== 'table') {
        return { error: "Invalid input. Please enter valid tables using table(...) syntax." };
      }

      const tableA = tableAVal.val as {[col: string]: any[]};
      const tableB = tableBVal.val as {[col: string]: any[]};

      const colsA = Object.keys(tableA);
      const colsB = Object.keys(tableB);

      let result: {[col: string]: any[]} = {};
      let error = null;

      if (byColName) {
        // Union by column name
        const allCols = Array.from(new Set([...colsA, ...colsB]));
        
        allCols.forEach(col => {
          const colDataA = tableA[col] || Array(tableA[colsA[0]].length).fill(null);
          const colDataB = tableB[col] || Array(tableB[colsB[0]].length).fill(null);
          result[col] = [...colDataA, ...colDataB];
        });

      } else {
        // Union by position
        if (colsA.length !== colsB.length) {
          return { error: "The number of columns of the table to insert must be the same as that of the original table." };
        }

        colsA.forEach((col, idx) => {
          const colDataA = tableA[col];
          const colDataB = tableB[colsB[idx]]; // Match by index
          result[col] = [...colDataA, ...colDataB];
        });
      }

      return {
        tableA,
        tableB,
        result,
        byColName
      };

    } catch (e) {
      return { error: "Parsing error: " + (e as Error).message };
    }
  }, [tableAStr, tableBStr, byColName]);
};
