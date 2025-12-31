import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Trail } from '@react-three/drei';
import * as THREE from 'three';
import {
  WordFlowMatcher,
  LaneParams,
  MatchResult,
  WordInstance
} from './WordFlowLogic';

// Configuration
const LANES_COUNT = 7;
const WORD_SPACING = 600;
const Y_STEP = 160;

// Standard Monospace Font for perfect alignment
const CODE_FONT = 'https://cdn.dolphindb.cn/fonts/JetBrainsMono-Regular.ttf';
const FONT_SIZE = 46;
const CHAR_WIDTH = FONT_SIZE * 0.6; // 27.6px for standard 0.6 aspect ratio

// Functions List
export const _ALL_FUNCTIONS: string[] = [
  "rowiminlast", "randomForestClassifier", "revokeStreamingSQLTable", "renameTable",
  "resubmitStreamGraph", "rowNext", "rowImin", "randF", "rowNames", "rowRank",
  "restoreDislocatedTablet", "rowMax", "rowimaxlast", "rowVarp", "rowWavg",
  "remoteruncompatible", "resumeTimerEngine", "resetDfsRecoveryConcurrency", "revoke",
  "rowCumsum", "rowWsum", "randomForestRegressor", "rand", "resetPwd",
  "remoteRunWithCompression", "revokeStreamingSQL", "removenode", "replaceColumn_",
  "round", "rollingPanel", "replay", "removeipblacklist", "rowProd", "randPoisson",
  "repeat", "rpc", "rowSum2", "rowKurtosis", "restoreTable", "rowMove", "randBinomial",
  "regexCount", "removeTail_", "restore", "readRecord_", "repartitionDS", "renameSchema",
  "rank", "restoreDB", "removeHead_", "replace", "randWeibull", "reciprocal", "rdp",
  "rpad", "recursiveSplitText", "resetDfsRebalanceConcurrency", "removeTopicOffset",
  "rowDenseRank", "ratios", "readLines_", "rowCummin", "rowStd", "resetRecoveryWorkerNum",
  "rows", "rename_", "rowStdp", "rshift", "rms", "row", "ridge", "rowCount", "rowCumprod",
  "rowNo", "registerStreamingSQL", "randGamma", "rowSize", "rowMin", "replayDS", "rowAt",
  "resumeRecovery", "rowVar", "rad2deg", "rowCumwsum", "readLines", "rowgmd5",
  "rebalanceChunksAmongDataNodes", "regexReplace", "resetDBDirMeta", "resample", "residual",
  "rowImax", "rowTanimoto", "regexFind", "rowOr", "rowAlign", "rowPrev", "readLine",
  "readObject", "refCount", "randMultivariateNormal", "reorderColumns_", "rowCovar",
  "removeipwhitelist", "randStudent", "renameCatalogName", "randUniform", "repmat",
  "rebalanceChunksWithinDataNode", "run", "rotatetdekey", "ratio", "rowBeta", "rowXor",
  "rowSum", "rowDot", "regexfindstr", "rowSkew", "rmdir", "right", "readBytes",
  "ridgeBasic", "randBeta", "randChiSquare", "randNormal", "rm", "replace_", "randDiscrete",
  "read_", "ridgeCV", "rtrim", "randExp", "restoresettings", "remoteRun", "renameCatalog",
  "reverse", "runsql", "rowEuclidean", "randLogistic", "rowCorr", "regroup", "runScript",
  "rowAvg", "rowAnd", "reshape", "rowCummax", "unifiedExpr", "unionAll", "unpack",
  "unsubscribeTable", "undef", "updateRule", "uuid", "updateMCPTool", "update_", "union",
  "updateLicense", "updatepkeydeletebitmap", "updateOrderBookEngineParams", "unlockUser",
  "updateMCPPrompt", "useOrcaStreamTable", "unpivot", "upsert_", "unsubscribeStreamingSQL",
  "updateMarketHoliday", "ungroup", "unloadVocab", "useOrcaStreamEngine", "upper",
  "isMonotonic", "isTitle", "initimoltpcheckpointencryption", "interpolate", "isValley",
  "imtForceGCRedolog", "invWeibull", "iif", "isChunkNodeInit", "isortTop", "ifirstHit",
  "ifNull", "isort_", "instrumentPricer", "ipaddr", "isSpace", "isMonthEnd", "isort",
  "isMonthStart", "installPlugin", "imaxlast", "isYearStart", "int", "invPoisson",
  "isAlpha", "imin", "irSingleCurrencyCurveBuilder", "isYearEnd", "iminlast", "isNanInf",
  "ifirstNot", "isclientauth", "isLoggedIn", "invChiSquare", "irs", "isAlNum", "ilike",
  "isPeak", "inverse", "isLower", "intersection", "int128", "invLogistic", "initcap",
  "isQuarterEnd", "isDuplicated", "irFixedFloatingSwapPricer", "isColumnarTuple", "iterate",
  "irCrossCurrencyCurveBuilder", "indexedSeries", "irDepositPricer", "imr",
  "isMonotonicDecreasing", "invGamma", "indexedTable", "isDigit", "isDataNodeInitialized",
  "isIndexedMatrix", "invExp", "isSorted", "isUpper", "isOrderedDict", "isQuarterStart",
  "isNull", "isVoid", "isNothing", "imtUpdateChunkVersionOnDataNode", "isIndexedSeries",
  "in", "invStudent", "imax", "invUniform", "isMonotonicIncreasing", "invBinomial",
  "isNumeric", "ifValid", "isControllerInitialized", "isValid", "invNormal", "isLeapYear",
  "integral", "ilastNot", "invF", "invBeta", "nextState", "nss", "notin", "nullIf",
  "neville", "not", "nullFill", "next", "notbetween", "nullFill_", "neg", "ne",
  "nanotimestamp", "nsspredict", "nanosecond", "notlike", "nunique", "ns", "now",
  "nanotime", "normal", "nanInfFill", "norm", "getTablesByCluster", "gaussianNB",
  "getTSDBSortKeyEntry", "getControllerAlias", "getmemlimitofalltempresults",
  "getComputeNodeCacheDetails", "getcurrenttdekeyversion", "getUserPasswordStatus",
  "genoutputcolumnsforobsnapshotengine", "getauthenticateduserticket", "getMemLimitOfQueryResult",
  "getMCPPrompt", "gppredict", "getTablesOfAllClusters", "getStreamEngineStat",
  "getRaftLearnersStatus", "getUdfEngineVariable", "getDfsRebalanceConcurrency",
  "getLicenseExpiration", "getCurrentSessionAndUser", "getpkeycompactiontaskstatus",
  "gmtime", "gettsdbtableindexcachestatus", "getLocalIOTDBStaticTable", "getSessionMemoryStat",
  "getConfigure", "getUsersByGroupId", "getClusterChunksStatus", "getcomputenodecachewarmupjobstatus",
  "grant", "getOS", "getRecentJobs", "getDFSDatabases", "getreactivemetrics",
  "getAggregatorStat", "getDatabasesByCluster", "getGroupsByUserId",
  "getOrcaStateMachineEventTaskStatus", "getTopicProcessedOffset", "getcomputenodecachestat",
  "getDatabaseClusterReplicationStatus", "gettableaccess", "getcomputegroupchunksstatus",
  "getEnv", "getaclauditlog", "gaussiankde", "getipwhitelist", "getclustertdekeys",
  "getOLAPCacheEngineSize", "getpkeymetadata", "getClusterStatus", "getActiveMaster",
  "getGroupAccess", "getPerf", "getdfsdatabasebyowner", "getJobMessage", "getJobStatus",
  "getStreamEngine", "genericTStateIterate", "getStreamingSQLStatus", "getMemoryStat",
  "getCompletedQueries", "getChunksMeta", "getNodeAlias", "getStreamingRaftGroups",
  "getAllDBGranularity", "getJobReturn", "getRedoLogGCStat", "getMasterReplicationStatus",
  "getOrcaStreamEngineMeta", "getSchemasByCluster", "gaussiankdepredict", "getIPConnectionLimit",
  "getTables", "getDBAccess", "getAggregator", "getOrcaCheckpointConfig", "getQueryStatus",
  "getUserTableAccessRecords", "garch", "ge", "getClusterPerf", "getOrcaCheckpointJobInfo",
  "getUserListOfAllClusters", "gema", "getcomputenodecachingdelay", "geowithin",
  "getstreamtables", "getBackupList", "getUserList", "getRawScriptLog", "getRunningQueries",
  "genShortGenomeSeq", "getUserLockedStatus", "getUserHardwareUsage", "getClusterDFSDatabases",
  "getLeftStream", "gpfit", "getdynamicconfig", "getRaftElectionTick", "getDatanodeRestartInterval",
  "getAllDBs", "getslavereplicationqueuestatus", "getSchemaByCatalog", "getSystemCpuUsage",
  "getGroupAccessByCluster", "getBackupStatus", "getNodePort", "getOrcaCheckpointSubjobInfo",
  "getHomeDir", "gettsdbdatastat", "getTableSchemaByCluster", "getstreamenginelist",
  "getMarketCalendar", "getCacheEngineStat", "getStreamingStat", "getCachedSymbolBaseMemSize",
  "getWorkDir", "getSupportBundle", "getJobStat", "getauditlog", "getCacheEngineMemSize",
  "getsessionexpiredtime", "getOrcaStreamTaskSubscriptionMeta", "getipblacklist",
  "getAllCatalogs", "getAllClusters", "getTSDBMetaData", "getTSDBCachedSymbolBaseMemSize",
  "getTablet", "getPersistenceMeta", "getrules", "getOSBit", "getOLAPCachedSymbolBaseMemSize",
  "getUserAccess", "getScheduledJobs", "getSystemLoadAvg", "gmm", "getMemLimitOfTaskGroupResult",
  "getenablenullsafejoin", "getTransactionStatus", "getAuthenticatedUsers", "getStreamingLeader",
  "glm", "getBackupMeta", "gettradingcalendartype", "getDiskIOStat", "getRecoveryTaskStatus",
  "getClusterVolumeUsage", "getOrcaStreamTableMeta", "getTSDBCacheEngineSize", "getOrcaDataLineage",
  "getRightStream", "gmd5", "getSlaveReplicationStatus", "getCurrentCatalog",
  "getSubscriptionTopic", "getUserAccessByCluster", "getNodeHost", "getprefetchcomputenodedata",
  "getTSDBCompactionTaskStatus", "getConfig", "gram", "getGroupListOfAllClusters",
  "getTabletsMeta", "getDFSTablesByDatabase", "getRecoveryWorkerNum", "gramSchmidt",
  "getExecDir", "groups", "getloadedplugins", "getTableAccessByCluster", "getSnapshotMsgId",
  "getslavereplicationexecutionstatus", "getDfsRecoveryConcurrency", "getOLAPCacheEngineStat",
  "getGroupList", "getFunctionViews", "getRecentSlaveReplicationInfo", "getLevelFileIndexCacheStats",
  "getConnections", "generateuserticket", "getMachineFingerprint", "getStreamTableFilterColumn",
  "getControllerElectionTick", "getChunkPath", "genericStateIterate", "gt",
  "getClusterDFSTables", "getstreamtablecacheoffset", "getCatalogsByCluster", "getNodeType",
  "getUnresolvedTxn", "getConsoleJobs", "zscore", "zTest", "zigzag", "tmstdp", "trueRange",
  "temporalDeltas", "take", "tmlowrange", "tmovingWindowData", "triggerPKEYCompaction",
  "textChunkDS", "tokenizeBert", "triggerTSDBCompaction", "tmvarpTopN", "tmcovar", "tmlast",
  "tensor", "tmvar", "transpose", "tmmin", "today", "tmove", "tmstdTopN", "tmprod",
  "tokenize", "tmavg", "tmsum2", "tmwsumTopN", "temporalDiff", "tmcovarTopN", "toJson", "t3",
  "tmwsum", "temporalSeq", "temporalParse", "tmrank", "transDS_", "tmvarp", "topRange",
  "tmwavg", "table", "tmskewTopN", "tmsum", "timestamp", "tmcorr", "tmpercentile", "tmmed",
  "tTest", "tanh", "temporalAdd", "tmsumTopN", "tmtoprange", "transFreq", "tmfirst", "tema",
  "time", "tmmax", "tmvarTopN", "tableUpsert", "temporalFormat", "tmkurtosisTopN", "tmskew",
  "triggerNodeReport", "tail", "tmstdpTopN", "typestr", "truncate", "toArray", "tanimoto",
  "trima", "tmavgTopN", "tupleSum", "tmbeta", "tmstd", "triggercheckpointforimoltp", "triu",
  "tmcorrTopN", "test", "trim", "toStdJson", "type", "tmkurtosis", "tableInsert", "til",
  "talibNull", "tril", "toCharArray", "tmbetaTopN", "treasuryconversionfactor", "tmcount",
  "tan", "toUTF8", "sma", "sub", "splrep", "setReservedMemSize", "setStreamTableFilterColumn",
  "stat", "symbolCode", "scramClientFinal", "share", "sleep", "setLogLevel", "shape",
  "splev", "startClusterReplication", "StreamGraph_setLocalConfigOnce", "syntax",
  "setChunkLastUpdateTime", "semiannualEnd", "saveDualPartition", "scheduleJob",
  "StreamGraph_latestKeyedSource", "setCacheEngineMemSize", "setMemLimitOfTempResult",
  "setMaxMemSize", "setsessionexpiredtime", "setprefetchcomputenodedata", "startDataNode",
  "setIndexedMatrix_", "settablecomment", "sessionWindow", "stdp", "setTableSensitiveColumn",
  "shuffle", "split", "subtuple", "setAtomicLevel", "setMemLimitOfQueryResult", "saveText",
  "semiannualBegin", "saveModel", "summary", "stopTimerEngine", "setTSDBCacheEngineSize",
  "setMaxJobPriority", "sem", "setIndexedSeries_", "submitJob", "suspendRecovery",
  "streamFilter", "strlenu", "setRaftElectionTick", "setColumnarTuple_", "setTimeoutTick",
  "sum3", "schema", "seq", "sin", "saveDatabase", "stl", "seek", "StreamGraph_source",
  "semiMonthEnd", "saveTextFile", "subscribeStreamingSQL", "square", "StreamGraph_sourceByName",
  "sum", "sum2", "string", "setmemlimitofalltempresults", "setMaxTransactionSize", "sql",
  "segment", "sqlDS", "sqlTuple", "strip", "setMaxJobParallelism", "startheapsample", "solve",
  "spearmanr", "sqlColAlias", "substru", "sinh", "setOrcaCheckpointConfig", "set",
  "streamTable", "schur", "secondOfMinute", "short", "seasonalEsd", "saveTable", "sinppet",
  "stretch", "syncDict", "searchK", "scramClientFirst", "startsWith", "setcomputenodecachingdelay",
  "setDatabaseForClusterReplication", "streamEngineParser", "sortBy_", "signbit",
  "sqlDelete", "setgpfitnessfunc", "symmetricDifference", "setDatanodeRestartInterval",
  "stopDataNode", "sqlUpdate", "sqrt", "StreamGraph_toGraphviz", "setSystem", "slice",
  "setIPConnectionLimit", "skew", "setstreamtabletimestamp", "StreamGraph_haSource",
  "StreamGraph_keyedSource", "signum", "setMemLimitOfTaskGroupResult", "sum4", "scs",
  "StreamGraph_submit", "saveAsNpy", "setMaxBlockSizeForReservedMemory", "spline",
  "skipClusterReplicationTask", "shapiroTest", "stringFormat", "strlen", "setOLAPCacheEngineSize",
  "setColumnComment", "sliceByKey", "setDefaultCatalog", "sqlCol", "symbol", "setRetentionPolicy",
  "sumbars", "std", "StreamGraph_name", "submitJobEx2", "size", "svd", "StreamGraph_setConfigMap",
  "StreamGraph_str", "socp", "submitJobEx", "stopStreamGraph", "substr", "shuffle_",
  "setdatabaseclusterreplicationexecutionset", "subscribeTable", "sort", "StreamGraph_dropGraph",
  "setdynamicconfig", "setRandomSeed", "setMaxConnections", "stateIterate", "savePartition",
  "semiMonthBegin", "sort_", "stopheapsample", "stopClusterReplication", "second",
  "saveModule", "strReplace", "startStreamGraph", "StreamGraph_updateRule", "shell",
  "StreamGraph_deleteRule", "stateMavg", "StreamGraph_haKeyedSource", "subarray", "strpos",
  "addMCPTool", "attributenames", "appendTupel_", "adaBoostRegressor", "addRangePartitions",
  "adaBoostClassifier", "append!", "addipblacklist", "appendOrcaStreamTable", "arrayVector",
  "atanh", "acos", "atan", "addValuePartitions", "avg", "and", "asof", "addreactivemetrics",
  "addMarketHoliday", "arima", "asfreq1", "addFunctionView", "addAccessControl", "addColumn",
  "array", "atImax", "any", "acf", "appendforprediction", "add", "align", "anova",
  "addgpfunction", "appendMsg", "addGroupMember", "addipwhitelist", "acosh", "addMCPPrompt",
  "asinh", "addMetrics", "addNode", "asIs", "abs", "amortizingfixedratebonddirtyprice",
  "addVolumes", "at", "all", "asFreq", "attributevalues", "asin", "autocorr", "atImin",
  "adfuller", "appendForJoin", "flushcomputenodememcache", "find", "firstNot", "fromUTF8",
  "flip", "fminslsqp", "first", "form", "file", "fixedLengthArrayVector", "fflush",
  "firstHit", "flushOLAPCache", "flushpkeycache", "flushTSDBCache", "fy5253Quarter",
  "flatten", "ffill", "fy5253", "fminlbfgsb", "fminbfgs", "ffill_",
  "forceTriggerOrderBookSnapshot", "fromJson", "files", "floatingratebonddirtyprice",
  "floor", "fxEuropeanOptionPricer", "format", "fill_", "fxSwapPricer", "fxForwardPricer",
  "fTest", "fxVolatilitySurfaceBuilder", "fminncg", "fmin", "funcByName", "fromStdJson",
  "olsEx", "osqp", "objectChecksum", "objByName", "oauthlogin", "objectComponent", "objs",
  "objectType", "optionVolPredict", "or", "ols", "oneHot", "head", "hour", "hashBucket",
  "hex", "hourOfDay", "haStreamTable", "highlong", "hmac", "highDouble", "histogram2d",
  "hasNull", "funcs_by_topics", "getStreamGraphMeta", "getStreamGraphInfo",
  "purgeStreamGraphRecords", "eachRight", "aggrTopN", "loop", "nullCompare", "contextby",
  "ploop", "tmoving", "twindow", "unifiedCall", "segmentby", "eachPre", "pcall", "ho_funcs",
  "groupby", "pivot", "composition", "talib", "call", "moving", "rowgroupby", "reduce",
  "pcross", "window", "peach", "each", "cross", "byColumn", "eachPost", "rolling",
  "withNullFill", "eachLeft", "byRow", "accumulate", "appendix", "funcs_intro", "monthEnd",
  "monthOfYear", "microsecond", "mvarpTopN", "minute", "millisecond", "moveReplicas",
  "mvarTopN", "mimax", "mavg", "matchunorderedspan", "makeUnifiedCall", "move", "mul",
  "msumTopN", "msum", "mkdir", "mean", "min", "mode", "milastNot", "mbeta", "mslr",
  "mlowrange", "mifirstNot", "mem", "mfirst", "matchphraseprefix", "monthBegin", "migrate",
  "mod", "mlastnot", "mskew", "mcount", "matchphraseinfix", "mskewTopN", "makeCall", "md5",
  "mmaxPositiveStreak", "makeSortedKey", "month", "mcorr", "mavgTopN", "matchsuffix", "mmin",
  "mwsumTopN", "mvar", "matchany", "movingTopNIndex", "mvccTable", "moveChunksAcrossVolume",
  "multiTableRepartitionDS", "matchspan", "minuteOfHour", "manova", "mrank", "miminlast",
  "mcovar", "matchFuzzy", "mvarp", "mstd", "mwavg", "mdd", "mannWhitneyUTest", "mimin",
  "membermodify", "ma", "mimaxlast", "mstdpTopN", "matchphrasesuffix", "med", "mad",
  "movingWindowData", "mask", "mpercentiletopn", "matrix", "matchprefixsuffix", "mprod",
  "movingWindowIndex", "msum2", "mtoprange", "merge", "mwsum", "matchprefix", "mkurtosisTopN",
  "max", "matchphrase", "mcovarTopN", "mlast", "mkurtosis", "mbetaTopN", "matchall",
  "maxdrawdown", "memSize", "member", "mfirstnot", "multinomialNB", "maxPositiveStreak",
  "moveHotDataToColdVolume", "mmed", "mstdp", "mmse", "mmad", "mr", "mstdTopN", "matrixRank",
  "maxignorenull", "makeKey", "minignorenull", "mmax", "mcorrTopN", "mpercentile", "mutualInfo",
  "jsonextract", "join!", "join", "createPartitionedTable", "col", "clear_", "cj",
  "cancelConsoleJob", "compress", "cumstdp", "convertiblefixedratebonddirtyprice",
  "cdfGamma", "createAsofJoinEngine", "callableFixedRateBondDirtyPrice", "createTimeSeriesEngine",
  "clearCachedModules", "createTimeSeriesAggregator", "contextSum2", "clearalliotdbstatictablecache",
  "createOrderReconstituteEngine", "cumstdpTopN", "conditionalIterate", "chiSquareTest",
  "cachedTable", "curvePredict", "createcryptoorderbookengine", "createthresholdengine",
  "cds", "createWindowJoinEngine", "createStreamGraph", "cdfKolmogorov", "cdfStudent", "cummin",
  "createOrcaStreamTable", "clip_", "cdfUniform", "createSessionWindowEngine",
  "createCrossSectionalEngine", "createAnomalyDetectionEngine", "cumvar", "cdfBinomial",
  "cdfChiSquare", "cumPositiveStreak", "concatMatrix", "crmwcbond", "cdfExp", "cdfNormal",
  "cacheDS_", "cancelJob", "cumprod", "cbrt", "cumsum2", "complex", "cacheDSNow",
  "createDualOwnershipReactiveStateEngine", "cumfirstNot", "createtimebucketengine", "cdfF",
  "cleanOutdateLogFiles", "cumbetaTopN", "clearCachedDatabase", "cumwsum", "cumcovar", "cumavg",
  "clearTablePersistence", "cols", "cdfZipf", "clearalltsdbsymbolbasecache",
  "createCrossSectionalAggregator", "crossStat", "createIMOLTPTable", "count",
  "createReactiveStatelessEngine", "createOrcaHaKeyedStreamTable", "createyieldcurveengine",
  "createStreamDispatchEngine", "createSchema", "cumsum", "createLookupJoinEngine", "cumvarp",
  "createnarrowreactivestateengine", "cumwavg", "convertExcelFormula", "createNearestJoinEngine",
  "cumstdTopN", "cumrank", "createdeviceengine", "createpricingengine", "createOrcaHaStreamTable",
  "contextCount", "charAt", "copyReplicas", "cumsum3", "cells", "clip", "cumcorrTopN",
  "cumpercentile", "conditionalFilter", "cosh", "convertTZ", "createDailyTimeSeriesEngine",
  "constantdesc", "cumvarpTopN", "cumvarTopN", "cumcount", "close", "changePwd", "cubicspline",
  "cumsum4", "convertEncode", "cumcorr", "cvar", "covar", "concat",
  "createDistributedInMemoryTable", "createTable", "createCatalog", "cummdd", "compose",
  "createOrcaKeyedStreamTable", "cummed", "cdfLogistic", "contextSum", "creategplearnengine",
  "cumnunique", "cdfPoisson", "cumsumTopN", "corr", "clearDSCacheNow", "clearalliotdblatestkeycache",
  "corrMatrix", "createorderbooksnapshotengine", "cancelpkeycompactiontask", "clearcomputenodecache",
  "createReactiveStateEngine", "createstreambroadcastengine", "createRuleEngine", "cummax",
  "createOrcaLatestKeyedStreamTable", "cumdenseRank", "cast", "cutPoints", "cubicsplinepredic",
  "clearAllCache", "copy", "covarMatrix", "cumcovarTopN", "cumbeta", "cholesky", "cdfWeibull",
  "cumstd", "cdfBeta", "callMCPTool", "cumskewTopN", "createEqualJoinEngine", "ceil",
  "createsnapshotjoinengine", "cubichermitesplinefit", "cancelRecoveryTask", "cumlastNot",
  "createUser", "createGroup", "coint", "coevent", "clearDSCache_", "createLeftSemiJoinEngine",
  "countNanInf", "createIPCInMemoryTable", "cell", "closeSessions", "clearcomputenodediskcache",
  "cumkurtosisTopN", "checkBackup", "cumwsumTopN", "cumavgTopN", "concatDateTime", "cut",
  "createEquiJoinEngine", "cancelRebalanceTask", "char", "columnNames", "cos", "crc32",
  "createdimensiontable", "dropSchema", "DStream_reactiveStateEngine", "disableTablePersistence",
  "DStream_dailyTimeSeriesEngine", "DStream_keyedBuffer", "diag", "dropFunctionView",
  "DStream_timeSeriesEngine", "decimal32", "DStream_orderBookSnapshotEngine",
  "DStream_setEngineName", "DStream_haKeyedBuffer", "dropCatalog", "DStream_nearestJoinEngine",
  "DStream_windowJoinEngine", "DStream_map", "dynamicGroupCumcount", "datetimeParse", "dema",
  "deny", "DStream_keyedSink", "disableQueryMonitor", "DStream_equalJoinEngine",
  "DStream_latestKeyedSink", "dropStreamEngine", "DStream_asofJoinEngine",
  "DStream_snapshotJoinEngine", "DStream_timeBucketEngine", "deg2rad", "dynamicGroupCumsum",
  "date", "deleteRule", "disableresourcetracking", "daysInMonth", "DStream_cryptoOrderBookEngine",
  "dropStreamGraph", "DStream_ruleEngine", "dropDatabase", "drop", "declareStreamingSQLTable",
  "DStream_dualOwnershipReactiveStateEngine", "DStream_lookupJoinEngine", "derivative", "dot",
  "double", "deleteGroup", "DStream_crossSectionalEngine", "dict", "DStream_anomalyDetectionEngine",
  "defined", "dayOfWeek", "disableActivePartition", "dictUpdate_", "DStream_leftSemiJoinEngine",
  "dropOrcaStreamTable", "datetime", "DStream_haBuffer", "deltas", "deleteScheduledJob",
  "digitize", "DStream_buffer", "dropIPCInMemoryTable", "decompress", "dropDistributedInMemoryTable",
  "decimal128", "decimalFormat", "DStream_fork", "dropTable", "DStream_sessionWindowEngine",
  "decodeShortGenomeSeq", "deleteReplicas", "dayOfMonth", "dayOfYear", "difference", "div",
  "demean", "dropColumns_", "dailyAlignedBar", "deleteGroupMember", "deepCopy", "DStream_pricingEngine",
  "dropna", "dividedDifference", "deleteMarketHoliday", "dropMCPTool", "det", "defs",
  "deletechunkmetaonmasterbyid", "distinct", "dropStreamTable", "dropPartition", "deleteUser",
  "dumpheapsample", "DStream_sync", "dropAggregator", "distance", "DStream_haSink", "denseRank",
  "datehour", "DStream_getOutputSchema", "decimalMultiply", "decimal64", "DStream_parallelize",
  "DStream_narrowReactiveStateEngine", "DStream_sink", "DStream_reactiveStatelessEngine",
  "differentialevolution", "DStream_latestKeyedBuffer", "duration", "disableTSDBAsyncSorting",
  "dropMCPPrompt", "DStream_udfEngine", "database", "DStream_haKeyedSink", "DStream_timerEngine",
  "valueChanged", "vectorar", "var", "varp", "var_0", "vectornorm", "version", "values",
  "volumeBar", "vanillaoption", "varma", "quarterOfYear", "qr", "qclp", "quantileSeries",
  "quarterBegin", "quantile", "quarterEnd", "quadprog", "xor", "xdb", "eig",
  "existsSubscriptionTopic", "extractTextSchema", "expm1", "enableTablePersistence", "ewmMean",
  "enabletablecachepurge", "esd", "endsWith", "enabletableshareandcachepurge", "elasticNetCV",
  "existsDatabase", "exp2", "eqpercent", "ewmCov", "enableTableShareAndPersistence", "exp",
  "expr", "ewmStd", "euclidean", "enableresourcetracking", "existsTable", "encodeShortGenomeSeq",
  "extractMktData", "eval", "ewmCorr", "elasticNet", "erase_", "exists", "enableActivePartition",
  "eqFloat", "existsStreamTable", "ewmVar", "eqObj", "enabletdekey", "existsCatalog",
  "existsPartition", "enlist", "eq", "evalTimer", "elasticNetBasic", "enableQueryMonitor",
  "enableTSDBAsyncSorting", "extractInstrument", "ema", "eye", "businessYearEnd", "bondCalculator",
  "between", "bvls", "bitOr", "bar", "bitAnd", "bondCashflow", "bigarray", "bondDirtyPrice",
  "bondFuturesPricer", "backupTable", "binaryExpr", "blob", "base64Encode", "backupsettings",
  "bitXor", "boxcox", "businessMonthBegin", "bitNot", "bondaccrint", "backupDB", "bfill_",
  "bucket", "businessDay", "bondyield", "businessQuarterBegin", "bondDuration", "backup",
  "brute", "businessMonthEnd", "bondYieldCurveBuilder", "base64Decode", "binsrch", "brentq",
  "bondPricer", "bool", "beta", "bucketCount", "bondconvexity", "businessYearBegin", "bfill",
  "businessQuarterEnd", "kroghinterpolatefit", "kama", "kurtosis", "keyedTable", "kroghinterpolate",
  "kernelRidge", "knn", "keys", "kmeans", "kendall", "ksTest", "keyedStreamTable", "lshift",
  "loadIPCInMemoryTable", "lockUser", "last", "license", "latestIndexedTable", "lu", "lowlong",
  "latestkeyedstreamtable", "lower", "log10", "lt", "linearTimeTrend", "lowDouble", "loadNpz",
  "lpad", "lowerbound", "loadVocab", "log1p", "linearinterpolatefit", "lastWeekOfMonth",
  "loadBackup", "listStreamingSQLTables", "log2", "login", "loadmodulefromscript", "localtime",
  "latestKeyedTable", "loess", "listMCPTools", "lasso", "long", "loadText", "le", "loc",
  "loadDistributedInMemoryTable", "loadModule", "ltrim", "left", "lassoCV", "log", "loadTextEx",
  "listAllMarkets", "loadTable", "listMCPPrompts", "lassoBasic", "loadTableBySQL",
  "listPluginsByCluster", "logout", "listTables", "lfill", "like", "loadNpy", "linprog",
  "loadMvccTable", "loadModel", "lowRange", "listRemotePlugins", "logisticRegression", "lfill_",
  "loadPlugin", "loadRecord", "lastNot", "getStreamGraph", "year", "yearEnd", "yearBegin",
  "pipeline", "print", "pwlfpredict", "pca", "pinverse", "pdfNormal", "plotHist", "point",
  "parseMktData", "polyfit", "parseInteger", "pair", "ploadText", "power", "parsejsontable",
  "polynomial", "percentile", "parseInstrument", "partial", "prod", "prevState",
  "publishMCPPrompts", "poly1d", "pnodeRun", "panel", "portfolioPricer", "pdfF", "piecewiselinfit",
  "plot", "parseExpr", "polyPredict", "publishMCPTools", "pack", "pow", "parseInt",
  "percentChange", "purgeCacheEngine", "percentileRank", "predict", "pop_", "push_", "prev",
  "pchipInterpolateFit", "pdfChiSquare", "winsorize", "writeLine", "writeloglevel",
  "withdrawMCPPrompts", "winsorize_", "weekEnd", "wcovar", "warmupStreamEngine", "writeObject",
  "wavg", "wslr", "weekBegin", "wsum", "writeLog", "wilder", "warmupcomputenodecache",
  "withdrawMCPTools", "weekOfMonth", "weekOfYear", "writeLines", "wsum2", "write", "wma",
  "wc", "weekday", "writeRecord", "writeBytes", "wls", "warmupOrcaStreamEngine"
];

