import { useState, useCallback } from 'react';
import { RAGMessage, RAGSource, QAPair } from '../types';

export const useRAGStream = () => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [sources, setSources] = useState<Record<string, RAGSource>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const startStream = useCallback(async (
    question: string,
    history: QAPair[],
    onComplete: (fullAnswer: string, sources: Record<string, RAGSource>) => void
  ) => {
    // Reset state for new stream
    setCurrentAnswer('');
    setSources({});
    setStatusMessage('');
    setError(null);
    setIsLoading(true);

    const finalAnswer = { current: '' };
    const finalSources = { current: {} };

    try {
      // Per the curl example, conversation_history is an array of objects.
      // We will only send the most recent user question as per the example.
      // For a more advanced chat, you might send more history.
      const conversation_history = [{ role: 'user', content: question }];

      const response = await fetch('http://183.134.101.139:8007/api/v1/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_history: conversation_history,
          embedding_model: "qwen_base",
          vector_store: "duckdb_store"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialData = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        partialData += decoder.decode(value, { stream: true });
        
        const messageBlocks = partialData.split('\n\n');
        partialData = messageBlocks.pop() || '';
        
        for (const block of messageBlocks) {
          if (block.startsWith('data: ')) {
            const jsonStr = block.substring(6);
            if (jsonStr.trim()) {
              try {
                const message = JSON.parse(jsonStr) as RAGMessage;
                switch (message.type) {
                  case 'status':
                    setStatusMessage(message.message);
                    break;
                  case 'source':
                    setSources(prev => {
                      const newSources = { ...prev, [message.file_path]: message };
                      finalSources.current = newSources;
                      return newSources;
                    });
                    break;
                  case 'content':
                    setCurrentAnswer(prev => {
                      const newAnswer = prev + message.chunk;
                      finalAnswer.current = newAnswer;
                      return newAnswer;
                    });
                    break;
                  case 'error':
                    setError(message.detail);
                    setIsLoading(false);
                    return;
                  case 'end':
                    setIsLoading(false);
                    setStatusMessage('');
                    onComplete(finalAnswer.current, finalSources.current);
                    return;
                }
              } catch (e) {
                console.error("Failed to parse JSON from SSE stream:", jsonStr, e);
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to connect to the server: ${errorMessage}`);
      setIsLoading(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    // This function is kept for API consistency but is now a no-op.
    // Aborting a fetch request requires an AbortController, which would add complexity.
    // The stream will naturally close when the server ends it or on error.
  }, []);

  return {
    currentAnswer,
    sources,
    statusMessage,
    error,
    isLoading,
    startStream,
    stopStream,
  };
};
