import { useMemo } from 'react';

export interface DigitizeItem {
    id: number;
    val: number;
    resultIndex: number;
}

export const useDigitizeLogic = (
    x: number[],
    bins: number[],
    right: boolean
) => {
    return useMemo(() => {
        // Check if bins are increasing or decreasing
        let isIncreasing = true;
        if (bins.length >= 2) {
            isIncreasing = bins[1] > bins[0];
        }

        const items: DigitizeItem[] = x.map((val, id) => {
            let index = 0;
            
            if (isIncreasing) {
                if (right) {
                    // right=true: bins[i-1] < x <= bins[i]
                    // Find first element in bins >= x
                    // If x <= bins[0], index is 0? No, doc says:
                    // "bins里第一个大于等于 x 的元素的索引"
                    // Example: bins=[1,3,5], x=1. First >= 1 is bins[0]=1. Index 0?
                    // Wait, doc example: x=[-1,0,1,2,3...], bins=[1,3,5], right=true
                    // digitize(1, [1,3,5], true) -> 0. Correct.
                    // digitize(2, [1,3,5], true) -> 1. (First >= 2 is 3, index 1).
                    // digitize(5, [1,3,5], true) -> 2. (First >= 5 is 5, index 2).
                    // digitize(6, [1,3,5], true) -> 3. (None >= 6, return len).
                    
                    const foundIndex = bins.findIndex(b => b >= val);
                    index = foundIndex === -1 ? bins.length : foundIndex;
                } else {
                    // right=false: bins[i-1] <= x < bins[i]
                    // Find first element in bins > x
                    // Example: bins=[1,3,5], x=1. First > 1 is 3 (index 1).
                    // digitize(1, [1,3,5], false) -> 1.
                    // digitize(0, [1,3,5], false) -> 0. (First > 0 is 1, index 0).
                    
                    const foundIndex = bins.findIndex(b => b > val);
                    index = foundIndex === -1 ? bins.length : foundIndex;
                }
            } else {
                // Decreasing
                if (right) {
                    // right=true: Find first element < x
                    // Example: bins=[5,3,1], x=5. First < 5 is 3 (index 1)?
                    // Doc: bins=[5,3,1] (reverse of [1,3,5]). x=5. right=true -> 2.
                    // Wait, bins=[5,3,1]. Index 0 is 5, 1 is 3, 2 is 1.
                    // First element < 5 is 3 (index 1). Why doc says 2?
                    // Let's re-read doc carefully.
                    // "bins = reverse(bins)" -> [5, 5, 3, 3, 1] in first example?
                    // No, first example bins=[1,3,3,5,5]. Reverse is [5,5,3,3,1].
                    // digitize(5, bins, true). First < 5 is 3. Index 2. Correct.
                    
                    const foundIndex = bins.findIndex(b => b < val);
                    index = foundIndex === -1 ? bins.length : foundIndex;
                } else {
                    // right=false: Find first element <= x
                    // Example: bins=[5,3,1], x=5. First <= 5 is 5 (index 0).
                    // Doc: digitize(5, bins, false) -> 0. Correct.
                    
                    const foundIndex = bins.findIndex(b => b <= val);
                    index = foundIndex === -1 ? bins.length : foundIndex;
                }
            }

            return {
                id,
                val,
                resultIndex: index
            };
        });

        return { items, bins, right, isIncreasing };
    }, [x, bins, right]);
};
