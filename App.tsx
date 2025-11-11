import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { QAPair, RAGSource, ActiveHighlight } from './types';
import { useRAGStream } from './hooks/useRAGStream';
import { DolphinIcon } from './components/icons/DolphinIcon';
import { FocusOverlay } from './components/FocusOverlay';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://183.134.101.139:8007';

function App() {
  const [history, setHistory] = useState<QAPair[]>([]);
  const [question, setQuestion] = useState('');
  const { 
    currentAnswer, 
    sources, 
    statusMessage, 
    error, 
    isLoading, 
    startStream,
    setError, 
    setIsLoading 
  } = useRAGStream();
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [activeFocus, setActiveFocus] = useState<{ qaId: string; highlight: ActiveHighlight } | null>(null);


  const [shareText, setShareText] = useState('Share');

  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const initialLoadRef = useRef(false);

  const handleShare = () => {
    if (!conversationId) {
      setShareText('No link to share');
      setTimeout(() => setShareText('Share'), 2000);
      return;
    }

    const urlToCopy = window.location.href;

    // --- 优先使用现代、安全的 Clipboard API ---
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(urlToCopy).then(() => {
        setShareText('Link copied!');
        setTimeout(() => setShareText('Share'), 2000);
      }).catch(err => {
        console.error('Clipboard API failed: ', err);
        setShareText('Copy failed');
        setTimeout(() => setShareText('Share'), 2000);
      });
    } else {
      // --- 回退方案：使用传统的 execCommand ---
      const textArea = document.createElement('textarea');
      textArea.value = urlToCopy;
      
      // 样式设置，防止在屏幕上闪烁
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setShareText('Link copied!');
        } else {
          throw new Error('Copy command was not successful.');
        }
      } catch (err) {
        console.error('Fallback copy failed: ', err);
        setShareText('Copy failed');
      } finally {
        document.body.removeChild(textArea);
        setTimeout(() => setShareText('Share'), 2000);
      }
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    const newQuestion = question.trim();

    if (conversationId) {
      // 场景1: 在已有对话中继续提问
      const qaPairShell: QAPair = {
        id: `qa-${Date.now()}`,
        question: newQuestion,
        answer: '',
        sources: {},
      };
      
      const updatedHistory = [...history, qaPairShell];
      setHistory(updatedHistory);
      setQuestion('');

      startStream(
        newQuestion,
        conversationId,
        (fullAnswer, finalSources, returnedId) => {
          const finalQAPair: QAPair = {
            id: qaPairShell.id,
            question: newQuestion,
            answer: fullAnswer,
            sources: finalSources,
          };
          setHistory(currentHist => currentHist.map(p => p.id === qaPairShell.id ? finalQAPair : p));
        }
      );
    } else {
      // 场景2: 开始一个全新对话 (只创建和跳转)
      setIsLoading(true);
      setError(null);
      try {
        const createResponse = await fetch(`${API_BASE_URL}/api/v1/rag/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initial_history: [{ role: 'user', content: newQuestion }],
          }),
        });

        if (!createResponse.ok) {
          const errData = await createResponse.json();
          throw new Error(errData.detail || 'Failed to create a new conversation.');
        }

        const { conversation_id: newConvId } = await createResponse.json();
        setQuestion('');
        navigate(`/search/${newConvId}`, { 
          state: { isNewConversation: true, question: newQuestion } 
        });
        
        
        // 后续的加载和流式生成将由下面的 useEffect 处理
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setIsLoading(false);
      }
    }
  };
  
  // useEffect 1: 负责响应 URL 变化，加载历史并按需触发流
  useEffect(() => {
    const loadAndProcessConversation = async (id: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/rag/conversations/${id}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Conversation not found.');
        }

        const data = await response.json();
        const loadedHistory = data.history || [];
        
        // 转换后端数据为前端格式
        const formattedHistory: QAPair[] = [];
        for (let i = 0; i < loadedHistory.length; i += 2) {
          const userMsg = loadedHistory[i];
          const assistantMsg = loadedHistory[i + 1];
          if (userMsg?.role === 'user') {
            const sourcesData = assistantMsg?.metadata?.sources || [];
            const sourcesRecord: Record<string, RAGSource> = {};
            for (const backendSource of sourcesData) {
              sourcesRecord[backendSource.source] = {
                type: 'source',
                file_path: backendSource.source,
                content: backendSource.content,
                score: backendSource.score,
                metadata: {
                  start_line: backendSource.start_line,
                  end_line: backendSource.end_line,
                },
              };
            }
            formattedHistory.push({
              id: `hist-${i}`,
              question: userMsg.content,
              answer: assistantMsg?.content || '',
              sources: sourcesRecord,
            });
          }
        }
        setHistory(formattedHistory);

        const isNew = location.state?.isNewConversation;
        
        // 检查是否需要自动开始回答
        const lastMessage = loadedHistory[loadedHistory.length - 1];
        if (lastMessage && lastMessage.role === 'user' && !isNew) {
          const qaPairToUpdate = formattedHistory[formattedHistory.length - 1];
          startStream(
            qaPairToUpdate.question,
            id,
            (fullAnswer, finalSources, returnedId) => {
              const finalQAPair: QAPair = {
                id: qaPairToUpdate.id,
                question: qaPairToUpdate.question,
                answer: fullAnswer,
                sources: finalSources,
              };
              setHistory(prev => prev.map(p => (p.id === qaPairToUpdate.id ? finalQAPair : p)));
            }
          );
        } else if (isNew) {
          // 如果是新对话，我们需要手动触发一次流式请求
            const qaPairToUpdate = formattedHistory[formattedHistory.length - 1];
            startStream(
                qaPairToUpdate.question,
                id,
                (fullAnswer, finalSources, returnedId) => {
                    const finalQAPair: QAPair = {
                        id: qaPairToUpdate.id,
                        question: qaPairToUpdate.question,
        
                        answer: fullAnswer,
                        sources: finalSources,
                    };
                    setHistory(prev => prev.map(p => (p.id === qaPairToUpdate.id ? finalQAPair : p)));
                }
            );
        }
      } catch (err: any) {
        console.error('Failed to load conversation:', err);
        setError(err.message);
        navigate('/');
      }
    };

    if (conversationId && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadAndProcessConversation(conversationId);
    } else if (!conversationId) {
      setHistory([]);
      setError(null);
      initialLoadRef.current = false;
    }
  }, [conversationId, navigate]); 

  // useEffect 2: 负责将流式数据实时更新到UI
  useEffect(() => {
    if (isLoading) {
      setHistory(prevHistory => {
        if (prevHistory.length === 0) {
            return prevHistory;
        }
        
        const lastQAPair = prevHistory[prevHistory.length - 1];
        
        // 只要在加载中，就用最新的流数据更新最后一个元素。
        const streamingQAPair: QAPair = {
            ...lastQAPair,
            answer: currentAnswer,
            sources: sources,
        };
        
        const newHistory = [...prevHistory];
        newHistory[newHistory.length - 1] = streamingQAPair;
        return newHistory;
      });
    }
  }, [currentAnswer, sources, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleCitationClick = (highlight: ActiveHighlight, qaId: string) => {
    const isAlreadyFocused = activeFocus?.qaId === qaId && 
                            JSON.stringify(activeFocus?.highlight) === JSON.stringify(highlight);
    
    if (isAlreadyFocused) {
      setActiveFocus(null); // 点击同一个，取消高亮
    } else {
      setActiveFocus({ qaId, highlight }); // 设置新的高亮目标
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#2e3c51_1px,transparent_1px)]"></div>
      
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">DolphinMind</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <DolphinIcon className="text-gray-400 dark:text-gray-500" />
                <span className="hidden sm:inline">Powered by DolphinDB</span>
              </div>
              <button 
                onClick={handleShare}
                className={`px-4 py-2 text-sm  font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-slate-700 transition-all duration-200 whitespace-nowrap ${
                  shareText !== 'Share' ? 'w-28' : 'w-20' // 增加一点宽度以容纳更长的文本
                }`}
                // 如果正在显示提示信息，则禁用按钮
                disabled={shareText !== 'Share'}
              >
                {shareText}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main ref={mainContentRef} className="px-4 sm:px-6 lg:px-8 pt-16 flex-grow overflow-y-auto pb-48">
          <div className="pt-8">
            <ChatInterface 
              history={history}
              streamingData={{
                  currentAnswer,
                  sources,
                  statusMessage,
                  error,
                  isLoading,
              }}
              onCitationClick={handleCitationClick}
              activeFocus={activeFocus}
            />
          </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-10">
        <div className="mx-auto max-w-3xl">
          <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={isLoading}
              rows={1}
              className="w-full p-4 pr-14 text-gray-900 dark:text-white bg-transparent border-none rounded-lg focus:ring-0 focus:outline-none transition resize-none"
            />
            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <DolphinIcon size={20} />
            </button>
          </div>
        </div>
      </footer>
      
    </div>
  );
}

export default App;