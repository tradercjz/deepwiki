import { useMemo } from 'react';
import { parse, Value } from '../lib/dolphindbParser';

const extractValues = (val: Value): any[] => {
  if (val.type === 'scalar') return [val.val];
  if (val.type === 'vector') return (val.val as Value[]).map(v => v.val);
  // For simplicity, treat matrix/tuple as flat list of scalars if possible, or just ignore structure
  if (Array.isArray(val.val)) return (val.val as Value[]).flatMap(extractValues);
  return [];
};

export const useUnionLogic = (xStr: string, yStr: string) => {
  return useMemo(() => {
    try {
      const xVal = parse(xStr);
      const yVal = parse(yStr);

      if (!xVal || !yVal) {
        return { error: "Invalid input. Please enter valid vectors or sets." };
      }

      // Convert to arrays
      const xArr = extractValues(xVal);
      const yArr = extractValues(yVal);

      // Calculate union with tracking
      const resultArr: any[] = [];
      const seen = new Set();
      const xStatus = xArr.map(val => {
        if (seen.has(val)) return { val, isDuplicate: true };
        seen.add(val);
        resultArr.push(val);
        return { val, isDuplicate: false };
      });
      
      const yStatus = yArr.map(val => {
        if (seen.has(val)) return { val, isDuplicate: true };
        seen.add(val);
        resultArr.push(val);
        return { val, isDuplicate: false };
      });

      return {
        X: xStatus,
        Y: yStatus,
        result: resultArr
      };
    } catch (e) {
      return { error: "Parsing error: " + (e as Error).message };
    }
  }, [xStr, yStr]);
};
