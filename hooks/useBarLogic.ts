import { useMemo } from 'react';
import { parse, Value } from '../lib/dolphindbParser';

export interface BarItem {
    id: string;
    val: number | string;
    barVal: number | string;
    numericVal: number;
    numericBarVal: number;
    formula: string; // e.g. "12 - 2"
    remainder: number;
    intervalStart: number;
    intervalEnd: number;
    isTime: boolean;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

const parseDuration = (str: string): number | null => {
    const match = str.match(/^(\d+)([wdHms]|ms|us|ns)$/);
    if (!match) return null;
    const val = parseInt(match[1]);
    const unit = match[2];
    // Base unit: ms (for simplicity in JS)
    switch (unit) {
        case 'w': return val * 7 * 24 * 3600 * 1000;
        case 'd': return val * 24 * 3600 * 1000;
        case 'H': return val * 3600 * 1000;
        case 'm': return val * 60 * 1000;
        case 's': return val * 1000;
        case 'ms': return val;
        // us, ns not supported in JS Date precision easily, treat as ms or ignore
        default: return val;
    }
};

const isDateString = (str: string) => {
    // Simple check for YYYY.MM.DD or YYYY-MM-DD
    return /^\d{4}[.-]\d{2}[.-]\d{2}/.test(str);
};

const parseDate = (str: string): number => {
    // Handle DolphinDB format YYYY.MM.DD
    const normalized = str.replace(/\./g, '-');
    return new Date(normalized).getTime();
};

const formatDate = (ts: number, hasTime: boolean): string => {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (!hasTime) return `${year}.${month}.${day}`;
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day}T${hours}:${minutes}:${seconds}`;
};

export const useBarLogic = (xStr: string, intervalStr: string | number, closed: 'left' | 'right') => {
    return useMemo(() => {
        let items: BarItem[] = [];
        let error: string | null = null;
        let grid: number[] = [];
        let isTime = false;
        let hasTimePart = false;
        let interval = 0;

        try {
            // Parse Interval
            if (typeof intervalStr === 'number') {
                interval = intervalStr;
            } else {
                const dur = parseDuration(intervalStr);
                if (dur !== null) {
                    interval = dur;
                    isTime = true; 
                } else {
                    interval = Number(intervalStr);
                }
            }

            if (isNaN(interval) || interval <= 0) {
                throw new Error("Invalid interval");
            }

            const parsed = parse(xStr);
            let rawVals: any[] = [];

            if (parsed.type === 'vector') {
                rawVals = (parsed.val as Value[]).map(v => v.val);
            } else if (parsed.type === 'scalar') {
                // Check if it's a comma-separated string that should be treated as vector
                if (typeof parsed.val === 'string' && parsed.val.includes(',')) {
                    rawVals = parsed.val.split(',').map(s => s.trim());
                } else {
                    rawVals = [parsed.val];
                }
            } else {
                error = "X must be a scalar or vector";
            }

            if (!error) {
                // Detect data type
                if (rawVals.length > 0 && typeof rawVals[0] === 'string' && isDateString(rawVals[0])) {
                    isTime = true;
                    hasTimePart = rawVals[0].includes('T') || rawVals[0].includes(':');
                }

                const vals = rawVals.map(v => {
                    if (isTime) return parseDate(String(v));
                    return Number(v);
                });

                items = vals.map((val, i) => {
                    if (isNaN(val)) return null; // Skip invalid values

                    let barVal = 0;
                    let formula = "";
                    let remainder = mod(val, interval);
                    
                    if (closed === 'left') {
                        barVal = val - remainder;
                        if (isTime) {
                            formula = `floor(${formatDate(val, hasTimePart)})`; 
                        } else {
                            formula = `${val} - ${remainder}`;
                        }
                    } else {
                        if (remainder === 0) {
                            barVal = val;
                            formula = isTime ? `${formatDate(val, hasTimePart)}` : `${val}`;
                        } else {
                            const diff = interval - remainder;
                            barVal = val + diff;
                            formula = isTime ? `ceil(${formatDate(val, hasTimePart)})` : `${val} + ${diff}`;
                        }
                    }

                    let intervalStart, intervalEnd;
                    if (closed === 'left') {
                        intervalStart = barVal;
                        intervalEnd = barVal + interval;
                    } else {
                        intervalStart = barVal - interval;
                        intervalEnd = barVal;
                    }

                    return {
                        id: `item-${i}`,
                        val: isTime ? formatDate(val, hasTimePart) : val,
                        barVal: isTime ? formatDate(barVal, hasTimePart) : barVal,
                        numericVal: val,
                        numericBarVal: barVal,
                        formula,
                        remainder,
                        intervalStart,
                        intervalEnd,
                        isTime
                    };
                }).filter(i => i !== null) as BarItem[];

                if (items.length > 0) {
                    const numericBarVals = items.map(i => i.numericBarVal);
                    const minBar = Math.min(...numericBarVals);
                    const maxBar = Math.max(...numericBarVals);
                    
                    const start = Math.floor(minBar / interval) * interval - interval;
                    const end = Math.ceil(maxBar / interval) * interval + interval * 2;
                    
                    const range = end - start;
                    const steps = range / interval;
                    if (steps > 100) {
                        for (let x = start; x <= start + 20 * interval; x += interval) {
                             grid.push(x);
                        }
                    } else {
                        for (let x = start; x <= end; x += interval) {
                            grid.push(x);
                        }
                    }
                }
            }

        } catch (e: any) {
            error = e.message;
        }

        return { items, interval, closed, grid, error, isTime, hasTimePart };
    }, [xStr, intervalStr, closed]);
};
