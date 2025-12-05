import { useMemo } from 'react';
import { parse, Value, generateId, resetIdCounter } from '../lib/dolphindbParser';

interface UngroupLogicResult {
    inputIDs: Value | null;
    inputValues: Value | null;
    outputIDs: Value | null;
    outputValues: Value | null;
    idMapping: Map<string, string[]> | null; // InputID -> [OutputID...]
    valMapping: Map<string, string> | null; // InputValID -> OutputValID
    sourceIndices: number[] | null; // Output Row Index -> Input Row Index
    error: string | null;
}

export const useUngroupLogic = (idsStr: string, valuesStr: string): UngroupLogicResult => {
    return useMemo(() => {
        resetIdCounter();
        try {
            const inputIDs = parse(idsStr);
            const inputValues = parse(valuesStr);

            if (inputIDs.type !== 'vector') {
                return { inputIDs, inputValues, outputIDs: null, outputValues: null, idMapping: null, valMapping: null, sourceIndices: null, error: 'IDs must be a vector' };
            }
            
            if (inputValues.type !== 'tuple') {
                 return { inputIDs, inputValues, outputIDs: null, outputValues: null, idMapping: null, valMapping: null, sourceIndices: null, error: 'Values must be a tuple of vectors (e.g. ([1,2], [3]))' };
            }

            const idVals = inputIDs.val as Value[];
            const valGroups = inputValues.val as Value[];

            if (idVals.length !== valGroups.length) {
                return { inputIDs, inputValues, outputIDs: null, outputValues: null, idMapping: null, valMapping: null, sourceIndices: null, error: `IDs length (${idVals.length}) must match Values length (${valGroups.length})` };
            }

            const outIDVals: Value[] = [];
            const outValVals: Value[] = [];
            const idMapping = new Map<string, string[]>();
            const valMapping = new Map<string, string>();
            const sourceIndices: number[] = [];

            for (let i = 0; i < idVals.length; i++) {
                const idVal = idVals[i];
                const group = valGroups[i];

                if (group.type !== 'vector') {
                    return { inputIDs, inputValues, outputIDs: null, outputValues: null, idMapping: null, valMapping: null, sourceIndices: null, error: `Value at index ${i} must be a vector` };
                }

                const groupVals = group.val as Value[];
                const generatedIds: string[] = [];

                groupVals.forEach(v => {
                    // Create new ID cell
                    const newIdVal: Value = {
                        type: idVal.type,
                        val: idVal.val,
                        id: generateId()
                    };
                    outIDVals.push(newIdVal);
                    generatedIds.push(newIdVal.id);

                    // Create new Value cell
                    const newValVal: Value = {
                        type: v.type,
                        val: v.val,
                        id: generateId()
                    };
                    outValVals.push(newValVal);
                    valMapping.set(v.id, newValVal.id);
                    
                    // Track source index
                    sourceIndices.push(i);
                });

                idMapping.set(idVal.id, generatedIds);
            }

            const outputIDs: Value = {
                type: 'vector',
                val: outIDVals,
                id: generateId()
            };

            const outputValues: Value = {
                type: 'vector',
                val: outValVals,
                id: generateId()
            };

            return { inputIDs, inputValues, outputIDs, outputValues, idMapping, valMapping, sourceIndices, error: null };

        } catch (e: any) {
            return { inputIDs: null, inputValues: null, outputIDs: null, outputValues: null, idMapping: null, valMapping: null, sourceIndices: null, error: e.message };
        }
    }, [idsStr, valuesStr]);
};
