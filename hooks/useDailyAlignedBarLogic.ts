import { useMemo } from 'react';

export interface DataRow {
    id: number;
    time: number; // Seconds from midnight
    timeStr: string;
    price: number;
    barStart: number | null;
    barStartStr: string;
}

export interface Session {
    start: number;
    end: number;
}

export const useDailyAlignedBarLogic = (
    sessionsStr: string, // e.g. "09:30 13:00" or "09:30-11:30, 13:00-15:00"
    intervalMinutes: number,
    mergeSessionEnd: boolean
) => {
    // Helper to parse "HH:MM" to seconds
    const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 3600 + m * 60;
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return useMemo(() => {
        // Parse sessions
        // Input format assumption: "09:30-11:30, 13:00-15:00" for simplicity in this demo
        // Or just start times if end times are implied? 
        // The doc says timeOffset is start times. timeEnd is optional.
        // Let's assume the user provides pairs for visualization clarity: "09:30-11:30, 13:00-15:00"
        
        const sessions: Session[] = [];
        const parts = sessionsStr.split(',');
        parts.forEach(p => {
            const [startStr, endStr] = p.trim().split('-');
            if (startStr && endStr) {
                sessions.push({
                    start: parseTime(startStr),
                    end: parseTime(endStr)
                });
            }
        });

        // Generate random data within sessions
        const rows: DataRow[] = [];
        let idCounter = 0;
        const intervalSeconds = intervalMinutes * 60;

        sessions.forEach(session => {
            // Generate 5-8 points per session
            const count = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                // Random time in session
                const t = Math.floor(session.start + Math.random() * (session.end - session.start));
                // Also include some boundary cases?
                
                rows.push({
                    id: idCounter++,
                    time: t,
                    timeStr: formatTime(t),
                    price: 10 + Math.random() * 5,
                    barStart: null,
                    barStartStr: ''
                });
            }
            
            // Add boundary points explicitly for demonstration
            // Start of session
            rows.push({
                id: idCounter++,
                time: session.start,
                timeStr: formatTime(session.start),
                price: 10 + Math.random() * 5,
                barStart: null,
                barStartStr: ''
            });
            // End of session (exclusive usually, but data might exist exactly at end?)
            // In example 1, 11:30:00 exists.
            rows.push({
                id: idCounter++,
                time: session.end,
                timeStr: formatTime(session.end),
                price: 10 + Math.random() * 5,
                barStart: null,
                barStartStr: ''
            });
        });

        // Sort by time
        rows.sort((a, b) => a.time - b.time);

        // Calculate dailyAlignedBar
        // Logic: X - ((X - timeOffset) % n)
        // We need to find which session (timeOffset) applies.
        // Usually dailyAlignedBar uses the closest start time <= X? 
        // Or strictly the one defined?
        // In DolphinDB, timeOffset is a vector. It likely matches the session the time belongs to.
        // For simplicity here, we find the session such that start <= t <= end (roughly).
        
        rows.forEach(row => {
            // Find applicable session start
            // If multiple starts, usually the largest start <= row.time?
            // But dailyAlignedBar logic is specific.
            // "X - ((X - timeOffset) % n)"
            // If timeOffset is a vector, it applies to the corresponding period.
            
            // Let's find the session this row belongs to.
            const session = sessions.find(s => row.time >= s.start && row.time <= s.end);
            
            if (session) {
                const offset = session.start;
                let barStart = row.time - ((row.time - offset) % intervalSeconds);
                
                // Handle mergeSessionEnd
                // If row.time is exactly session.end, and mergeSessionEnd is true
                // it should belong to the previous interval?
                // The doc says: "if the last time of a session is the start of an interval, merge it into previous interval"
                // Example: 11:30 is end of session. 11:30 is also start of [11:30, 12:30).
                // If mergeSessionEnd=true, 11:30 becomes part of [10:30, 11:30)?
                // Actually, if 11:30 is the boundary, normally it starts a new bar.
                // But if it's the end of trading, we want it in the last bar.
                
                if (mergeSessionEnd && row.time === session.end) {
                    // Check if it aligns with a bar start
                    if ((row.time - offset) % intervalSeconds === 0) {
                        barStart -= intervalSeconds;
                    }
                }

                row.barStart = barStart;
                row.barStartStr = formatTime(barStart);
            }
        });

        // Group results
        const groups: { [key: string]: { count: number, sum: number, barStart: number } } = {};
        rows.forEach(row => {
            if (row.barStart !== null) {
                const key = row.barStartStr;
                if (!groups[key]) {
                    groups[key] = { count: 0, sum: 0, barStart: row.barStart };
                }
                groups[key].count++;
                groups[key].sum += row.price;
            }
        });

        const resultRows = Object.keys(groups).sort().map(key => {
            const g = groups[key];
            return {
                barStartStr: key,
                avgPrice: g.sum / g.count,
                count: g.count,
                barStart: g.barStart
            };
        });

        return { rows, sessions, resultRows, intervalSeconds, formatTime };
    }, [sessionsStr, intervalMinutes, mergeSessionEnd]);
};
