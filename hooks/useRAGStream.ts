
import { useState, useCallback } from 'react';
import { QAPair, RAGSource } from '../types';
import { uploadFileToOSS } from '../utils/ossUpload'; 

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
    onComplete: (fullAnswer: string, finalSources: Record<string, RAGSource>, conversationId: string) => void,
    imageFiles: File[]
  ) => {
    setIsLoading(true);
    setError(null);
    setCurrentAnswer('');
    setSources({});
    setStatusMessage('Initiating session...');

    let finalAnswer = '';
    const finalSources: Record<string, RAGSource> = {};

    try {
      let imageUrls: string[] = [];
      
      if (imageFiles && imageFiles.length > 0) {
        setStatusMessage(`Uploading ${imageFiles.length} images...`);
        try {
          // 并行上传所有图片
          imageUrls = await Promise.all(imageFiles.map(file => uploadFileToOSS(file)));
          console.log("Images uploaded successfully:", imageUrls);
        } catch (uploadError) {
          throw new Error(`Image upload failed: ${(uploadError as Error).message}`);
        }
      }

      setStatusMessage('Thinking...'); 

      const formData = new FormData();
      formData.append('question', question);
      formData.append('conversation_id', conversationId);
      // 你可以按需添加其他表单字段，例如：
      // formData.append('embedding_model', 'qwen_base');
      // formData.append('vector_store', 'duckdb_store');

      if (imageUrls.length > 0) {
        // 将 URL 数组序列化为 JSON 字符串发送
        formData.append('image_urls', JSON.stringify(imageUrls));
      }

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // ‼️ 注意：当使用 FormData 时，永远不要手动设置 Content-Type header。
      // 浏览器会自动设置，并包含正确的 boundary 分隔符。
      const response = await fetch(`${API_BASE_URL}/api/v1/rag/chat`, {
        method: 'POST',
        body: formData, // 始终传递 formData 对象
      });

      if (!response.body) throw new Error('Response body is null.');
      
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      
      // ✨ 1. 引入一个缓冲区变量
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
            // ✨ 处理流结束时可能残留在缓冲区的数据
            if (buffer.trim()) {
                processBuffer(buffer);
            }
            break;
        }

        // ✨ 2. 将新收到的数据追加到缓冲区
        buffer += value;

        // ✨ 3. 循环处理缓冲区，直到找不到完整的消息分隔符为止
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
            // 提取一个完整的消息块
            const messageBlock = buffer.substring(0, boundary);
            // 从缓冲区移除已处理的消息块
            buffer = buffer.substring(boundary + 2);

            // 处理这个完整的消息块
            processBuffer(messageBlock);
            
            // 继续在更新后的缓冲区中查找下一个消息
            boundary = buffer.indexOf('\n\n');
        }
      }

      // ✨ 4. 创建一个处理消息块的辅助函数，避免代码重复
      function processBuffer(messageBlock: string) {
        if (!messageBlock.startsWith('data: ')) {
            return;
        }
        
        const jsonStr = messageBlock.replace('data: ', '').trim();
        if (!jsonStr) {
            return;
        }

        try {
          // ✨ 核心修复：后端发送的是被转义的JSON字符串，前端需要解析两次
          // 第一次 parse 是解析 SSE 消息体本身
          const parsedData = JSON.parse(jsonStr);
          // 第二次 parse 是解析 `content` 字段中的转义字符串
          // 实际上，如果后端正确地发送了 `application/json` 风格的 SSE，这里只需要一次 parse。
          // 让我们假设后端发送的是被 `json.dumps()` 包装过的字符串，需要两次解析。
          // 不，根据我们之前的修复，后端是 `json.dumps(message.model_dump())`，
          // 这意味着整个 payload 是一个 JSON 字符串，所以前端 `JSON.parse` 一次就够了。
          const message = parsedData; // 我们先假设一次解析就够
          
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
        } catch (e) { 
            console.error('Failed to parse SSE message chunk:', jsonStr, e); 
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