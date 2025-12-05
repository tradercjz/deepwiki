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

// Reactive State Engine Data
// Grouped Price Data
export const RSE_DATA = [
    { time: '09:30:00', sym: 'A', price: 10.5 },
    { time: '09:30:01', sym: 'B', price: 20.2 },
    { time: '09:30:02', sym: 'A', price: 10.8 },
    { time: '09:30:03', sym: 'A', price: 11.0 },
    { time: '09:30:04', sym: 'B', price: 20.5 },
    { time: '09:30:05', sym: 'A', price: 10.9 }, // A window full (if 3)
    { time: '09:30:06', sym: 'B', price: 20.8 }, // B window full
    { time: '09:30:07', sym: 'B', price: 21.0 },
    { time: '09:30:08', sym: 'A', price: 11.2 },
    { time: '09:30:09', sym: 'B', price: 20.1 },
];

// Cross Sectional Engine Data
// Based on Example 1: perRow trigger
// Base Time: 2020.08.12T09:30:00.000
export const CSE_DATA = [
    { time: '09:30:00.123', sym: 'A', price: 10,   vol: 20 },
    { time: '09:30:00.234', sym: 'B', price: 20,   vol: 10 },
    { time: '09:30:00.456', sym: 'A', price: 10.1, vol: 20 },
    { time: '09:30:00.678', sym: 'B', price: 20.1, vol: 30 },
    { time: '09:30:00.890', sym: 'B', price: 20.2, vol: 40 },
    { time: '09:30:00.901', sym: 'A', price: 10.2, vol: 20 },
];

// ASOF Example Data
// X must be sorted
// X = 0 10 20 30 40 50 60 70 80 90 100
export const ASOF_X = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
// Y query values
export const ASOF_Y = [5, 25, 60, 200, -10];

// AggrTopN Example Data
// { sortingVal (e.g. Volume), funcVal (e.g. Price) }
export const AGGR_TOPN_DATA = [
    { id: 0, sortVal: 5,  funcVal: 10 },
    { id: 1, sortVal: 12, funcVal: 15 },
    { id: 2, sortVal: 2,  funcVal: 20 },
    { id: 3, sortVal: 8,  funcVal: 25 },
    { id: 4, sortVal: 15, funcVal: 30 },
    { id: 5, sortVal: 1,  funcVal: 5 },
    { id: 6, sortVal: 7,  funcVal: 12 },
    { id: 7, sortVal: 20, funcVal: 50 },
];

// Accumulate Example Data
export const ACCUMULATE_DATA = [1, 2, 3, 4, 5, 6];

// EachLeft/Right Example Data
export const EACH_DATA_X = [1, 2, 3, 4];
export const EACH_DATA_Y = [10, 20, 30];

// EachPre/Post Example Data
export const EACH_PRE_X = [10, 20, 30, 40, 50];

// Grouping Example Data
export const GROUPING_DATA = [
    { sym: 'IBM', val: 100 },
    { sym: 'MSFT', val: 50 },
    { sym: 'GOOG', val: 200 },
    { sym: 'IBM', val: 120 },
    { sym: 'MSFT', val: 55 },
    { sym: 'IBM', val: 110 },
    { sym: 'GOOG', val: 210 },
];

// Segmentby Example Data
export const SEGMENT_DATA = {
    x: [1, 2, 3, 0, 3, 2, 1, 4, 5],
    segment: [1, 1, 1, -1, -1, -1, 1, 1, 1]
};

// Window Example Data
export const WINDOW_DATA = [5, 4, null, -1, 2, 4];

// TWindow Example Data
// T: 2021.01.02 2021.01.02 2021.01.06 2021.03.09 2021.03.10 2021.03.12 2021.03.12
// Simplified to integers: 1, 1, 5, 9, 10, 12, 12
export const TWINDOW_T = [1, 1, 5, 9, 10, 12, 12];
export const TWINDOW_X = [-5, 5, null, -1, 2, 4, -8];

// TMoving Example Data
// T: 1, 2, 2, 2, 3, 4, 5, 6, 9, 10, 14
// X: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
export const TMOVING_T = [1, 2, 2, 2, 3, 4, 5, 6, 9, 10, 14];
export const TMOVING_X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Rolling Example Data (AAPL vs SPY)
export const ROLLING_AAPL = [0.0177, -0.0148, 0.0125, 0.0008, 0.0152, 0.0083, 0.0041, -0.0074, -0.0006, 0.0023, 0.0120, -0.0009, -0.0015, -0.0013, 0.0026, -0.0078, 0.0031, -0.0075, -0.0043, -0.0059, -0.0011, -0.0077, 0.0009];
export const ROLLING_SPY = [-0.0008, -0.0064, 0.0029, 0.0011, 0.0082, -0.0006, 0.0006, -0.0025, 0.0046, -0.0009, 0.0029, -0.0052, 0.0019, 0.0022, -0.0015, 0.0000, 0.0020, -0.0051, -0.0007, -0.0019, 0.0049, -0.0016, -0.0028];