// Functions List
// Use string[] directly to avoid generic ambiguity
function shuffle(array: string[]): string[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const ALL_FUNCTIONS = shuffle(_ALL_FUNCTIONS);

const COLORS = [
  new THREE.Color(4.5, 0.8, 0.1),
  new THREE.Color(3.8, 1.2, 0.2),
  new THREE.Color(3.5, 2.0, 0.3),
  new THREE.Color(4.2, 1.5, 0.1),
  new THREE.Color(3.0, 0.5, 0.05),
  new THREE.Color(4.0, 1.0, 0.3),
  new THREE.Color(3.2, 1.8, 0.15),
];

// Helper for JSX Intrinsic Elements to bypass TS/React type issues
const T = {
  group: 'group' as any,
  mesh: 'mesh' as any,
  sphereGeometry: 'sphereGeometry' as any,
  meshBasicMaterial: 'meshBasicMaterial' as any,
  points: 'points' as any,
  bufferGeometry: 'bufferGeometry' as any,
  bufferAttribute: 'bufferAttribute' as any,
  shaderMaterial: 'shaderMaterial' as any
};

interface FunctionNodeProps {
  word: WordInstance; // Updated type from Logic
  timeRef: React.MutableRefObject<{ time: number }>;
  laneParams: LaneParams;
  baseSpeed: number;
  matcher: WordFlowMatcher;
  isMatch?: boolean;
  isDimmed?: boolean;
  highlightCharIdx?: number;
  convergenceRef?: React.MutableRefObject<number>;
  isFlashing?: boolean; // Flash effect after swap complete
  flashIntensityRef?: React.MutableRefObject<number>; // Ref based update
  dimmingLevelRef?: React.MutableRefObject<number>; // Ref based update
  isChatting: boolean;
}



const FunctionNode = React.memo(({
  word,
  timeRef,
  laneParams,
  baseSpeed,
  matcher,
  isMatch,
  isDimmed,
  highlightCharIdx,
  convergenceRef,
  isFlashing,
  flashIntensityRef,
  dimmingLevelRef,
  isChatting
}: FunctionNodeProps) => {
  const ref = useRef<THREE.Group>(null!);
  const baseTextRef = useRef<any>(null!);
  const highlightTextRef = useRef<any>(null!);
  const highLightLocalRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!ref.current) return;
    // Apply convergence ONLY if this is a matched word
    const effectiveConvergence = isMatch ? (convergenceRef?.current || 0) : 0;

    // Use the central logic
    const pos = matcher.getWordPosition(
      word.laneIdx,
      word.globalIndex,
      timeRef.current.time
    );

    // Optional: Add a subtle wave to the converged target Y so they aren't perfectly flat?
    if (effectiveConvergence > 0) {
      // target Y is 0. Let's add sin wave based on index.
      const waveOffset = Math.sin(word.globalIndex * 1.5) * 60 * effectiveConvergence;
      pos.y += waveOffset;
    }

    ref.current.position.copy(pos);

    // DIRECT VISUAL UPDATE (to avoid re-renders)
    const dimmingLevel = dimmingLevelRef?.current ?? 0;
    const flashIntensity = flashIntensityRef?.current ?? 0;

    // 1. Update Base Text Opacity
    if (baseTextRef.current) {
      // 定义基础透明度：
      // 正常模式: 0.5 (半透明)
      // 聊天模式: 0.08 (极淡，几乎隐形，只作为纹理)
      const normalBaseOpacity = 0.5;
      const chattingBaseOpacity = 0.08; 

      let targetOpacity = 0;

      if (isChatting) {
         // 如果在聊天，无论是否匹配，都强制变暗
         targetOpacity = chattingBaseOpacity;
      } else {
         // 原有的闪烁逻辑
         targetOpacity = isMatch
          ? (normalBaseOpacity - dimmingLevel * 0.3)
          : (normalBaseOpacity - dimmingLevel * 0.4);
      }

      const mat = baseTextRef.current.material;
      if (mat) {
        mat.opacity = targetOpacity;
        mat.transparent = true;
      }
      else if (baseTextRef.current.opacity !== undefined) {
        baseTextRef.current.fillOpacity = targetOpacity;
      }
    }

    /// 如果进入聊天模式，强制关闭高亮层
    if (isChatting && highlightTextRef.current) {
        highlightTextRef.current.material.opacity = 0;
    } else if (isMatch && highlightTextRef.current) {
      const mat = highlightTextRef.current.material;
      if (mat) {
        // Interpolate Color
        // Normal Gold: 4, 2, 0.5 -> Reduced to 2, 1, 0.2
        // Flash: Reduced multiplier significantly
        mat.color.r = 2 + flashIntensity * 1.5;
        mat.color.g = 1 + flashIntensity * 0.8;
        mat.color.b = 0.2 + flashIntensity * 0.2;
        mat.opacity = dimmingLevel; // Fade In
      }

      // Scale Effect REMOVED for smoothness
      if (highLightLocalRef.current) {
        highLightLocalRef.current.scale.setScalar(1.0);
      }
    }
  });



  // Calculate offset for the single highlighted char
  const highlightOffset = useMemo(() => {
    if (highlightCharIdx === undefined) return 0;
    // Center alignment offset
    const totalLen = word.text.length;
    // (index - (len - 1) / 2) * CHAR_WIDTH
    return (highlightCharIdx - (totalLen - 1) / 2) * CHAR_WIDTH;
  }, [highlightCharIdx, word.text]);

  return (
    <T.group ref={ref}>
      {/* Base Text */}
      <Text
        ref={baseTextRef}
        font={CODE_FONT}
        fontSize={FONT_SIZE}
        letterSpacing={0}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={isMatch ? 0 : -2}
        renderOrder={isMatch ? 5 : 0}
      >
        {word.text}
        <T.meshBasicMaterial
          color={word.color}
          toneMapped={false}
          transparent
          opacity={0.5} // Initial value
        />
      </Text>

      {/* Highlight Overlay */}
      {isMatch && highlightCharIdx !== undefined && (
        <T.group ref={highLightLocalRef} position={[highlightOffset, 0, 0]}>
          <Text
            ref={highlightTextRef}
            font={CODE_FONT}
            fontSize={FONT_SIZE} // Static font size
            letterSpacing={0}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            depthOffset={0}
            renderOrder={10}
          >
            {word.text[highlightCharIdx]}
            <T.meshBasicMaterial
              color={new THREE.Color(4, 2, 0.5)}
              toneMapped={false}
              transparent
              opacity={0} // Start invisible, updated in useFrame
            />
          </Text>
        </T.group>
      )}
    </T.group>
  );
});


