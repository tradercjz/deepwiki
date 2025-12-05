import { useMemo } from 'react';
import { parse, Value, generateId, resetIdCounter } from '../lib/dolphindbParser';

interface RegroupLogicResult {
    input: Value | null;
    labels: Value | null;
    output: Value | null;
    groups: Map<string, number[]> | null; // Label -> Indices
    sourceMap: Map<string, string[]> | null; // OutputCellID -> SourceCellIDs
    error: string | null;
}

export const useRegroupLogic = (
    xStr: string, 
    labelStr: string, 
    funcStr: string, 
    byRow: boolean
): RegroupLogicResult => {
    return useMemo(() => {
        resetIdCounter();
        try {
            const rawInput = parse(xStr);
            const labels = parse(labelStr);

            if (rawInput.type !== 'matrix') {
                return { input: rawInput, labels, output: null, groups: null, sourceMap: null, error: 'X must be a matrix (e.g. [[1,2],[3,4]])' };
            }
            if (labels.type !== 'vector') {
                return { input: rawInput, labels, output: null, groups: null, sourceMap: null, error: 'Label must be a vector' };
            }

            // Treat rawInput as list of COLUMNS (DolphinDB convention)
            const columns = rawInput.val as Value[];
            const numCols = columns.length;
            const numRows = (columns[0].val as Value[]).length;
            const labelVals = labels.val as Value[];

            // Validate dimensions
            if (byRow) {
                if (labelVals.length !== numRows) {
                    return { input: rawInput, labels, output: null, groups: null, sourceMap: null, error: `Label length (${labelVals.length}) must match matrix rows (${numRows})` };
                }
            } else {
                if (labelVals.length !== numCols) {
                    return { input: rawInput, labels, output: null, groups: null, sourceMap: null, error: `Label length (${labelVals.length}) must match matrix columns (${numCols})` };
                }
            }

            // Transpose to Rows for rendering
            const inputRows: Value[] = [];
            for (let r = 0; r < numRows; r++) {
                const rowVals: Value[] = [];
                for (let c = 0; c < numCols; c++) {
                    rowVals.push(columns[c].val[r] as Value);
                }
                inputRows.push({
                    type: 'vector',
                    val: rowVals,
                    id: generateId()
                });
            }
            const renderInput: Value = {
                type: 'matrix',
                val: inputRows,
                id: rawInput.id
            };

            // Group indices
            const groups = new Map<string, number[]>();
            labelVals.forEach((l, idx) => {
                const key = String(l.val);
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(idx);
            });

            // Helper for aggregation
            const aggregate = (values: number[], func: string): number => {
                if (values.length === 0) return 0;
                switch (func.toLowerCase()) {
                    case 'sum': return values.reduce((a, b) => a + b, 0);
                    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
                    case 'max': return Math.max(...values);
                    case 'min': return Math.min(...values);
                    case 'first': return values[0];
                    case 'last': return values[values.length - 1];
                    case 'count': return values.length;
                    default: return values[0]; // Default to first
                }
            };

            let outputRows: Value[] = [];
            const sourceMap = new Map<string, string[]>();

            if (byRow) {
                // Group rows. Output has (unique labels) rows, (same) cols.
                groups.forEach((rowIndices, labelKey) => {
                    const newRowVals: Value[] = [];
                    for (let c = 0; c < numCols; c++) {
                        // Gather values from these rows at column c
                        const sourceIds: string[] = [];
                        const valsToAgg = rowIndices.map(r => {
                            const valObj = columns[c].val[r] as Value;
                            sourceIds.push(valObj.id);
                            return Number(valObj.val);
                        });
                        
                        const aggVal = aggregate(valsToAgg, funcStr);
                        const cellId = generateId();
                        sourceMap.set(cellId, sourceIds);
                        
                        newRowVals.push({
                            type: 'scalar',
                            val: aggVal,
                            id: cellId
                        });
                    }
                    outputRows.push({
                        type: 'vector',
                        val: newRowVals,
                        id: generateId()
                    });
                });
            } else {
                // Group cols. Output has (same) rows, (unique labels) cols.
                // Iterate rows
                for (let r = 0; r < numRows; r++) {
                    const newRowVals: Value[] = [];
                    
                    groups.forEach((colIndices, labelKey) => {
                        // Gather values from this row at these columns
                        const sourceIds: string[] = [];
                        const valsToAgg = colIndices.map(c => {
                            const valObj = columns[c].val[r] as Value;
                            sourceIds.push(valObj.id);
                            return Number(valObj.val);
                        });
                        
                        const aggVal = aggregate(valsToAgg, funcStr);
                        const cellId = generateId();
                        sourceMap.set(cellId, sourceIds);

                        newRowVals.push({
                            type: 'scalar',
                            val: aggVal,
                            id: cellId
                        });
                    });
                    
                    outputRows.push({
                        type: 'vector',
                        val: newRowVals,
                        id: generateId()
                    });
                }
            }

            const output: Value = {
                type: 'matrix',
                val: outputRows,
                id: generateId()
            };

            return { input: renderInput, labels, output, groups, sourceMap, error: null };

        } catch (e: any) {
            return { input: null, labels: null, output: null, groups: null, sourceMap: null, error: e.message };
        }
    }, [xStr, labelStr, funcStr, byRow]);
};
