
import { useMemo } from 'react';
import { GROUPING_DATA, GroupFunc } from '../constants';

export interface GroupItem {
    id: number;
    sym: string;
    val: number;
    originalIndex: number;
    sortedIndex: number; // Index in the global sorted list
    groupIndex: number; // Index of the group (e.g. IBM=0, MSFT=1)
    indexInGroup: number; // 0, 1, 2 within the group
    debugStr?: string; // For tooltip
}

export interface GroupData {
    sym: string;
    items: GroupItem[];
    result: number;
    debugStr: string;
    startIndex: number; // Start index in global sorted list
}

export interface GroupingState {
    items: GroupItem[];
    groups: GroupData[];
    mode: 'groupby' | 'contextby';
}

export const useGroupingLogic = (mode: 'groupby' | 'contextby', func: GroupFunc) => {
    return useMemo(() => {
        const rawData = GROUPING_DATA;
        
        // 1. Prepare items
        let items: GroupItem[] = rawData.map((d, i) => ({
            id: i,
            sym: d.sym,
            val: d.val,
            originalIndex: i,
            sortedIndex: 0,
            groupIndex: 0,
            indexInGroup: 0
        }));

        // 2. Group & Sort
        // Grouping implicitly sorts by Key usually for visualization purposes
        // Sort by Sym
        const sortedItems = [...items].sort((a, b) => a.sym.localeCompare(b.sym));
        
        // 3. Build Groups
        const groups: GroupData[] = [];
        let currentSym = "";
        let currentGroup: GroupItem[] = [];
        let globalIndex = 0;

        // Helper to finalize group
        const finalizeGroup = () => {
            if (currentGroup.length > 0) {
                // Calc Aggregate
                const vals = currentGroup.map(i => i.val);
                let res = 0;
                if (func === 'sum') res = vals.reduce((a,b)=>a+b,0);
                else if (func === 'avg') res = vals.reduce((a,b)=>a+b,0) / vals.length;
                else if (func === 'max') res = Math.max(...vals);
                else if (func === 'count') res = vals.length;
                
                res = Number(res.toFixed(2));

                groups.push({
                    sym: currentSym,
                    items: currentGroup,
                    result: res,
                    debugStr: `${func}(${currentSym}) = ${res}`,
                    startIndex: globalIndex - currentGroup.length
                });
            }
        };

        sortedItems.forEach((item, i) => {
            if (item.sym !== currentSym) {
                finalizeGroup();
                currentSym = item.sym;
                currentGroup = [];
            }
            
            // Assign indices
            item.sortedIndex = globalIndex++;
            item.indexInGroup = currentGroup.length;
            item.groupIndex = groups.length; // Next group index
            
            currentGroup.push(item);
        });
        finalizeGroup(); // Last group

        // Remap sorted properties back to original items list for animation consistency
        const itemMap = new Map(sortedItems.map(i => [i.id, i]));
        const enrichedItems = items.map(i => {
            const sorted = itemMap.get(i.id)!;
            const group = groups[sorted.groupIndex];
            return {
                ...i,
                sortedIndex: sorted.sortedIndex,
                groupIndex: sorted.groupIndex,
                indexInGroup: sorted.indexInGroup,
                debugStr: group ? group.debugStr : ''
            };
        });

        // Add groupIndex to groups themselves
        // (already done by array push order)

        return {
            items: enrichedItems,
            groups,
            mode
        };

    }, [mode, func]);
};
