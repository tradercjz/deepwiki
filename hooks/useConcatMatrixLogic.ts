import { useMemo } from 'react';

export const useConcatMatrixLogic = (matricesStr: string, horizontal: boolean) => {
  return useMemo(() => {
    try {
      // Parse matricesStr. Expecting a tuple of matrices.
      // Simplified parsing: assume input is like "[[[1,2],[3,4]], [[5,6],[7,8]]]"
      // where each inner array is a matrix (array of columns).
      // Or maybe user inputs: "matrix(1..4).reshape(2,2), matrix(5..8).reshape(2,2)"
      // For simplicity, let's assume the user inputs a JSON-like structure of 3D arrays:
      // [ matrix1, matrix2, ... ]
      // where matrix1 = [ col1, col2, ... ]
      
      // Let's try to support a simple format:
      // "[[1, 2], [3, 4]], [[5, 6], [7, 8]]" -> Two 2x2 matrices (columns)
      
      // We can use a safer parser or just JSON.parse if the format is strict.
      // Given the project uses `dolphindbParser` or similar, I should check if I can use that.
      // But for now, I'll stick to JSON-like parsing for simplicity or simple eval if safe.
      
      // Let's assume the input is a string representing a list of matrices, 
      // where each matrix is a list of columns.
      
      // If the input string starts with '[', assume it's a JSON array.
      // Otherwise, try to wrap it (if user entered "m1, m2" style without brackets, though less likely for tuple).
      
      let matrices;
      if (matricesStr.trim().startsWith('[')) {
        matrices = JSON.parse(matricesStr);
      } else {
        matrices = JSON.parse(`[${matricesStr}]`);
      }

      if (!Array.isArray(matrices) || matrices.length === 0) {
        return { error: "Invalid input: Expected a list of matrices." };
      }

      // Validate dimensions
      const firstMatrix = matrices[0];
      const numRows = firstMatrix[0].length;
      const numCols = firstMatrix.length;

      if (horizontal) {
        // Check if all matrices have the same number of rows
        for (let i = 1; i < matrices.length; i++) {
          const m = matrices[i];
          if (m[0].length !== numRows) {
            return { error: `Matrix ${i} has different number of rows.` };
          }
        }
      } else {
        // Check if all matrices have the same number of columns
        for (let i = 1; i < matrices.length; i++) {
          const m = matrices[i];
          if (m.length !== numCols) {
            return { error: `Matrix ${i} has different number of columns.` };
          }
        }
      }

      // Calculate result
      let resultMatrix: any[] = [];

      if (horizontal) {
        // Horizontal concatenation: just append columns
        matrices.forEach((m: any[]) => {
          resultMatrix = resultMatrix.concat(m);
        });
      } else {
        // Vertical concatenation: append rows to each column
        // But wait, matrices are column-major in this representation?
        // If input is [col1, col2], then vertical concat means extending col1, col2...
        // So we need same number of columns.
        
        // Initialize result columns
        resultMatrix = matrices[0].map((col: any[]) => [...col]);
        
        for (let i = 1; i < matrices.length; i++) {
          const m = matrices[i];
          for (let j = 0; j < m.length; j++) {
            resultMatrix[j] = resultMatrix[j].concat(m[j]);
          }
        }
      }

      return {
        matrices,
        resultMatrix,
        horizontal
      };

    } catch (e) {
      return { error: "Parsing error: " + (e as Error).message };
    }
  }, [matricesStr, horizontal]);
};