// --- METEOR EFFECT ---
const MeteorTrail: React.FC<{
  activePath: MatchResult[];
  timeRef: React.MutableRefObject<{ time: number }>;
  matcher: WordFlowMatcher;
  convergence: number;
  onComplete: (lastPos: THREE.Vector3) => void;
}> = ({ activePath, timeRef, matcher, convergence, onComplete }) => {

  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const projectileRef = useRef<THREE.Group>(null!);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
  }, [activePath]);

  // Duration in seconds - Extended for longer highlight
  const INTRO_DURATION = 1.5; // Rise from bottom
  const DURATION = 4.0; // Main animation duration (longer for highlight visibility)
  const FLY_UP_DURATION = 0.5;

  useFrame((state, delta) => {
    // 1. Update Points (track moving targets)
    const targetPoints = activePath.map(match => {
      const [lIdx, gIdxStr] = match.wordId.split('-');
      const laneIdx = parseInt(lIdx);
      const globalIndex = parseInt(gIdxStr);

      // Use the central helper to ensure we target the exact same word text!
      const text = matcher.getWordText(laneIdx, globalIndex);

      const pos = matcher.getCharPosition(laneIdx, globalIndex, text, match.charIdx, timeRef.current.time);

      // APPLY WAVE OFFSET manually to match FunctionNode
      if (convergence > 0) {
        const waveOffset = Math.sin(globalIndex * 1.5) * 60 * convergence;
        pos.y += waveOffset;
      }
      return pos;
    });

    // ADD START POINT (Rising from bottom)
    // We want to rise to the FIRST target point.
    if (targetPoints.length > 0) {
      const first = targetPoints[0];
      const start = first.clone();
      start.y -= 800; // Start from bottom
      start.x -= 200; // Slight angle?

      // Prepend start point
      setPoints([start, ...targetPoints]);
    } else {
      setPoints([]);
    }

    // 2. Animate Projectile
    setProgress(p => {
      const newP = p + delta / (INTRO_DURATION + DURATION); // Slower total time
      return newP;
    });

    if (!projectileRef.current || points.length < 2) return;

    // Position along Spline
    const curve = new THREE.CatmullRomCurve3(points);

    // Map progress 0..1 to curve

    // Phase 1: Rise and Slide (0 to 1 on curve)
    if (progress < 1.0) {
      const point = curve.getPointAt(progress);
      projectileRef.current.position.copy(point);
    } else {
      // Phase 2: Fly UP (Extension)
      const flyProgress = (progress - 1.0) * ((INTRO_DURATION + DURATION) / FLY_UP_DURATION); // 0 to 1

      if (flyProgress < 1.0) {
        const lastPoint = points[points.length - 1];
        const target = lastPoint.clone().add(new THREE.Vector3(0, 800, 0));
        const pos = new THREE.Vector3().lerpVectors(lastPoint, target, flyProgress * flyProgress);
        projectileRef.current.position.copy(pos);
      } else {
        // Done
        const lastPoint = points[points.length - 1];
        const explodePos = lastPoint.clone().add(new THREE.Vector3(0, 800, 0));
        onComplete(explodePos);
      }
    }
  });

  if (points.length < 2) return null;

  return (
    <React.Fragment>
      {/* The Trail Line */}
      <Trail
        width={12}
        length={8} // Trail length
        color={new THREE.Color(2, 1, 0.5)}
        attenuation={(t) => t * t}
      >
        <T.group ref={projectileRef}>
          {/* Glowing Head */}
          <T.mesh>
            <T.sphereGeometry args={[8, 16, 16]} />
            <T.meshBasicMaterial color={[10, 5, 1]} toneMapped={false} />
          </T.mesh>
        </T.group>
      </Trail>
    </React.Fragment>
  );
};

