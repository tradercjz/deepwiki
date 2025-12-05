import { registry as PluginRegistry } from '../lib/PluginRegistry';
import { AccumulatePlugin } from './AccumulatePlugin';
import { ConditionalIteratePlugin } from './ConditionalIteratePlugin';
import { TmSeriesPlugin } from './TmSeriesPlugin';
import { PivotPlugin } from './PivotPlugin';
import { TimeSeriesEnginePlugin } from './TimeSeriesEnginePlugin';
import { ReactiveStateEnginePlugin } from './ReactiveStateEnginePlugin';
import { CrossSectionalEnginePlugin } from './CrossSectionalEnginePlugin';
import { AsofPlugin } from './AsofPlugin';
import { AggrTopNPlugin } from './AggrTopNPlugin';
import { EachLeftPlugin } from './EachLeftPlugin';
import { EachRightPlugin } from './EachRightPlugin';
import { EachPrePlugin } from './EachPrePlugin';
import { EachPostPlugin } from './EachPostPlugin';
import { GroupbyPlugin } from './GroupbyPlugin';
import { ContextbyPlugin } from './ContextbyPlugin';
import { SegmentbyPlugin } from './SegmentbyPlugin';
import { WindowPlugin } from './WindowPlugin';
import { TWindowPlugin } from './TWindowPlugin';
import { TMovingPlugin } from './TMovingPlugin';
import { RollingPlugin } from './RollingPlugin';
import { RowGroupbyPlugin } from './RowGroupbyPlugin';
import { CumPlugin } from './CumPlugin';
import { CumTopNPlugin } from './CumTopNPlugin';
import { MFunctionsPlugin } from './MFunctionsPlugin';
import { TmFunctionsPlugin } from './TmFunctionsPlugin';
import { TmTopNPlugin } from './TmTopNPlugin';
import { RowFunctionsPlugin } from './RowFunctionsPlugin';
import { BarPlugin } from './BarPlugin';
import { BucketPlugin } from './BucketPlugin';
import { CutPointsPlugin } from './CutPointsPlugin';
import { DailyAlignedBarPlugin } from './DailyAlignedBarPlugin';
import { DigitizePlugin } from './DigitizePlugin';
import { GroupsPlugin } from './GroupsPlugin';
import { SegmentPlugin } from './SegmentPlugin';
import { VolumeBarPlugin } from './VolumeBarPlugin';
import { FlattenPlugin } from './FlattenPlugin';
import { RegroupPlugin } from './RegroupPlugin';
import { ReshapePlugin } from './ReshapePlugin';
import { ShufflePlugin } from './ShufflePlugin';
import { ShuffleInPlacePlugin } from './ShuffleInPlacePlugin';
import { UngroupPlugin } from './UngroupPlugin';
import { ConcatMatrixPlugin } from './ConcatMatrixPlugin';
import { JoinPlugin } from './JoinPlugin';
import { JoinInPlacePlugin } from './JoinInPlacePlugin';
import { MergePlugin } from './MergePlugin';
import { UnionPlugin } from './UnionPlugin';
import { UnionAllPlugin } from './UnionAllPlugin';

export const plugins = [
  UnionAllPlugin,
  UnionPlugin,
  MergePlugin,
  JoinInPlacePlugin,
  JoinPlugin,
  ConcatMatrixPlugin,
  UngroupPlugin,
  ShuffleInPlacePlugin,
  ShufflePlugin,
  ReshapePlugin,
  RegroupPlugin,
  FlattenPlugin,
  VolumeBarPlugin,
  SegmentPlugin,
  GroupsPlugin,
  DigitizePlugin,
  DailyAlignedBarPlugin,
  CutPointsPlugin,
  BucketPlugin,
  BarPlugin,
  AccumulatePlugin,
  ConditionalIteratePlugin,
  TmSeriesPlugin,
  PivotPlugin,
  TimeSeriesEnginePlugin,
  ReactiveStateEnginePlugin,
  CrossSectionalEnginePlugin,
  AsofPlugin,
  AggrTopNPlugin,
  EachLeftPlugin,
  EachRightPlugin,
  EachPrePlugin,
  EachPostPlugin,
  GroupbyPlugin,
  ContextbyPlugin,
  SegmentbyPlugin,
  WindowPlugin,
  TWindowPlugin,
  TMovingPlugin,
  RollingPlugin,
  RowGroupbyPlugin,
  CumPlugin,
  CumTopNPlugin,
  MFunctionsPlugin,
  TmFunctionsPlugin,
  TmTopNPlugin,
  RowFunctionsPlugin
];

export const registerPlugins = () => {
  plugins.forEach(plugin => {
    PluginRegistry.register(plugin);
  });
};
