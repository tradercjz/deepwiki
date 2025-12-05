import { Plugin } from './types/plugin';

import { AccumulatePlugin } from './plugins/AccumulatePlugin';
import { AggrTopNPlugin } from './plugins/AggrTopNPlugin';
import { AsofPlugin } from './plugins/AsofPlugin';
import { BarPlugin } from './plugins/BarPlugin';
import { BucketPlugin } from './plugins/BucketPlugin';
import { ConcatMatrixPlugin } from './plugins/ConcatMatrixPlugin';
import { ConditionalIteratePlugin } from './plugins/ConditionalIteratePlugin';
import { ContextbyPlugin } from './plugins/ContextbyPlugin';
import { CrossSectionalEnginePlugin } from './plugins/CrossSectionalEnginePlugin';
import { CumPlugin } from './plugins/CumPlugin';
import { CumTopNPlugin } from './plugins/CumTopNPlugin';
import { CutPointsPlugin } from './plugins/CutPointsPlugin';
import { DailyAlignedBarPlugin } from './plugins/DailyAlignedBarPlugin';
import { DigitizePlugin } from './plugins/DigitizePlugin';
import { EachLeftPlugin } from './plugins/EachLeftPlugin';
import { EachPostPlugin } from './plugins/EachPostPlugin';
import { EachPrePlugin } from './plugins/EachPrePlugin';
import { EachRightPlugin } from './plugins/EachRightPlugin';
import { FlattenPlugin } from './plugins/FlattenPlugin';
import { GroupbyPlugin } from './plugins/GroupbyPlugin';
import { GroupsPlugin } from './plugins/GroupsPlugin';
import { JoinPlugin } from './plugins/JoinPlugin';
import { JoinInPlacePlugin } from './plugins/JoinInPlacePlugin';
import { MFunctionsPlugin } from './plugins/MFunctionsPlugin';
import { MergePlugin } from './plugins/MergePlugin';
import { PivotPlugin } from './plugins/PivotPlugin';
import { ReactiveStateEnginePlugin } from './plugins/ReactiveStateEnginePlugin';
import { RegroupPlugin } from './plugins/RegroupPlugin';
import { ReshapePlugin } from './plugins/ReshapePlugin';
import { RollingPlugin } from './plugins/RollingPlugin';
import { RowFunctionsPlugin } from './plugins/RowFunctionsPlugin';
import { RowGroupbyPlugin } from './plugins/RowGroupbyPlugin';
import { SegmentPlugin } from './plugins/SegmentPlugin';
import { SegmentbyPlugin } from './plugins/SegmentbyPlugin';
import { ShufflePlugin } from './plugins/ShufflePlugin';
import { ShuffleInPlacePlugin } from './plugins/ShuffleInPlacePlugin';
import { TMovingPlugin } from './plugins/TMovingPlugin';
import { TmFunctionsPlugin } from './plugins/TmFunctionsPlugin';
import { TmSeriesPlugin } from './plugins/TmSeriesPlugin';
import { TmTopNPlugin } from './plugins/TmTopNPlugin';
import { TimeSeriesEnginePlugin } from './plugins/TimeSeriesEnginePlugin';
import { TWindowPlugin } from './plugins/TWindowPlugin';
import { UnionAllPlugin } from './plugins/UnionAllPlugin';
import { UnionPlugin } from './plugins/UnionPlugin';
import { UngroupPlugin } from './plugins/UngroupPlugin';
import { VolumeBarPlugin } from './plugins/VolumeBarPlugin';
import { WindowPlugin } from './plugins/WindowPlugin';

// 所有插件注册进 registry
export const PLUGIN_REGISTRY: Record<string, Plugin> = {
  [AccumulatePlugin.id]: AccumulatePlugin,
  [AggrTopNPlugin.id]: AggrTopNPlugin,
  [AsofPlugin.id]: AsofPlugin,
  [BarPlugin.id]: BarPlugin,
  [BucketPlugin.id]: BucketPlugin,
  [ConcatMatrixPlugin.id]: ConcatMatrixPlugin,
  [ConditionalIteratePlugin.id]: ConditionalIteratePlugin,
  [ContextbyPlugin.id]: ContextbyPlugin,
  [CrossSectionalEnginePlugin.id]: CrossSectionalEnginePlugin,
  [CumPlugin.id]: CumPlugin,
  [CumTopNPlugin.id]: CumTopNPlugin,
  [CutPointsPlugin.id]: CutPointsPlugin,
  [DailyAlignedBarPlugin.id]: DailyAlignedBarPlugin,
  [DigitizePlugin.id]: DigitizePlugin,
  [EachLeftPlugin.id]: EachLeftPlugin,
  [EachPostPlugin.id]: EachPostPlugin,
  [EachPrePlugin.id]: EachPrePlugin,
  [EachRightPlugin.id]: EachRightPlugin,
  [FlattenPlugin.id]: FlattenPlugin,
  [GroupbyPlugin.id]: GroupbyPlugin,
  [GroupsPlugin.id]: GroupsPlugin,
  [JoinPlugin.id]: JoinPlugin,
  [JoinInPlacePlugin.id]: JoinInPlacePlugin,
  [MFunctionsPlugin.id]: MFunctionsPlugin,
  [MergePlugin.id]: MergePlugin,
  [PivotPlugin.id]: PivotPlugin,
  [ReactiveStateEnginePlugin.id]: ReactiveStateEnginePlugin,
  [RegroupPlugin.id]: RegroupPlugin,
  [ReshapePlugin.id]: ReshapePlugin,
  [RollingPlugin.id]: RollingPlugin,
  [RowFunctionsPlugin.id]: RowFunctionsPlugin,
  [RowGroupbyPlugin.id]: RowGroupbyPlugin,
  [SegmentPlugin.id]: SegmentPlugin,
  [SegmentbyPlugin.id]: SegmentbyPlugin,
  [ShufflePlugin.id]: ShufflePlugin,
  [ShuffleInPlacePlugin.id]: ShuffleInPlacePlugin,
  [TMovingPlugin.id]: TMovingPlugin,
  [TmFunctionsPlugin.id]: TmFunctionsPlugin,
  [TmSeriesPlugin.id]: TmSeriesPlugin,
  [TmTopNPlugin.id]: TmTopNPlugin,
  [TimeSeriesEnginePlugin.id]: TimeSeriesEnginePlugin,
  [TWindowPlugin.id]: TWindowPlugin,
  [UnionAllPlugin.id]: UnionAllPlugin,
  [UnionPlugin.id]: UnionPlugin,
  [UngroupPlugin.id]: UngroupPlugin,
  [VolumeBarPlugin.id]: VolumeBarPlugin,
  [WindowPlugin.id]: WindowPlugin,
};

export const getPlugin = (id: string): Plugin | undefined => {
  return PLUGIN_REGISTRY[id];
};
