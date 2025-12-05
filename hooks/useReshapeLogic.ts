import { useMemo } from 'react';
import { parse, Value, generateId, resetIdCounter } from '../lib/dolphindbParser';

interface ReshapeLogicResult {
    input: Value | null;
    dim: Value | null;
    output: Value | null;
    mapping: Map<string, string> | null; // InputID -> OutputID (for animation)
    error: string | null;
}

export const useReshapeLogic = (xStr: string, dimStr: string): ReshapeLogicResult => {
    return useMemo(() => {
        resetIdCounter();
        try {
            const input = parse(xStr);
            const dim = parse(dimStr);

            if (dim.type !== 'vector') {
                 return { input, dim, output: null, mapping: null, error: 'Dim must be a vector (e.g. [2,3])' };
            }

            // Flatten input to values (Column-major)
            let flatValues: Value[] = [];
            if (input.type === 'vector') {
                flatValues = input.val as Value[];
            } else if (input.type === 'matrix') {
                // Matrix is list of columns (based on my previous decision for regroup)
                // But wait, parse() returns list of vectors.
                // If I treat input as columns:
                const cols = input.val as Value[];
                cols.forEach(col => {
                    flatValues.push(...(col.val as Value[]));
                });
            } else {
                return { input, dim, output: null, mapping: null, error: 'X must be vector or matrix' };
            }

            const dims = (dim.val as Value[]).map(v => Number(v.val));
            if (dims.length !== 2) {
                 return { input, dim, output: null, mapping: null, error: 'Only 2D reshape supported for visualization' };
            }
            
            const newRows = dims[0];
            const newCols = dims[1];
            
            if (flatValues.length !== newRows * newCols) {
                return { input, dim, output: null, mapping: null, error: `Elements (${flatValues.length}) must match dimensions (${newRows}x${newCols}=${newRows*newCols})` };
            }

            // Construct Output (Column-major filling)
            // We need to create columns first, then transpose for rendering (Rows)
            // Or just create rows directly by calculating index.
            // Value at (r, c) comes from flatValues[c * newRows + r]
            
            const outputRows: Value[] = [];
            const mapping = new Map<string, string>(); // InputID -> OutputID

            for (let r = 0; r < newRows; r++) {
                const rowVals: Value[] = [];
                for (let c = 0; c < newCols; c++) {
                    const flatIndex = c * newRows + r;
                    const sourceVal = flatValues[flatIndex];
                    
                    const newVal: Value = {
                        type: 'scalar',
                        val: sourceVal.val,
                        id: generateId()
                    };
                    
                    mapping.set(sourceVal.id, newVal.id);
                    rowVals.push(newVal);
                }
                outputRows.push({
                    type: 'vector',
                    val: rowVals,
                    id: generateId()
                });
            }

            const output: Value = {
                type: 'matrix',
                val: outputRows,
                id: generateId()
            };

            return { input, dim, output, mapping, error: null };

        } catch (e: any) {
            return { input: null, dim: null, output: null, mapping: null, error: e.message };
        }
    }, [xStr, dimStr]);
};