// RowGroupby Example Data (Matrix - Transposed to Rows for processing)
// Original Columns:
// M: [32.5...], [17.5...], [17...]
// G: [1...], [2...], [1...]
export const ROWGROUPBY_M = [
    [32.5, 17.5, 17.0],
    [12.6, 25.5, 20.1],
    [22.5, 35.5, 30.0],
    [42.5, 17.3, 13.0],
    [32.6, 19.3, 19.0]
];
export const ROWGROUPBY_G = [
    [1, 2, 1],
    [2, 2, 3],
    [2, 3, 2],
    [5, 2, 3],
    [4, 1, 5]
];

export type RowGroupbyMode = 'tuple' | 'dict' | 'table';

// Cum Series Data
export const CUM_X = [1, 3, 2, 5, 4, 2];
export const CUM_Y = [2, 1, 3, 1, 2, 4]; // Weights for wsum/wavg
export const CUM_S = [5, 1, 3, 2, 4, 1]; // Sorting key for cumTopN

export type FuncType = 'msum' | 'mavg' | 'move' | 'mmax' | 'mmin' | 'mcount' | 'tmsum';
export type AccFunc = 'sum' | 'prod' | 'max';
export type PairFunc = 'sub' | 'add' | 'ratio';
export type GroupFunc = 'sum' | 'avg' | 'max' | 'count';
export type SegmentFunc = 'cumsum' | 'cummax' | 'cummin';
export type WindowFunc = 'min' | 'max' | 'avg' | 'sum';
export type CumFunc = 
  | 'cumsum' | 'cumprod' | 'cummax' | 'cummin' | 'cumavg' 
  | 'cummed' | 'cumfirstNot' | 'cumlastNot' | 'cumrank' | 'cumcount' 
  | 'cumpercentile' | 'cumstd' | 'cumstdp' | 'cumvar' | 'cumvarp' 
  | 'cumsum2' | 'cumsum3' | 'cumsum4' | 'cumnunique' | 'cumPositiveStreak'
  | 'cumbeta' | 'cumwsum' | 'cumwavg' | 'cumcovar' | 'cumcorr';

export type CumTopNFunc = 
  | 'cumsumTopN' | 'cumavgTopN' | 'cumstdTopN' | 'cumstdpTopN' 
  | 'cumvarTopN' | 'cumvarpTopN' | 'cumskewTopN' | 'cumkurtosisTopN'
  | 'cumbetaTopN' | 'cumcorrTopN' | 'cumcovarTopN' | 'cumwsumTopN';

export type AppMode = 
  | 'conditionalIterate' 
  | 'stateIterate' 
  | 'tmFunction' 
  | 'pivot' 
  | 'createTimeSeriesEngine' 
  | 'createReactiveStateEngine' 
  | 'createCrossSectionalEngine' 
  | 'asof' 
  | 'aggrTopN'
  | 'accumulate'
  | 'eachLeft'
  | 'eachRight'
  | 'eachPre'
  | 'eachPost'
  | 'groupby'
  | 'contextby'
  | 'segmentby'
  | 'window'
  | 'twindow'
  | 'tmoving'
  | 'rolling'
  | 'rowGroupby'
  | 'cum'
  | 'cumTopN';

// Default Simulation Parameters
export const DEFAULTS = {
  threshold: 5,
  funcWindow: 3,
  funcType: 'msum' as FuncType,
  tsWindowSize: 60000,
  tsStep: 60000,
  rseWindow: 3
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
  laneB: '#0099ff',  // Blue for Sym B
  laneC: '#aa00ff',  // Purple for Sym C
  sortCol: '#0099ff', // Blue for sorting col
  funcCol: '#ff9900',  // Orange for func arg col
  accCarrier: '#ff00aa', // Magenta for accumulator
  segmentKey: '#aaaaaa' // Silver for segment key
};

export const SPACING = {
  x: 2.5, // Distance between cubes
  yTime: 3.2, // Top Row (Time)
  yInput: 0.8, // Middle Row (Data)
  yOutput: -1.8, // Bottom Row (Result)
  z: 0,
  laneGap: 3.5 // Distance between Z-lanes in TS Engine
};
