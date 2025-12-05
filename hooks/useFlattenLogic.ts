import { useMemo } from 'react';
import { Value, parse, resetIdCounter } from '../lib/dolphindbParser';

export type { Value, ValueType } from '../lib/dolphindbParser';

export const useFlattenLogic = (xStr: string) => {
    return useMemo(() => {
        resetIdCounter();

        // Flatten Logic
        const flatten = (v: Value): Value => {
            if (v.type === 'scalar') return { ...v, type: 'vector', val: [v] }; // Scalar -> Vector? flatten(1) -> [1]
            
            if (v.type === 'vector') {
                // Flatten vector: [1, [2,3]] -> [1, 2, 3]
                // Recursively flatten elements and concat
                const flattenedElements: Value[] = [];
                const process = (item: Value) => {
                    if (item.type === 'scalar') {
                        flattenedElements.push(item);
                    } else if (item.type === 'vector' || item.type === 'tuple') {
                        (item.val as Value[]).forEach(process);
                    }
                };
                (v.val as Value[]).forEach(process);
                return {
                    type: 'vector',
                    val: flattenedElements,
                    id: v.id
                };
            }

            if (v.type === 'tuple') {
                const elements = v.val as Value[];
                const hasTuple = elements.some(e => e.type === 'tuple');
                
                if (hasTuple) {
                    // Recursive step: flatten tuple elements
                    const newElements = elements.map(e => {
                        if (e.type === 'tuple') {
                            return flatten(e);
                        } else {
                            return e;
                        }
                    });
                    return {
                        type: 'tuple',
                        val: newElements,
                        id: v.id
                    };
                } else {
                    // No nested tuples: Flatten to vector
                    const flattenedElements: Value[] = [];
                    const process = (item: Value) => {
                        if (item.type === 'scalar') {
                            flattenedElements.push(item);
                        } else if (item.type === 'vector' || item.type === 'tuple') {
                            (item.val as Value[]).forEach(process);
                        }
                    };
                    elements.forEach(process);
                    return {
                        type: 'vector',
                        val: flattenedElements,
                        id: v.id
                    };
                }
            }
            
            return v;
        };

        let input: Value;
        try {
            input = parse(xStr);
        } catch (e) {
            return { input: null, output: null, error: 'Parse error' };
        }

        const output = flatten(input);

        return { input, output, error: null };
    }, [xStr]);
};
