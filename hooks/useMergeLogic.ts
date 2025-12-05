import { useMemo } from 'react';

export const useMergeLogic = (leftStr: string, rightStr: string, how: string) => {
  return useMemo(() => {
    try {
      // Parse inputs. Expecting JSON objects: { index: [], data: [] }
      // Or simplified: just arrays, and we assume index is 0..n? No, merge relies on index matching.
      // So user must provide index.
      
      const parseInput = (str: string) => {
        try {
          return JSON.parse(str);
        } catch (e) {
          return null;
        }
      };

      const left = parseInput(leftStr);
      const right = parseInput(rightStr);

      if (!left || !right || !left.index || !right.index || !left.data || !right.data) {
        return { error: "Invalid input. Expected JSON with 'index' and 'data' arrays." };
      }

      // Normalize data to array of arrays (matrix columns) or single array (series)
      // If data is array of scalars, treat as 1 column.
      // If data is array of arrays, treat as columns.
      
      const normalizeData = (d: any) => {
        if (Array.isArray(d) && Array.isArray(d[0])) return d;
        return [d];
      };

      const leftData = normalizeData(left.data);
      const rightData = normalizeData(right.data);
      
      const leftIndex = left.index;
      const rightIndex = right.index;

      // Perform merge
      let resultIndex: any[] = [];
      let resultLeftData: any[][] = leftData.map(() => []);
      let resultRightData: any[][] = rightData.map(() => []);
      let sourceIndices: { lIdx: number, rIdx: number }[] = [];

      // Helper to find index
      // Assuming sorted index for asof, but for others just matching.
      // Let's assume indices are unique for simplicity.
      
      const allIndices = new Set([...leftIndex, ...rightIndex]);
      const sortedIndices = Array.from(allIndices).sort((a: any, b: any) => (a > b ? 1 : -1));

      if (how === 'inner') {
        sortedIndices.forEach(idx => {
          const lIdx = leftIndex.indexOf(idx);
          const rIdx = rightIndex.indexOf(idx);
          if (lIdx !== -1 && rIdx !== -1) {
            resultIndex.push(idx);
            leftData.forEach((col, i) => resultLeftData[i].push(col[lIdx]));
            rightData.forEach((col, i) => resultRightData[i].push(col[rIdx]));
            sourceIndices.push({ lIdx, rIdx });
          }
        });
      } else if (how === 'outer') {
        sortedIndices.forEach(idx => {
          const lIdx = leftIndex.indexOf(idx);
          const rIdx = rightIndex.indexOf(idx);
          resultIndex.push(idx);
          leftData.forEach((col, i) => resultLeftData[i].push(lIdx !== -1 ? col[lIdx] : null));
          rightData.forEach((col, i) => resultRightData[i].push(rIdx !== -1 ? col[rIdx] : null));
          sourceIndices.push({ lIdx, rIdx });
        });
      } else if (how === 'left') {
        leftIndex.forEach((idx: any, lIdx: number) => {
          const rIdx = rightIndex.indexOf(idx);
          resultIndex.push(idx);
          leftData.forEach((col, i) => resultLeftData[i].push(col[lIdx]));
          rightData.forEach((col, i) => resultRightData[i].push(rIdx !== -1 ? col[rIdx] : null));
          sourceIndices.push({ lIdx, rIdx });
        });
      } else if (how === 'right') {
        rightIndex.forEach((idx: any, rIdx: number) => {
          const lIdx = leftIndex.indexOf(idx);
          resultIndex.push(idx);
          leftData.forEach((col, i) => resultLeftData[i].push(lIdx !== -1 ? col[lIdx] : null));
          rightData.forEach((col, i) => resultRightData[i].push(col[rIdx]));
          sourceIndices.push({ lIdx, rIdx });
        });
      } else if (how === 'asof') {
        // Asof join: for each left index, find matching or previous right index.
        // Assuming sorted indices.
        leftIndex.forEach((idx: any, lIdx: number) => {
          resultIndex.push(idx);
          leftData.forEach((col, i) => resultLeftData[i].push(col[lIdx]));
          
          // Find right index <= idx
          // Assuming rightIndex is sorted.
          let bestRIdx = -1;
          for (let i = 0; i < rightIndex.length; i++) {
            if (rightIndex[i] <= idx) {
              bestRIdx = i;
            } else {
              break;
            }
          }
          
          rightData.forEach((col, i) => resultRightData[i].push(bestRIdx !== -1 ? col[bestRIdx] : null));
          sourceIndices.push({ lIdx, rIdx: bestRIdx });
        });
      }

      return {
        left: { index: leftIndex, data: leftData },
        right: { index: rightIndex, data: rightData },
        result: {
          index: resultIndex,
          data: [...resultLeftData, ...resultRightData],
          sourceIndices
        },
        how
      };

    } catch (e) {
      return { error: "Parsing error: " + (e as Error).message };
    }
  }, [leftStr, rightStr, how]);
};
