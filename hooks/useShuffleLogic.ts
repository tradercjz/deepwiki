import { useMemo } from 'react';
import { parse, Value, generateId, resetIdCounter } from '../lib/dolphindbParser';

interface ShuffleLogicResult {
    input: Value | null;
    output: Value | null;
    mapping: Map<string, string> | null; // InputID -> OutputID
    error: string | null;
}

export const useShuffleLogic = (xStr: string): ShuffleLogicResult => {
    return useMemo(() => {
        resetIdCounter();
        try {
            const input = parse(xStr);

            if (input.type !== 'vector') {
                return { input, output: null, mapping: null, error: 'X must be a vector' };
            }

            const inputVals = input.val as Value[];
            const n = inputVals.length;

            // Create output values (clones with new IDs, or same IDs?)
            // If we want to show "copy", we should generate new IDs.
            // But we want to track movement.
            // Let's generate new IDs but keep a mapping.
            
            const outputVals: Value[] = inputVals.map(v => ({
                type: v.type,
                val: v.val,
                id: generateId()
            }));

            // Shuffle outputVals
            // Use a seeded random or just Math.random?
            // For visualization consistency, maybe seeded?
            // But React useMemo will keep it stable unless input changes.
            // So Math.random is fine.
            
            // Fisher-Yates shuffle
            for (let i = n - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [outputVals[i], outputVals[j]] = [outputVals[j], outputVals[i]];
            }

            // Create mapping based on values?
            // No, duplicate values exist.
            // We need to map indices.
            // But we shuffled the array.
            // We need to know which input index went to which output index.
            // Actually, we can just map InputID -> OutputID.
            // But we need to know which InputID corresponds to which OutputID.
            // Since we shuffled `outputVals`, we lost the direct index correspondence.
            // We should have shuffled indices first.
            
            const indices = Array.from({ length: n }, (_, i) => i);
            for (let i = n - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            
            const shuffledOutputVals: Value[] = [];
            const mapping = new Map<string, string>();
            
            for (let i = 0; i < n; i++) {
                const originalIndex = indices[i];
                const inputVal = inputVals[originalIndex];
                
                const newVal: Value = {
                    type: inputVal.type,
                    val: inputVal.val,
                    id: generateId()
                };
                
                shuffledOutputVals.push(newVal);
                mapping.set(inputVal.id, newVal.id);
            }

            const output: Value = {
                type: 'vector',
                val: shuffledOutputVals,
                id: generateId()
            };

            return { input, output, mapping, error: null };

        } catch (e: any) {
            return { input: null, output: null, mapping: null, error: e.message };
        }
    }, [xStr]);
};
