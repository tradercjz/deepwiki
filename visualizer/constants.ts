
// Data Configuration matching the DolphinDB script
// val0 sequence: 1, 3, 6 repeating. Length 10.
export const DATA_INPUTS = [1, 3, 6, 1, 3, 6, 1, 3, 6, 1]; 
export const DATA_VAL1 = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
// Time vector for tm-series functions (Non-strictly increasing integers)
export const DATA_TIME = [1, 2, 3, 5, 6, 6, 9, 10, 12, 15];

// TM Series Example Data
// tmsum(1 1 3 5 8 15 15 20, 5 2 4 1 2 8 9 10, 3)
export const TM_TIMES =  [1, 1, 3, 5, 8, 15, 15, 20];
export const TM_INPUTS = [5, 2, 4, 1, 2, 8,  9,  10];

// PIVOT Example Data
// Raw records: Sym, Time, Price
export const PIVOT_DATA = [
    { sym: 'IBM',  time: '10:00', price: 100 },
    { sym: 'MSFT', time: '10:00', price: 250 },
    { sym: 'IBM',  time: '10:01', price: 102 },
    { sym: 'GOOG', time: '10:00', price: 1500 },
    { sym: 'MSFT', time: '10:01', price: 255 },
    { sym: 'GOOG', time: '10:01', price: 1510 },
    { sym: 'IBM',  time: '10:02', price: 105 },
    { sym: 'MSFT', time: '10:02', price: 260 },
    { sym: 'IBM',  time: '10:01', price: 103 }, // Late arrival update for 10:01
];

// Time Series Engine Data
// Using milliseconds from midnight for 2018.10.08
// 01:00:00 = 3,600,000 ms
export const TS_ENGINE_DATA = [
    { time: 3661785, sym: 'A', value: 10 }, // 01:01:01.785
    { time: 3662125, sym: 'B', value: 26 }, // 01:01:02.125
    { time: 3670263, sym: 'B', value: 14 }, // 01:01:10.263
    { time: 3672457, sym: 'A', value: 28 }, // 01:01:12.457
    { time: 3730789, sym: 'A', value: 15 }, // 01:02:10.789
    { time: 3732005, sym: 'B', value: 9 },  // 01:02:12.005
    { time: 3750021, sym: 'A', value: 10 }, // 01:02:30.021
    { time: 3842236, sym: 'A', value: 29 }, // 01:04:02.236
    { time: 3844412, sym: 'B', value: 32 }, // 01:04:04.412
    { time: 3845152, sym: 'B', value: 23 }, // 01:04:05.152
];

export type FuncType = 'msum' | 'mavg' | 'move' | 'mmax' | 'mmin' | 'mcount' | 'tmsum';

export type AppMode = 'conditionalIterate' | 'stateIterate' | 'tmFunction' | 'pivot' | 'createTimeSeriesEngine';

// Default Simulation Parameters
export const DEFAULTS = {
  threshold: 5,
  funcWindow: 3,
  funcType: 'msum' as FuncType,
  tsWindowSize: 60000,
  tsStep: 60000
};

// Visual Configuration
export const COLORS = {
  background: '#050505',
  primary: '#00f0ff', // Cyan (Neutral Input)
  secondary: '#ff00aa', // Magenta (Accents)
  success: '#00ff41', // Matrix Green (Output)
  gold: '#ffd700', // Gold (State)
  glass: '#ffffff',
  grid: '#1a1a1a',
  inactive: '#333333',
  condTrue: '#00ff41', // Green for True/Reset
  condFalse: '#ff3333', // Red for False/Iterate
  val1: '#ffff00', // Yellow for Val1 injection
  time: '#9933ff',   // Purple for Time
  pivotCell: '#222244', // Dark Blue for empty cells
  pivotHighlight: '#00f0ff',
  laneA: '#ff9900', // Orange for Sym A
  laneB: '#0099ff'  // Blue for Sym B
};

export const SPACING = {
  x: 2.5, // Distance between cubes
  yTime: 3.2, // Top Row (Time)
  yInput: 0.8, // Middle Row (Data)
  yOutput: -1.8, // Bottom Row (Result)
  z: 0,
  laneGap: 3.5 // Distance between Z-lanes in TS Engine
};
