export type ValueType = 'scalar' | 'vector' | 'tuple' | 'matrix' | 'table';

export interface Value {
    type: ValueType;
    val: any; // number, Value[], Value[][], or {[col: string]: any[]}
    id: string; // Unique ID for animation
}

let idCounter = 0;
export const generateId = () => `node-${idCounter++}`;
export const resetIdCounter = () => { idCounter = 0; };

export const splitByComma = (str: string): string[] => {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '(' || char === '[') depth++;
        if (char === ')' || char === ']') depth--;
        
        if (char === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
};

const parseRange = (str: string): number[] | null => {
    const match = str.match(/^(\d+)\.\.(\d+)$/);
    if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        const res = [];
        for (let i = start; i <= end; i++) res.push(i);
        return res;
    }
    return null;
};

export const parse = (str: string): Value => {
    str = str.trim();
    
    if (str.startsWith('table(') && str.endsWith(')')) {
        // Table
        const inner = str.slice(6, -1);
        const parts = splitByComma(inner);
        const tableData: {[col: string]: any[]} = {};
        
        parts.forEach(part => {
            const asIndex = part.toLowerCase().lastIndexOf(' as ');
            if (asIndex !== -1) {
                const valStr = part.slice(0, asIndex).trim();
                const colName = part.slice(asIndex + 4).trim();
                
                // Parse value
                let colValues: any[] = [];
                const rangeVal = parseRange(valStr);
                if (rangeVal) {
                    colValues = rangeVal;
                } else {
                    const parsedVal = parse(valStr);
                    if (parsedVal.type === 'vector') {
                        colValues = (parsedVal.val as Value[]).map(v => v.val);
                    } else if (parsedVal.type === 'scalar') {
                         // Should probably be a vector if it's a table column, but maybe single value repeated?
                         // For now assume it's a vector definition like [1, 2, 3]
                         colValues = [parsedVal.val];
                    }
                }
                tableData[colName] = colValues;
            }
        });

        return {
            type: 'table',
            val: tableData,
            id: generateId()
        };
    } else if (str.startsWith('(') && str.endsWith(')')) {
        // Tuple
        const inner = str.slice(1, -1);
        const parts = splitByComma(inner);
        return {
            type: 'tuple',
            val: parts.map(parse),
            id: generateId()
        };
    } else if (str.startsWith('[') && str.endsWith(']')) {
        // Vector or Matrix
        const inner = str.slice(1, -1);
        const parts = splitByComma(inner);
        const elements = parts.map(parse);
        
        // Check if it's a matrix (all elements are vectors of same length)
        const isMatrix = elements.length > 0 && 
                         elements.every(e => e.type === 'vector') &&
                         elements.every(e => (e.val as Value[]).length === (elements[0].val as Value[]).length);

        return {
            type: isMatrix ? 'matrix' : 'vector',
            val: elements,
            id: generateId()
        };
    } else {
        // Scalar or Range
        const rangeVal = parseRange(str);
        if (rangeVal) {
             // Range is technically a vector
             return {
                 type: 'vector',
                 val: rangeVal.map(n => ({ type: 'scalar', val: n, id: generateId() })),
                 id: generateId()
             };
        }

        const n = Number(str);
        return {
            type: 'scalar',
            val: isNaN(n) ? str : n,
            id: generateId()
        };
    }
};
