import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { COLORS } from './constants';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://183.134.101.139:8007';

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showIntroAnim, setShowIntroAnim] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroAnim(false);
    }, 1000); // 1秒后消失
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validImages = fileArray.filter(file => file.type.startsWith('image/'));

      if (validImages.length < fileArray.length) {
        alert("仅支持上传图片文件 (JPG, PNG, GIF, WEBP 等)。");
      }

      if (validImages.length > 0) {
        onFilesSelected(validImages);
      }
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <footer className={`p-4 bg-transparent z-10 ${className}`}>
      <div className="mx-auto max-w-3xl">
        
        <div className="relative group">
          
          {/* ✨ 1. 流光层：Google 经典四色 (蓝->红->黄->绿) */}
          <div 
            className={`absolute -inset-[3px] rounded-xl overflow-hidden transition-opacity duration-1000 pointer-events-none ${showIntroAnim ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* 
               渐变解释:
               50%: 透明 (尾巴)
               65%: Google Blue (#4285F4)
               78%: Google Red (#EA4335)
               90%: Google Yellow (#FBBC05)
               100%: Google Green (#34A853) (头部)
            */}
            <div className="absolute inset-[-100%] animate-[spin_1s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#4285F4_65%,#EA4335_78%,#FBBC05_90%,#34A853_100%)]" />
          </div>

          {/* ✨ 2. 光晕层：匹配的红黄蓝渐变 */}
          <div 
            className={`absolute -inset-[2px] rounded-xl bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] blur opacity-40 transition-opacity duration-1000 pointer-events-none ${showIntroAnim ? 'opacity-40' : 'opacity-0'}`}
          ></div>

          {/* 输入框主体 */}
          <div className="relative z-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg flex flex-col">
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
            
            <div className="flex items-end p-2 gap-2">
              <textarea 
                  ref={textareaRef}
                  value={question} 
                  onChange={(e) => setQuestion(e.target.value)} 
                  onKeyPress={handleKeyPress} 
                  placeholder="Ask a question..." 
                  disabled={isLoading} 
                  rows={1} 
                  className="w-full py-3 pl-2 text-gray-900 dark:text-white bg-transparent border-none rounded-lg focus:ring-0 focus:outline-none resize-none max-h-48 overflow-y-auto leading-relaxed" 
              />
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              
              <div className="flex items-center gap-2 pb-1.5 flex-shrink-0">
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
      </div>
    </footer>
  );
};
function App() {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [history, setHistory] = useState<QAPair[]>([]);
  const [question, setQuestion] = useState('');
  const { pendingFiles, setPendingFiles } = useAppContext();
  const { 
    currentAnswer, 
    sources, 
    statusMessage, 
    error, 
    isLoading,
    streamingId,
    startStream,
    setError, 
    setIsLoading 
  } = useRAGStream();

  const isGeneratingRef = useRef(false);

  // 用于存储正在生成的对话的上下文，防止切换路由时丢失
  const activeStreamRef = useRef<{
    id: string;
    question: string;
    images: File[];
    answer: string;
    sources: Record<string, any>;
  } | null>(null);
  
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

      //  提问时立即更新历史记录 (置顶当前会话) 
      if (!user) historyManager.saveConversation(conversationId, newQuestion);
      else window.dispatchEvent(new Event('history-updated')); // 让 Sidebar 重新拉取排序

      activeStreamRef.current = {
          id: conversationId,
          question: newQuestion,
          images: currentImages,
          answer: '',
          sources: {}
      };

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
          // 获取当前的 URL ID (最准确的判断用户在哪里的方式)
          const currentUrlId = window.location.pathname.split('/').pop();

          if (currentUrlId === conversationId) {
             const finalQAPair: QAPair = {
               id: qaPairShell.id,
               question: newQuestion,
               answer: fullAnswer,
               sources: finalSources,
               images: currentImages
             };
             setHistory(currentHist => currentHist.map(p => p.id === qaPairShell.id ? finalQAPair : p));
          }
          if (!user) historyManager.saveConversation(conversationId, newQuestion);
          else window.dispatchEvent(new Event('history-updated'));

          processedNewChatIds.current.delete(conversationId);
          isGeneratingRef.current = false;
        },
        pendingFiles
      );
      setPendingFiles([]); 
    } else {
      // 场景2: 开始一个全新对话 (只创建和跳转)
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const createResponse = await fetch(`${API_BASE_URL}/api/v1/rag/conversations`, {
          method: 'POST',
          headers: headers,
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

      // --- A. 处理新会话初始化 ---
      if (isNewChatFlow) {
        // 防止 StrictMode 下的重复执行
        if (processedNewChatIds.current.has(id)) return;
        processedNewChatIds.current.add(id);
        isGeneratingRef.current = true; // 标记开始

        let questionToAsk = stateQuestion;
        if (!questionToAsk && pendingFiles.length > 0) questionToAsk = "Analyze the attached file(s).";
        if (questionToAsk === undefined) questionToAsk = "New Chat";

        // 初始化缓存 Ref
        activeStreamRef.current = {
            id: id,
            question: questionToAsk,
            images: pendingFiles,
            answer: '',
            sources: {}
        };

        // 1. 初始化 UI 状态
        const qaPairShell: QAPair = { 
            id: `qa-${Date.now()}`, 
            question: questionToAsk, 
            answer: '', 
            sources: {},
            images: pendingFiles 
        };
        setHistory([qaPairShell]);
        
        // ✨✨✨ [修复1]：立即在侧边栏显示“正在生成”的条目 ✨✨✨
        // 不管是游客还是用户，先让侧边栏显示出来
        if (!user) {
          historyManager.saveConversation(id, questionToAsk);
        } else {
          // 对于用户，虽然 API 可能还没返回这条历史，但我们可以先触发一次刷新尝试
          // 更好的做法是后端创建 ID 时就生成 title，这里假设后端已创建 ID
          // 我们发送事件让 Sidebar 尝试去拉取
          window.dispatchEvent(new Event('history-updated'));
        }

        const filesToUpload = [...pendingFiles];

        startStream(
          questionToAsk,
          id, 
          (fullAnswer, finalSources) => {
            const finalQAPair: QAPair = { ...qaPairShell, answer: fullAnswer, sources: finalSources, images: filesToUpload };
            setHistory(currentHist => currentHist.map(p => p.id === qaPairShell.id ? finalQAPair : p));
            
            // 保存最终结果
            if (!user) historyManager.saveConversation(id, questionToAsk);
            else window.dispatchEvent(new Event('history-updated'));

            // ✨✨✨ [修复2]：生成完成后，解锁 ID ✨✨✨
            // 这样当你切到别的对话再切回来时，下面的逻辑 (B) 就会执行，从后端拉取完整数据
            processedNewChatIds.current.delete(id);
            isGeneratingRef.current = false;
          },
          filesToUpload
        );

        setPendingFiles([]); 
        // 清除 location state，防止刷新页面重复触发
        navigate(location.pathname, { replace: true, state: {} });
        return; 
      }

      // 如果这个 ID 在 processedNewChatIds 中，说明它是一个正在生成的、还没入库的新会话。
      // 我们不能 fetch (因为库里没有)，也不能直接 return (否则界面会残留上一个会话的数据)。
      // 必须手动从 activeStreamRef 恢复它的初始状态。
      if (processedNewChatIds.current.has(id)) {
        console.log('[App] Reconstructing active new-chat from memory...', id);
        
        // 1. 必须先清空当前显示的历史 (比如之前显示的 Session B)
        setHistory([]); 

        // 2. 从 Ref 中恢复这个正在生成的会话视图
        if (activeStreamRef.current && activeStreamRef.current.id === id) {
             const liveQAPair: QAPair = {
                id: `qa-live-${Date.now()}`, // 临时 ID
                question: activeStreamRef.current.question,
                answer: currentAnswer || activeStreamRef.current.answer, // 优先用最新的 currentAnswer，防止回退
                sources: activeStreamRef.current.sources,
                images: activeStreamRef.current.images
            };
            setHistory([liveQAPair]);
        }
        return; // 阻断后续的 fetch，因为这还是个内存中的会话
      }

      // 只有当 ID 不在 processedNewChatIds 时，才去 fetch
      // 下面是原有的 fetch 逻辑，不用动，但去掉了外层的 if (!processedNewChatIds.has(id)) 包裹
      
      // 切换 ID 时，先清空历史
      setHistory([]); 

      // --- B. 处理已有会话加载 (切回来时走这里) ---
      // 只有当这个 ID 不在“正在处理”列表中，或者它之前处理完了(被delete了)，才去拉取
  
        try {
            // ✨ 如果正在流式传输中切回来（比如你切到 B 又切回 A），不要重新拉取，
            // 否则会覆盖掉当前流式 hook 里的状态。
            if (isLoading && streamingId === id) {
                console.log('Resume streaming view, skipping fetch');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/rag/conversations/${id}`, {
               headers: user ? { 'Authorization': `Bearer ${user.token}` } : {} // 确保带 Token
            });
            
            let loadedHistory: any[] = [];
            
            if (!response.ok) {
                // 如果是 404，且这个 ID 正在流式生成中，说明是新会话还没入库
                // 我们认为这是"正常的"，将 loadedHistory 设为空数组，继续往下走去合并 Ref
                if (response.status === 404 && isLoading && streamingId === id) {
                    console.log('[App] New chat not found in DB yet, constructing from active stream...');
                    loadedHistory = [];
                } else {
                    // 其他错误则抛出
                    if (response.status !== 404) throw new Error('Conversation not found.');
                    return;
                }
            } else {
                // 正常响应
                const data = await response.json();
                loadedHistory = data.history || [];
            }

            
            const formattedHistory: QAPair[] = [];
            for (let i = 0; i < loadedHistory.length; i += 2) {
                const userMsg = loadedHistory[i];
                const assistantMsg = loadedHistory[i + 1];
                if (userMsg?.role === 'user') {
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
            

            if (isLoading && streamingId === id && activeStreamRef.current && activeStreamRef.current.id === id) {
                console.log('[App] Merging active stream into view');
                
                const liveQAPair: QAPair = {
                    id: `qa-live-${Date.now()}`,
                    question: activeStreamRef.current.question,
                    answer: activeStreamRef.current.answer,
                    sources: activeStreamRef.current.sources,
                    images: activeStreamRef.current.images
                };

                // 简单的去重逻辑：如果 API 返回的最后一条问题和当前正在生成的一样，说明 API 已经包含了这条
                // 此时用 liveQAPair 覆盖它（因为 live 的 answer 是最新的流式内容）
                const lastHistoryItem = formattedHistory[formattedHistory.length - 1];
                if (lastHistoryItem && lastHistoryItem.question === liveQAPair.question) {
                    formattedHistory[formattedHistory.length - 1] = liveQAPair;
                } else {
                    formattedHistory.push(liveQAPair);
                }
            }

            setHistory(formattedHistory);
            
            const lastMessage = loadedHistory[loadedHistory.length - 1];
            if (loadedHistory.length > 0 && lastMessage && lastMessage.role === 'user' && !isLoading) {
                 // 这里通常不需要做什么，因为如果不在 isLoading 状态，说明已经断了
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
      
    };

    if (conversationId) loadAndProcessConversation(conversationId);
    else { setHistory([]); setError(null); }
  }, [conversationId, navigate, startStream, pendingFiles, location.state, user]); // 增加 user 依赖
  
  // useEffect 2: 负责将流式数据实时更新到 UI
  useEffect(() => {
    // 只要处于加载状态，且有 streamingId，我们就维护缓存
    if (isLoading && streamingId) {
      
      // 1. ✨ 更新后台缓存 (这是源头)
      if (activeStreamRef.current && activeStreamRef.current.id === streamingId) {
        activeStreamRef.current.answer = currentAnswer;
        activeStreamRef.current.sources = sources;
      }

      // 2. ✨ 如果用户当前正停留在该对话页面，则同步更新 UI
      if (conversationId === streamingId) {
        setHistory(prevHistory => {
          if (prevHistory.length === 0) return prevHistory;
          
          const lastQAPair = prevHistory[prevHistory.length - 1];
          
          // 构造新的 Pair
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
    }
  }, [currentAnswer, sources, isLoading, streamingId, conversationId]);


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

  const isStreamingCurrentSession = isLoading && streamingId === conversationId;

  const currentChatInfo = useMemo(() => {
    if (conversationId && history.length > 0) {
      // 获取第一条用户的问题作为标题
      const firstUserMsg = history.find(h => h.sources !== undefined); // QAPair结构
      const title = firstUserMsg?.question || "New Chat";
      return { id: conversationId, title, timestamp: Date.now() };
    }
    return null;
  }, [conversationId, history]);

  // 即使你切换了路由，这个 info 依然存在，因为它基于 streamingId 和 ref
  const streamingChatInfo = useMemo(() => {
    if (isLoading && streamingId && activeStreamRef.current && activeStreamRef.current.id === streamingId) {
        return {
            id: streamingId,
            title: activeStreamRef.current.question || "New Chat",
            timestamp: Date.now()
        };
    }
    return null;
  }, [isLoading, streamingId]);

  return (
    <div className="h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200">
      <VantaBackground />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
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
                generatingId={isLoading ? streamingId : null}
                currentChat={currentChatInfo}
                streamingChat={streamingChatInfo}
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
              <div className="relative ml-2 border-l border-gray-300 dark:border-gray-700 pl-4 h-8 flex items-center">
                {user ? (
                  // 已登录状态
                  <div 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    {/* 显示邮箱前缀 */}
                    <span className="text-sm font-medium hidden sm:block">
                      {user.email.split('@')[0]}
                    </span>
                    
                    {/* 头像圆圈 */}
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                      <UserIcon />
                    </div>

                    {/* 下拉菜单 */}
                    {showUserMenu && (
                      <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            logout(); 
                            setShowUserMenu(false); 
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <LogoutIcon />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // 未登录 (游客) 状态
                  <button 
                    onClick={() => setAuthModalOpen(true)}
                    className="p-1.5 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-all"
                    title="Login / Register"
                  >
                    <UserIcon />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className={`flex-grow pt-16 flex flex-col transition-all duration-300 ${isPinned ? 'pl-64' : 'pl-0'}`}>
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
                  streamingData={{ currentAnswer, sources, statusMessage, error, isLoading:isStreamingCurrentSession }}
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
            className={`fixed bottom-0 right-0 transition-all duration-300 ${isPinned ? 'left-64' : 'left-0'}`}
          />
        </>
      )}
      </div>
    </div>
  );
}

export default App;