const HtmlOverlay: React.FC<{ activeWord: string | null }> = ({ activeWord }) => {
  if (!activeWord) return null;

  return (
    <Html
      fullscreen
      style={{
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}
    >
      <div style={{
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        fontSize: '4rem',
        color: 'rgba(255, 215, 0, 0.9)',
        textShadow: '0 0 20px rgba(255, 120, 0, 0.6)',
        letterSpacing: '0.2em',
        transition: 'all 0.5s ease-out',
        transform: 'scale(1.2)'
      }}>
        {activeWord}
      </div>
    </Html>
  );
}

interface CodeRiverProps {
  onMatchFound?: (word: string) => void;
  onMatchComplete?: () => void;
  isChatting?: boolean;
}

const CodeRiver: React.FC<CodeRiverProps> = ({ onMatchFound, onMatchComplete, isChatting = false }) => {
  const baseSpeeds = useMemo(() => [120, 160, 110, 190, 140, 130, 170].slice(0, LANES_COUNT), []);

  const { lanesParams, targetWords } = useMemo(() => {
    const lanes = Array.from({ length: LANES_COUNT }).map(() => ({
      waveFreq: 0.6 + Math.random() * 0.6,
      waveAmp: 35 + Math.random() * 25,
      breatheFreq: 0.3 + Math.random() * 0.4,
      breatheIntensity: 1.5 + Math.random() * 1.5,
      depthFreq: 0.2 + Math.random() * 0.3,
      depthAmp: 20 + Math.random() * 20,
      phase: Math.random() * Math.PI * 2,
      speedFreq: 0.4 + Math.random() * 0.8, // Slow breathing cycle
      speedAmp: 60 + Math.random() * 80     // Significant position surge for visible speed change
    }));

    const targets = ["DOLPHIN"];

    return { lanesParams: lanes, targetWords: targets };
  }, []);

  const matcher = useMemo(() => {
    return new WordFlowMatcher(
      lanesParams,
      baseSpeeds,
      ALL_FUNCTIONS,
      COLORS,
      targetWords,
      WORD_SPACING,
      Y_STEP
    );
  }, [lanesParams, baseSpeeds, targetWords]);

  const [activePath, setActivePath] = useState<MatchResult[] | null>(null);
  const [activeTargetName, setActiveTargetName] = useState<string | null>(null);
  const [visibleInstances, setVisibleInstances] = useState<WordInstance[]>([]);

  const [oneShotFirework, setOneShotFirework] = useState<{ pos: THREE.Vector3, color: THREE.Color, id: number } | null>(null);

  const timeRef = useRef({ time: 0 });
  const speedScale = useRef(1.0);
  const convergenceRef = useRef(0.0);
  const scanTimer = useRef(0);
  const frameCount = useRef(0);
  const highlightTimer = useRef(0); // Timer for TOTAL match duration
  const postReorderTimer = useRef(0); // Timer since reorder complete, for flash timing
  const flashIntensityRef = useRef(0); // Ref for flashing effect (Performance optimization)
  const dimmingLevelRef = useRef(0.0); // 0.0 = bright, 1.0 = dimmed

  const handleHighlightComplete = () => {
    // if (activePath) {
    //   matcher.markDeparture(activePath, timeRef.current.time);
    // }

    // Keep lanes in their reordered positions - don't reset!
    // The lanes will continue flowing with their new Y positions

    setActivePath(null);
    setActiveTargetName(null);
    matcher.isPaused = false;
    highlightTimer.current = 0;
    postReorderTimer.current = 0;

    if (onMatchComplete) {
      onMatchComplete();
    }
  };

  useFrame((state, delta) => {
    // 1. Time Update
    // User Request: "Keep normal speed" - No acceleration on match.
    // const targetScale = matcher.isPaused ? 2.0 : 0.8;
    // speedScale.current = THREE.MathUtils.lerp(speedScale.current, targetScale, 0.05);

    // 1. Time Update (流动控制)
    // ✨✨✨ 如果 isChatting，速度直接为 0 (停止流动) ✨✨✨
    const speedMultiplier = isChatting ? 0 : 1.0; 

    speedScale.current = 1.0;
    timeRef.current.time += delta * speedScale.current * speedMultiplier;

    // 2. Convergence Update
    const targetConvergence = matcher.isPaused ? 1.0 : 0.0;
    convergenceRef.current = THREE.MathUtils.lerp(convergenceRef.current, targetConvergence, 0.03);

    // UPDATE MATCH LOGIC FRAME
    matcher.updateActiveOffsets(activePath, timeRef.current.time, convergenceRef.current);

    // 3. Lane Reorder & Flash Animation Update
    if (matcher.isPaused && activePath) {
      highlightTimer.current += delta;

      // Phase 1: Pre-Highlight Wait (2.0s) - Allow dimming & highlight to fade in
      if (highlightTimer.current >= 2.0) {
        // Phase 2: Reorder (Direct movement)
        matcher.updateLaneReorderProgress(delta, 0.7);
      }

      // Animation Phase Logic (Post-Reorder)
      if (matcher.isReorderComplete()) {
        postReorderTimer.current += delta;
        const t = postReorderTimer.current;

        // Phase 2: Flash (Visuals removed, just steady hold)
        const FLASH_DURATION = 0.5;
        if (t < FLASH_DURATION) {
          flashIntensityRef.current = 1.0;
        }
        // Phase 3: Hold (3.0s)
        else if (t < FLASH_DURATION + 3.0) {
          flashIntensityRef.current = 1.0;
        }
        // Phase 4: Fade Out (3.0s) - Coordinated with dimmingLevel
        else if (t < FLASH_DURATION + 3.0 + 3.0) {
          // Keep intensity high so it fades out as "Bright Gold"
          flashIntensityRef.current = 1.0;
        }
        // Done
        else {
          flashIntensityRef.current = 0;
          handleHighlightComplete();
        }
      } else {
        // Reset timer while pre-highlight or reordering
        postReorderTimer.current = 0;
        flashIntensityRef.current = 0;
      }
    }

    // 4. Update Dimming Level (User Request: Smooth transition)
    // Target: 1.0 if match active, 0.0 if no match OR if in Fade Out phase
    // Speeds: Fast to dim (1.0s), Slow to restore (3.0s)
    let targetDim = 0.0;
    if (matcher.isPaused && activePath) {
      // Normally dimmed (1.0)
      targetDim = 1.0;

      // BUT if we are in the Fade Out phase (Timer > 3.5s), we want to restore brightness
      // Timer > FLASH_DURATION (0.5) + HOLD (3.0) = 3.5
      if (postReorderTimer.current > 3.5) {
        targetDim = 0.0;
      }
    }
    const currentDim = dimmingLevelRef.current;

    if (targetDim > currentDim) {
      // Dimming down (getting darker) - Slower for smooth entry (2.0s)
      // 0.5 units per second => 2.0s to go from 0 to 1
      dimmingLevelRef.current = Math.min(targetDim, currentDim + delta * 0.5);
    } else {
      // Brightening up (restoring) - Slow (3s)
      // 0.33 units per second => 3.0s to go from 1 to 0
      dimmingLevelRef.current = Math.max(targetDim, currentDim - delta * 0.33);
    }


    // 4. Virtualization Update
    frameCount.current++;
    if (frameCount.current % 5 === 0) {
      const newVisible = matcher.getVisibleWords(timeRef.current.time);
      setVisibleInstances(newVisible);
    }

    // 5. Scan Logic
    if (!matcher.isPaused && !isChatting) {
      scanTimer.current += delta;
      if (scanTimer.current > 1.0) {
        scanTimer.current = 0;
        const result = matcher.scan(timeRef.current.time);
        if (result) {
          matcher.isPaused = true;
          matcher.startLaneReorder(); // Start lane reorder animation
          setActivePath(result.path);
          setActiveTargetName(result.target);

          if (onMatchFound) {
            onMatchFound(result.target); // 把找到的词传出去
          }
        }
      }
    }
  });

  return (
    <React.Fragment>
      <T.group position={[0, 0, 0]}>
        {visibleInstances.map((inst) => {
          const activeMatch = activePath ? activePath.find(m => m.wordId === inst.uniqueId) : undefined;
          const isMatch = !!activeMatch;
          const isDimmed = activePath !== null && !isMatch;

          return (
            <FunctionNode
              key={inst.uniqueId}
              word={inst}
              timeRef={timeRef}
              laneParams={lanesParams[inst.laneIdx]}
              baseSpeed={baseSpeeds[inst.laneIdx]}
              matcher={matcher}
              isMatch={isMatch}
              isDimmed={isDimmed}
              highlightCharIdx={activeMatch?.charIdx}
              convergenceRef={convergenceRef}
              isFlashing={isMatch && matcher.isReorderComplete()}
              flashIntensityRef={flashIntensityRef}
              dimmingLevelRef={dimmingLevelRef}
              isChatting={isChatting}
            />
          );
        })}
      </T.group>
    </React.Fragment>
  );
};

export default CodeRiver;
