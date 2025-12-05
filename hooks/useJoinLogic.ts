import { useMemo } from 'react';

export const useJoinLogic = (xStr: string, yStr: string) => {
  return useMemo(() => {
    try {
      // Simple parsing logic.
      // We need to infer types: Scalar, Vector, Matrix, Table, Tuple.
      
      const parseInput = (str: string) => {
        str = str.trim();
        if (str.startsWith('table(')) {
          // Mock table parsing: table(1..3 as x, 4..6 as y)
          // For simplicity, let's assume JSON input for tables for now or simple mock.
          // Or try to parse the example format.
          // Let's stick to JSON for complex types if possible, or simple eval if safe-ish.
          // But for "1..3", we need to expand ranges.
          return { type: 'table', value: str }; // Placeholder
        }
        if (str.startsWith('matrix(') || (str.startsWith('[') && str.includes('['))) {
           // Matrix
           // If JSON array of arrays -> Matrix (columns)
           try {
             const val = JSON.parse(str);
             if (Array.isArray(val) && Array.isArray(val[0])) return { type: 'matrix', value: val };
           } catch (e) {}
        }
        if (str.startsWith('[')) {
          // Vector
          try {
            const val = JSON.parse(str);
            return { type: 'vector', value: val };
          } catch (e) {}
        }
        if (!isNaN(Number(str))) {
          return { type: 'scalar', value: Number(str) };
        }
        // String scalar
        if (str.startsWith('"') || str.startsWith("'")) {
           return { type: 'scalar', value: str.slice(1, -1) };
        }
        
        // Fallback: try JSON parse
        try {
          const val = JSON.parse(str);
          if (Array.isArray(val)) {
             // Check if matrix (array of arrays)
             if (val.length > 0 && Array.isArray(val[0])) return { type: 'matrix', value: val };
             return { type: 'vector', value: val };
          }
          return { type: 'scalar', value: val };
        } catch (e) {
          return { type: 'unknown', value: str };
        }
      };

      const X = parseInput(xStr);
      const Y = parseInput(yStr);

      let result = null;
      let error = null;

      // Logic implementation
      if (X.type === 'vector' && Y.type === 'vector') {
        result = { type: 'vector', value: [...X.value, ...Y.value] };
      } else if (X.type === 'vector' && Y.type === 'scalar') {
        result = { type: 'vector', value: [...X.value, Y.value] };
      } else if (X.type === 'scalar' && Y.type === 'vector') {
        result = { type: 'vector', value: [X.value, ...Y.value] };
      } else if (X.type === 'scalar' && Y.type === 'scalar') {
        result = { type: 'vector', value: [X.value, Y.value] };
      } else if (X.type === 'matrix' && Y.type === 'matrix') {
        // Check rows
        if (X.value[0].length !== Y.value[0].length) {
          error = "Matrices must have the same number of rows.";
        } else {
          result = { type: 'matrix', value: [...X.value, ...Y.value] }; // Append columns
        }
      } else if (X.type === 'matrix' && Y.type === 'vector') {
         // Vector treated as column?
         if (X.value[0].length !== Y.value.length) {
            error = "Vector length must match matrix rows.";
         } else {
            result = { type: 'matrix', value: [...X.value, Y.value] };
         }
      }
      // TODO: Table support
      
      return { X, Y, result, error };

    } catch (e) {
      return { error: "Parsing error: " + (e as Error).message };
    }
  }, [xStr, yStr]);
};
