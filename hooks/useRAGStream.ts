
import { useState, useCallback } from 'react';
import { QAPair, RAGSource } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://183.134.101.139:8007';

export const useRAGStream = () => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [sources, setSources] = useState<Record<string, RAGSource>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startStream = useCallback(async (
    question: string,
    conversationId: string, // ID 现在是必须的
    onComplete: (fullAnswer: string, finalSources: Record<string, RAGSource>, conversationId: string) => void
  ) => {
    setIsLoading(true);
    setError(null);
    setCurrentAnswer('');
    setSources({});
    setStatusMessage('Initiating session...');

    let finalAnswer = '';
    const finalSources: Record<string, RAGSource> = {};

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          conversation_id: conversationId
        })
      });

      if (!response.body) throw new Error('Response body is null.');
      
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = value.split('\n\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          const jsonStr = line.replace('data: ', '');
          try {
            const message = JSON.parse(jsonStr);
            switch (message.type) {
              case 'status': setStatusMessage(message.message); break;
              case 'source':
                finalSources[message.file_path] = message;
                setSources(prev => ({ ...prev, [message.file_path]: message }));
                break;
              case 'content':
                finalAnswer += message.chunk;
                setCurrentAnswer(prev => prev + message.chunk);
                break;
              case 'error': setError(message.detail); break;
            }
          } catch (e) { console.error('Failed to parse SSE message:', jsonStr, e); }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      onComplete(finalAnswer, finalSources, conversationId);
    }
  }, []);

  // 导出 setError 和 setIsLoading 以便 App 组件可以手动控制
  return { currentAnswer, sources, statusMessage, error, isLoading, startStream, setError, setIsLoading };
};