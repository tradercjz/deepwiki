
import { useMemo } from 'react';
import { AGGR_TOPN_DATA } from '../constants';

export interface TopNItem {
    id: number;
    sortVal: number; // The sorting criteria
    funcVal: number; // The value to aggregate
    originalIndex: number;
    sortedIndex: number;
    isTop: boolean;
}

export interface AggrTopNState {
    items: TopNItem[]; // Items with computed sorted positions
    result: number;
    debugStr: string;
}

export type AggrFunc = 'sum' | 'max' | 'min' | 'avg' | 'count';

export const useAggrTopNLogic = (
    func: AggrFunc,
    top: number,
    ascending: boolean
) => {
    return useMemo(() => {
        const rawData = AGGR_TOPN_DATA;
        
        // 1. Create Items wrapper
        let items: TopNItem[] = rawData.map((d, i) => ({
            id: d.id,
            sortVal: d.sortVal,
            funcVal: d.funcVal,
            originalIndex: i,
            sortedIndex: -1, // To be filled
            isTop: false     // To be filled
        }));

        // 2. Sort
        const sortedItems = [...items].sort((a, b) => {
            if (ascending) return a.sortVal - b.sortVal;
            return b.sortVal - a.sortVal;
        });

        // 3. Assign Sorted Indices and determine Top N
        // Top can be float (percent) or int. Assuming Int for this demo visualization for simplicity, 
        // or logic: if top < 1, top = floor(length * top)
        let count = top;
        if (top < 1 && top > 0) {
            count = Math.max(1, Math.floor(items.length * top));
        }
        count = Math.min(count, items.length);

        const topNIds = new Set(sortedItems.slice(0, count).map(i => i.id));
        
        // Values selected for aggregation
        const selectedValues: number[] = [];

        items = items.map(item => {
            const sortedIdx = sortedItems.findIndex(s => s.id === item.id);
            const isTop = topNIds.has(item.id);
            if (isTop) selectedValues.push(item.funcVal);

            return {
                ...item,
                sortedIndex: sortedIdx,
                isTop: isTop
            };
        });

        // 4. Aggregate
        let result = 0;
        let debugStr = "";
        
        if (selectedValues.length > 0) {
            if (func === 'sum') {
                result = selectedValues.reduce((a, b) => a + b, 0);
            } else if (func === 'max') {
                result = Math.max(...selectedValues);
            } else if (func === 'min') {
                result = Math.min(...selectedValues);
            } else if (func === 'avg') {
                result = selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length;
            } else if (func === 'count') {
                result = selectedValues.length;
            }
        }
        
        result = Number(result.toFixed(2));
        debugStr = `${func}(Top ${count}) -> ${result}`;

        return {
            items,
            result,
            debugStr
        };

    }, [func, top, ascending]);
};
