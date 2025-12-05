import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { QAPair, RAGSource, ActiveHighlight } from './types';
import { useRAGStream } from './hooks/useRAGStream';
import { DolphinIcon } from './components/icons/DolphinIcon';
import { FocusOverlay } from './components/FocusOverlay';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { VantaBackground } from './components/VantaBackground';
import { PaperClipIcon } from './components/icons/PaperClipIcon'; 
import { useAppContext } from './AppContext';
import { v4 as uuidv4 } from 'uuid';
import { HistorySidebar } from './components/HistorySidebar';
import { historyManager } from './utils/historyManager';
import { VisualizerModal } from './components/VisualizerModal';
import { AppMode } from './visualizer/constants';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://183.134.101.139:8007';

const ChatInputFooter: React.FC<{
  question: string;
  setQuestion: (value: string) => void;
  handleAsk: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  imageFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  className?: string;
}> = ({
  question, setQuestion, handleAsk, handleKeyPress, isLoading,
  imageFiles, onFilesSelected, onRemoveFile, className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      // ✨✨✨ 核心修改：前端校验文件类型 ✨✨✨
      const validImages = fileArray.filter(file => {
        // 检查 MIME type 是否以 'image/' 开头
        return file.type.startsWith('image/');
      });

      // 如果有文件被过滤掉了（说明用户选了非图片）
      if (validImages.length < fileArray.length) {
        alert("仅支持上传图片文件 (JPG, PNG, GIF, WEBP 等)。");
      }

      // 只有存在有效图片时才进行后续操作
      if (validImages.length > 0) {
        onFilesSelected(validImages);
      }
    }
    
    // 重置 input，防止选择同一张图片不触发 onChange
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <footer className={`p-4 bg-transparent z-10 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg flex flex-col">
          {imageFiles.length > 0 && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
                {imageFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-100 dark:bg-slate-800 p-1.5 rounded-md">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-10 w-10 object-cover rounded flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate" title={file.name}>{file.name}</span>
                    </div>
                    <button onClick={() => onRemoveFile(index)} className="p-1 text-gray-400 hover:text-red-500 rounded-full flex-shrink-0 transition-colors" aria-label={`Remove ${file.name}`} disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center p-2">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask a question..." disabled={isLoading} rows={1} className="w-full pl-2 text-gray-900 dark:text-white bg-transparent border-none rounded-lg focus:ring-0 focus:outline-none resize-none" />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            <div className="flex items-center gap-2 pr-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors" aria-label="Attach images">
                <PaperClipIcon />
              </button>
              <button onClick={handleAsk} disabled={isLoading || (!question.trim() && imageFiles.length === 0)} className="p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
                <DolphinIcon size={20} mirrored={false} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

function App() {
  const [history, setHistory] = useState<QAPair[]>([]);
  const [question, setQuestion] = useState('');
  const { pendingFiles, setPendingFiles } = useAppContext();
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
  const [isDebugMode, setIsDebugMode] = useState(false);

  const [shareText, setShareText] = useState('Share');

  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const initialLoadRef = useRef(false);
  
  // hoverAreaRef 用于检测鼠标是否在屏幕左边缘
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 默认桌面端展开

  const location = useLocation(); // 引入 location

    const [isPinned, setIsPinned] = useState(false); // 默认固定
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  
  // 侧边栏是否可见 = 固定 OR 鼠标悬停中
  const isSidebarVisible = isPinned || isHoveringSidebar;

  // 鼠标进入触发区（左上角汉堡菜单或侧边栏本身）
  const handleSidebarEnter = () => {
    if (!isPinned) setIsHoveringSidebar(true);
  };

  // 鼠标离开侧边栏区域
  const handleSidebarLeave = () => {
    if (!isPinned) setIsHoveringSidebar(false);
  };

  // 切换固定状态
  const togglePin = () => {
    const newPinState = !isPinned;
    setIsPinned(newPinState);
    // 如果取消固定，虽然 isPinned 变 false，但鼠标还在上面，所以 Hover 应该设为 true 保持显示，直到鼠标移走
    if (!newPinState) setIsHoveringSidebar(true);
  };

  
  // ✨✨✨ 关键修复 1: 引入防重入锁，用于解决 StrictMode 下 useEffect 执行两次的问题
  const processedNewChatIds = useRef(new Set<string>());

  useEffect(() => {
    // 只有在正在加载（即流式传输中）并且 mainContentRef 已经挂载时才执行
    if (isLoading && mainContentRef.current) {
      const mainEl = mainContentRef.current;
      
      // ✨ 核心逻辑：将滚动条的位置设置到元素总高度的位置，即滚动到底部
      // 我们使用 scrollTo 和 behavior: 'smooth' 来实现平滑的滚动效果
      mainEl.scrollTo({
        top: mainEl.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentAnswer, isLoading]); 

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
    const currentImages = [...pendingFiles]; 
    if (conversationId) {
      // 场景1: 在已有对话中继续提问
      const qaPairShell: QAPair = {
        id: `qa-${Date.now()}`,
        question: newQuestion,
        answer: '',
        sources: {},
        images: currentImages
      };
      
      const updatedHistory = [...history, qaPairShell];
      setHistory(updatedHistory);
      setQuestion('');
      setPendingFiles([]); // 清空输入框

      startStream(
        newQuestion,
        conversationId,
        (fullAnswer, finalSources,) => {
          const finalQAPair: QAPair = {
            id: qaPairShell.id,
            question: newQuestion,
            answer: fullAnswer,
            sources: finalSources,
            images: currentImages
          };
          setHistory(currentHist => currentHist.map(p => p.id === qaPairShell.id ? finalQAPair : p));
          historyManager.saveConversation(qaPairShell.id, newQuestion);
        },
        pendingFiles
      );
      setPendingFiles([]); 
    } else {
      // 场景2: 开始一个全新对话 (只创建和跳转)
      setIsLoading(true);
      setError(null);
      try {
        const createResponse = await fetch(`${API_BASE_URL}/api/v1/rag/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
           // ✨ 核心：传空数组，让跳转后的 useEffect 来发起第一条消息
            initial_history: [], 
          }),
        });

        if (!createResponse.ok) {
          const errData = await createResponse.json();
          throw new Error(errData.detail || 'Failed to create a new conversation.');
        }

        const { conversation_id: newConvId } = await createResponse.json();
        setQuestion('');

        const targetPath = isDebugMode ? `/debug/${newConvId}` : `/search/${newConvId}`;
        
        navigate(targetPath, { 
          // 统一将问题通过 state 传递，这样 DebugPage 和 App 都能接收到
          state: { 
              isNewConversation: true, 
              question: newQuestion
          } 
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setIsLoading(false);
      }
    }
  };
  
 useEffect(() => {
    const loadAndProcessConversation = async (id: string) => {
      const locationState = location.state as { question?: string; isNewConversation?: boolean } | null;
      const stateQuestion = locationState?.question;
      const isNewChatFlow = (pendingFiles && pendingFiles.length > 0) || (stateQuestion !== undefined && locationState?.isNewConversation);

      // 1. 处理新会话初始化
      if (isNewChatFlow) {
        if (processedNewChatIds.current.has(id)) return;
        processedNewChatIds.current.add(id);

        let questionToAsk = stateQuestion;
        if (!questionToAsk && pendingFiles.length > 0) questionToAsk = "Analyze the attached file(s).";
        if (questionToAsk === undefined) questionToAsk = "";

        const qaPairShell: QAPair = { 
            id: `qa-${Date.now()}`, 
            question: questionToAsk, 
            answer: '', 
            sources: {},
            images: pendingFiles 
        };
        setHistory([qaPairShell]);
        const filesToUpload = [...pendingFiles];

        startStream(
          questionToAsk,
          id, 
          (fullAnswer, finalSources) => {
            const finalQAPair: QAPair = { ...qaPairShell, answer: fullAnswer, sources: finalSources, images: filesToUpload };
            setHistory(currentHist => currentHist.map(p => p.id === qaPairShell.id ? finalQAPair : p));
            // ✨✨✨ 关键补充：保存新会话到历史记录 ✨✨✨
            historyManager.saveConversation(id, questionToAsk);
          },
          filesToUpload
        );

        setPendingFiles([]); 
        navigate(location.pathname, { replace: true, state: {} });
        return; 
      }

      // 2. 处理已有会话加载
      if (!processedNewChatIds.current.has(id)) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/rag/conversations/${id}`);
            if (!response.ok) {
                if (response.status !== 404) throw new Error('Conversation not found.');
                return;
            }
            const data = await response.json();
            const loadedHistory = data.history || [];
            const formattedHistory: QAPair[] = [];
            
            let firstQuestion = "New Chat"; // 默认标题

            for (let i = 0; i < loadedHistory.length; i += 2) {
                const userMsg = loadedHistory[i];
                const assistantMsg = loadedHistory[i + 1];
                if (userMsg?.role === 'user') {
                    if (i === 0) firstQuestion = userMsg.content; // 记录第一条作为标题

                    const sourcesData = assistantMsg?.metadata?.sources || [];
                    const sourcesRecord: Record<string, RAGSource> = {};
                    for (const s of sourcesData) {
                        sourcesRecord[s.source] = { type: 'source', file_path: s.source, content: s.content, score: s.score, metadata: { start_line: s.start_line, end_line: s.end_line } };
                    }
                    formattedHistory.push({
                        id: `hist-${i}`,
                        question: userMsg.content,
                        answer: assistantMsg?.content || '',
                        sources: sourcesRecord,
                        images: userMsg.images || []
                    });
                }
            }
            setHistory(formattedHistory);
            
            // ✨✨✨ 关键补充：加载成功后，默默保存到本地历史（如果是还没存过的） ✨✨✨
            historyManager.saveConversation(id, firstQuestion);

            // 继续未完成的对话
            const lastMessage = loadedHistory[loadedHistory.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                const qaPairToUpdate = formattedHistory[formattedHistory.length - 1];
                startStream(
                    qaPairToUpdate.question,
                    id,
                    (fullAnswer, finalSources) => {
                        const finalQAPair: QAPair = { ...qaPairToUpdate, answer: fullAnswer, sources: finalSources };
                        setHistory(prev => prev.map(p => (p.id === qaPairToUpdate.id ? finalQAPair : p)));
                    },
                    [] 
                );
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
      }
    };

    if (conversationId) loadAndProcessConversation(conversationId);
    else { setHistory([]); setError(null); }
  }, [conversationId, navigate, startStream, pendingFiles, setPendingFiles, location.state]);

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

  const handleFilesSelected = (newFiles: File[]) => {
    setPendingFiles([...pendingFiles, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setPendingFiles(pendingFiles.filter((_, index) => index !== indexToRemove));
  };
    
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
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

  const handleNewChat = () => {
    // 如果正在加载，则不执行任何操作，防止中断当前流
    if (isLoading) return;
    navigate('/');
  };

  const [visualizerConfig, setVisualizerConfig] = useState<{
    pluginId: string;
    initialParams?: any;
  } | null>(null);

  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);


  const handleShowVisualizer = (pluginId: string, initialParams?: any) => {
    setVisualizerConfig({ pluginId, initialParams });
    setIsVisualizerOpen(true);
  };


  return (
    <div className="h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200">
      <VantaBackground />
      <VisualizerModal 
        isOpen={isVisualizerOpen} 
        pluginId={visualizerConfig?.pluginId} 
        initialParams={visualizerConfig?.initialParams}
        onClose={() => setIsVisualizerOpen(false)} 
      />
      <div 
        onMouseLeave={handleSidebarLeave} 
        className="fixed top-0 left-0 h-full z-40 pointer-events-none" // pointer-events-none 允许点击穿透到后面（当侧边栏收起时）
      >
        {/* 恢复子元素的 pointer-events */}
        <div className="pointer-events-auto h-full">
            <HistorySidebar 
                isOpen={isSidebarVisible} 
                isPinned={isPinned}
                onTogglePin={togglePin}
                onClose={() => setIsHoveringSidebar(false)} 
            />
        </div>
      </div>


      {/* Header: 动态 padding-left */}
      <header className={`
        fixed top-0 left-0 right-0 
        bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 
        z-20 transition-all duration-300
        ${isPinned ? 'pl-64' : 'pl-0'} 
      `}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-3">
              {/* ✨ 左上角触发器：汉堡菜单 ✨ */}
              {/* 当侧边栏固定时，此按钮可以隐藏，或者保留作为视觉平衡。这里我们保留，鼠标移上去也会触发悬浮 */}
              <div 
                onMouseEnter={handleSidebarEnter}
                className={`p-2 -ml-2 rounded-md cursor-pointer transition-opacity duration-300 ${isSidebarVisible ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              >
                 {/* 汉堡图标 */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-300"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </div>
              <DolphinIcon size={28} className="text-blue-500" mirrored={true} />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DolphinMind</h1>
            </div>

            <div className="flex items-center gap-4">

              <button
                onClick={handleNewChat}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                New Chat
              </button>

              <button 
                onClick={handleShare}
                className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-slate-700 transition-all duration-200 whitespace-nowrap ${
                  shareText !== 'Share' ? 'w-28' : 'w-20'
                }`}
                disabled={shareText !== 'Share'}
              >
                {shareText}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className={`flex-grow pt-16 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
      {!conversationId ? (
        // --- 主页布局 ---
        <main className="flex-grow pt-16 flex flex-col justify-center items-center p-4">
          <div className="flex flex-col items-center gap-6 w-full">
            {/* ✨✨✨ 明确传递 Props ✨✨✨ */}
            <ChatInputFooter
              question={question}
              setQuestion={setQuestion}
              handleAsk={handleAsk}
              handleKeyPress={handleKeyPress}
              isLoading={isLoading}
              imageFiles={pendingFiles} 
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              className="w-full"
            />
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={isDebugMode}
                  onChange={(e) => setIsDebugMode(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span>Debug Mode</span>
              </label>
          </div>
        </main>
      ) : (
        // --- 对话页布局 ---
        <>
          <main ref={mainContentRef} className="px-4 sm:px-6 lg:px-8 pt-16 flex-grow overflow-y-auto pb-48">
              <div className="pt-8">
                <ChatInterface 
                  history={history}
                  streamingData={{ currentAnswer, sources, statusMessage, error, isLoading }}
                  onCitationClick={handleCitationClick}
                  activeFocus={activeFocus}
                  onShowVisualizer={handleShowVisualizer}
                />
              </div>
          </main>
          {/* ✨✨✨ 明确传递 Props ✨✨✨ */}
          <ChatInputFooter
            question={question}
            setQuestion={setQuestion}
            handleAsk={handleAsk}
            handleKeyPress={handleKeyPress}
            isLoading={isLoading}
            imageFiles={pendingFiles} 
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
            className="fixed bottom-0 left-0 right-0"
          />
        </>
      )}
      </div>
    </div>
  );
}

export default App;