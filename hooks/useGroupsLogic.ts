import { useMemo } from 'react';

export interface GroupsItem {
    id: number;
    val: number | null; // Support nulls
    originalIndex: number;
}

export interface GroupResult {
    key: number | null;
    indices: number[];
}

export const useGroupsLogic = (
    xStr: string, // comma separated
    mode: 'dict' | 'table' | 'vector' | 'tuple'
) => {
    return useMemo(() => {
        const items: GroupsItem[] = [];
        const parts = xStr.split(',');
        
        parts.forEach((p, i) => {
            const trimmed = p.trim();
            let val: number | null = null;
            if (trimmed.toLowerCase() === 'null' || trimmed === '') {
                val = null;
            } else {
                const n = Number(trimmed);
                val = isNaN(n) ? null : n;
            }
            items.push({
                id: i,
                val,
                originalIndex: i
            });
        });

        // Grouping logic
        const groupsMap = new Map<number | null, number[]>();
        items.forEach(item => {
            const key = item.val;
            if (!groupsMap.has(key)) {
                groupsMap.set(key, []);
            }
            groupsMap.get(key)!.push(item.originalIndex);
        });

        // Convert to array for visualization
        // Order depends on implementation, usually hash map order or sorted keys?
        // Doc says "vector" mode sorts by unique value ascending.
        // "dict" order is implementation dependent (often insertion or hash).
        // Let's sort by key for clarity in visualization, treating null as first or last.
        // DolphinDB usually puts NULL first in sorting?
        
        const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => {
            if (a === b) return 0;
            if (a === null) return -1;
            if (b === null) return 1;
            return a - b;
        });

        const groups: GroupResult[] = sortedKeys.map(key => ({
            key,
            indices: groupsMap.get(key)!
        }));

        return { items, groups, mode };
    }, [xStr, mode]);
};
