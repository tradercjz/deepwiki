import React from 'react';
import { RAGSource } from '../../types'; 
// 假设 RetrievalResult 和 RAGSource 结构相似
// 如果不同，可以定义一个
interface RetrievalResult extends RAGSource {
  // RAGSource 已经有 file_path, content, score, metadata
}

interface ResultCardProps {
    result: RetrievalResult;
    rank: number;
    title: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, rank, title }) => {
    const scoreColor =
        result.score && result.score >= 0.9
        ? 'text-green-500'
        : result.score && result.score >= 0.8
        ? 'text-yellow-500'
        : 'text-orange-500';

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                <span className="text-gray-400 dark:text-gray-500 mr-2">{title} #{rank}</span>
                {result.file_path}
            </h4>
            <span className={`font-mono text-sm font-bold ${scoreColor}`}>
                Score: {result.score?.toFixed(4)}
            </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lines: {result.metadata?.start_line} - {result.metadata?.end_line}
            </div>
        </div>
        <pre className="p-4 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 overflow-auto max-h-48">
            <code>{result.content}</code>
        </pre>
        </div>
    );
};