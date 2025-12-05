import { useMemo } from 'react';

export interface CutPointsItem {
    id: number;
    val: number;
    freq: number;
    cumFreq: number; // Cumulative frequency ending at this item
}

export interface CutPointDef {
    val: number;
    index: number;
}

export const useCutPointsLogic = (rawX: number[], binNum: number, rawFreq?: number[]) => {
    return useMemo(() => {
        // 1. Prepare Data
        // If freq is provided, X must be unique and sorted (according to doc).
        // If not, we sort X and assume freq=1.
        
        let items: CutPointsItem[] = [];
        let totalCount = 0;

        if (rawFreq && rawFreq.length === rawX.length) {
            // Assume X is sorted as per doc requirement for freq usage, 
            // but let's just map them directly.
            let currentCum = 0;
            items = rawX.map((val, i) => {
                const f = rawFreq[i];
                currentCum += f;
                return {
                    id: i,
                    val,
                    freq: f,
                    cumFreq: currentCum
                };
            });
            totalCount = currentCum;
        } else {
            // Sort X
            const sortedX = [...rawX].sort((a, b) => a - b);
            items = sortedX.map((val, i) => ({
                id: i,
                val,
                freq: 1,
                cumFreq: i + 1
            }));
            totalCount = items.length;
        }

        // 2. Calculate Cut Points
        // Target size per bin
        const targetSize = totalCount / binNum;
        
        const cutPoints: number[] = [];
        // First point is min value (or start of first bin)
        // The example [1, 3, 5] for 1,2,3,4 suggests:
        // Bin 1: [1, 3) -> contains 1, 2.
        // Bin 2: [3, 5) -> contains 3, 4.
        // So cut points are: min(X), value at 50%, value at 100% (adjusted).
        
        // Actually DolphinDB cutPoints logic might be slightly more complex to handle boundaries.
        // Based on example 1: 1,2,3,4 -> [1, 3, 5].
        // 1 is items[0].val.
        // 3 is items[2].val (where items are 1,2,3,4). Index 2 is start of 2nd bin.
        // 5 is items[3].val + 1? Or just next integer?
        
        // Based on example 2: 1,2,3,4 with freq 1,1,1,3 -> 1,2,3,4,4,4. Total 6.
        // Target 3.
        // Bin 1: 1,2,3. Ends at cumFreq 3. Next val is 4. So cut is 4.
        // Bin 2: 4,4,4. Ends at cumFreq 6. Next val? 
        // Result [1, 4, 5].
        
        // Algorithm approximation:
        // P0 = items[0].val
        // Pi = items where cumFreq >= i * targetSize.
        // But we need the boundary value.
        // If we split after item j, the cut point is items[j+1].val?
        // Or if item j is the last in bin, cut point is items[j+1].val.
        
        // Let's try to replicate the example logic.
        // Ex 1: 1,2,3,4. Target 2.
        // i=0: start. val=1.
        // i=1: target 2. cumFreq 2 is item 2 (val 2). Next is item 3 (val 3). So cut is 3.
        // i=2: target 4. cumFreq 4 is item 4 (val 4). End. Cut is 4+1=5?
        
        // Ex 2: 1(1), 2(2), 3(3), 4(6). (val(cumFreq))
        // Target 3.
        // i=0: start. val=1.
        // i=1: target 3. cumFreq 3 is item 3 (val 3). Next is item 4 (val 4). Cut is 4.
        // i=2: target 6. cumFreq 6 is item 4 (val 4). End. Cut is 4+1=5?
        
        // It seems the last point is max(X) + 1 (or something similar to cover the range).
        // And intermediate points are the values of the items that start the next bin.
        
        cutPoints.push(items[0].val); // Start
        
        for (let k = 1; k < binNum; k++) {
            const targetCum = k * targetSize;
            // Find item where cumFreq >= targetCum
            // Actually we want the split point.
            // If bin ends at targetCum, the next bin starts at targetCum + epsilon.
            // We look for the first item whose cumFreq > targetCum? No.
            // In Ex 1: target 2. Item with cumFreq 2 is '2'. Next item is '3'. Cut is 3.
            // In Ex 2: target 3. Item with cumFreq 3 is '3'. Next item is '4'. Cut is 4.
            
            // So we find the item index where cumFreq reaches targetCum.
            // The cut point is the value of the NEXT item.
            
            const splitItemIndex = items.findIndex(item => item.cumFreq >= targetCum);
            if (splitItemIndex !== -1 && splitItemIndex < items.length - 1) {
                cutPoints.push(items[splitItemIndex + 1].val);
            } else {
                // Fallback?
                cutPoints.push(items[items.length - 1].val);
            }
        }
        
        // Last point
        const lastVal = items[items.length - 1].val;
        cutPoints.push(lastVal + 1); // Simple heuristic for now matching examples

        return { items, cutPoints, binNum, totalCount, targetSize };
    }, [rawX, binNum, rawFreq]);
};
