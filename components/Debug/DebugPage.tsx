// In ./components/Debug/DebugPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ResultCard } from './ResultCard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://183.134.101.139:8007'; // 确保端口正确

// 定义后端返回的数据结构
interface RetrievalResult {
    source: string;
    file_path: string; // 确保前端类型统一
    content: string;
    score: number | null;
    metadata?: {
        start_line: number;
        end_line: number;
    };
}

interface DebugData {
    rewritten_query: string;
    bm25_keywords: string;
    vector_results: RetrievalResult[];
    bm25_results: RetrievalResult[];
    fused_results: RetrievalResult[];
    reranked_results: RetrievalResult[];
}

export const DebugPage: React.FC = () => {
    const { conversationId } = useParams<{ conversationId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    
    // 从路由状态中获取问题，这是最好的方式
    const question = location.state?.question;

    const [debugData, setDebugData] = useState<DebugData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!question) {
        setError('No question provided. Please navigate from a chat message.');
        setIsLoading(false);
        return;
        }

        const fetchDebugData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rag/debug-retrieval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                conversation_id: conversationId,
                embedding_model: 'qwen_base', // 或者让它可配置
                vector_store: 'duckdb_store',
            }),
            });

            if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to fetch debug data.');
            }

            const data = await response.json();
            
            // 确保所有 source 字段都映射到 file_path
            const normalizeResults = (results: any[]) => results.map(r => ({...r, file_path: r.source, metadata: r.metadata || {}}));
            
            setDebugData({
            ...data,
            vector_results: normalizeResults(data.vector_results),
            bm25_results: normalizeResults(data.bm25_results),
            fused_results: normalizeResults(data.fused_results),
            reranked_results: normalizeResults(data.reranked_results),
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
        };

        fetchDebugData();
    }, [conversationId, question]);

    const renderResultsColumn = (title: string, results: RetrievalResult[]) => (
        <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title} ({results.length})</h3>
        <div className="overflow-y-auto h-[70vh]">
            {results.length > 0 ? (
            results.map((result, index) => (
                <ResultCard key={`${title}-${index}`} result={result} rank={index + 1} title={title.split(' ')[0]}/>
            ))
            ) : (
            <p className="text-gray-500 italic">No results in this stage.</p>
            )}
        </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
        <header className="mb-6">
            <button onClick={() => navigate(`/search/${conversationId}`)} className="text-blue-500 hover:underline mb-4">
            &larr; Back to Chat
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Retrieval Pipeline Debugger</h1>
            <p className="text-gray-600 dark:text-gray-400">Conversation ID: {conversationId}</p>
        </header>
        
        {isLoading && <div className="text-center p-10">Loading debug data...</div>}
        {error && <div className="text-center p-10 text-red-500">{error}</div>}

        {debugData && (
            <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div>
                <h4 className="font-semibold text-gray-500 dark:text-gray-400">Original Question</h4>
                <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">{question}</p>
                </div>
                <div>
                <h4 className="font-semibold text-gray-500 dark:text-gray-400">Rewritten Query (for Vector)</h4>
                <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">{debugData.rewritten_query}</p>
                </div>
                <div>
                <h4 className="font-semibold text-gray-500 dark:text-gray-400">Keywords (for BM25)</h4>
                <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">{debugData.bm25_keywords}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {renderResultsColumn("Vector Results", debugData.vector_results)}
                {renderResultsColumn("BM25 Results", debugData.bm25_results)}
                {renderResultsColumn("Fused Results (RRF)", debugData.fused_results)}
                {renderResultsColumn("Reranked Final", debugData.reranked_results)}
            </div>
            </div>
        )}
        </div>
    );
};