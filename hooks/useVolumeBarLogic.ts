import { useMemo } from 'react';

export interface VolumeBarItem {
    id: number;
    val: number;
    cumSum: number; // Cumulative sum at this point (global)
    groupCumSum: number; // Cumulative sum within current group (before reset)
    groupId: number;
    label: number;
    isGroupEnd: boolean;
}

export const useVolumeBarLogic = (
    xStr: string,
    interval: number,
    labelMode: 'seq' | 'left' | 'right'
) => {
    return useMemo(() => {
        const items: VolumeBarItem[] = [];
        const parts = xStr.split(',');
        const x = parts.map(p => Number(p.trim())).filter(n => !isNaN(n));

        if (x.length === 0) return { items, threshold: 0, labelMode };

        // Calculate threshold
        let threshold = interval;
        if (interval > 0 && interval < 1) {
            const totalSum = x.reduce((a, b) => a + b, 0);
            threshold = Math.floor(totalSum * interval); // Assuming integer logic for simplicity if X is int, but let's use float
            // Doc says: "X is int, then floor(sum(X)*interval)".
            // We'll assume float for general case, or floor if inputs look like ints?
            // Let's just use the value.
        }

        let currentGroupSum = 0;
        let currentGroupId = 0;
        let globalCumSum = 0;
        let groupStartGlobalSum = 0; // For 'left' label

        // We need to pre-calculate groups to assign labels correctly
        // Actually, we can do it in one pass.
        
        // Logic:
        // Iterate, add to currentGroupSum.
        // Check condition.
        // If condition met, mark group end, increment groupId, reset currentGroupSum.
        
        // Condition:
        // If threshold > 0: currentGroupSum >= threshold
        // If threshold < 0: currentGroupSum <= threshold
        
        // Note: The elements that make the sum >= threshold are INCLUDED in the group.
        // Then NEXT element starts new group.
        
        const tempItems: { val: number, groupId: number, globalCumSum: number }[] = [];
        
        x.forEach((val) => {
            currentGroupSum += val;
            globalCumSum += val;
            
            tempItems.push({
                val,
                groupId: currentGroupId,
                globalCumSum
            });

            if (threshold > 0) {
                if (currentGroupSum >= threshold) {
                    currentGroupId++;
                    currentGroupSum = 0;
                }
            } else if (threshold < 0) {
                if (currentGroupSum <= threshold) {
                    currentGroupId++;
                    currentGroupSum = 0;
                }
            }
        });

        // Now assign labels based on groups
        // We need to know the boundaries to calculate 'left' and 'right' labels.
        // Group i:
        // 'seq': i
        // 'left': sum of all groups before i (i.e., globalCumSum at start of group i)
        // 'right': sum of all groups up to i (i.e., globalCumSum at end of group i)
        
        // Let's find end indices of groups
        const groupEnds = new Map<number, number>(); // groupId -> globalCumSum at end
        let lastGroupId = -1;
        
        // We need to be careful. The last group might not reach threshold.
        // The logic above increments groupId AFTER the element that crosses threshold.
        // So elements with same groupId form a group.
        
        // Find max groupId
        const maxGroupId = tempItems.length > 0 ? tempItems[tempItems.length - 1].groupId : 0;
        
        // Calculate group boundaries
        const groupRightSums = new Map<number, number>();
        const groupLeftSums = new Map<number, number>();
        
        let prevRightSum = 0;
        for (let g = 0; g <= maxGroupId; g++) {
            groupLeftSums.set(g, prevRightSum);
            
            // Find last item of this group
            const groupItems = tempItems.filter(i => i.groupId === g);
            if (groupItems.length > 0) {
                const lastItem = groupItems[groupItems.length - 1];
                groupRightSums.set(g, lastItem.globalCumSum);
                prevRightSum = lastItem.globalCumSum;
            } else {
                // Empty group? Shouldn't happen with this logic unless skipped
                groupRightSums.set(g, prevRightSum);
            }
        }

        items.push(...tempItems.map((item, i) => {
            let label = 0;
            if (labelMode === 'seq') {
                label = item.groupId;
            } else if (labelMode === 'left') {
                label = groupLeftSums.get(item.groupId) || 0;
            } else if (labelMode === 'right') {
                label = groupRightSums.get(item.groupId) || 0;
            }

            // Check if this is the last item of its group
            const isGroupEnd = (i === tempItems.length - 1) || (tempItems[i+1].groupId !== item.groupId);

            return {
                id: i,
                val: item.val,
                cumSum: item.globalCumSum,
                groupCumSum: 0, // Not strictly needed for visualization if we have global
                groupId: item.groupId,
                label,
                isGroupEnd
            };
        }));

        return { items, threshold, labelMode };
    }, [xStr, interval, labelMode]);
};
