import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants'; // 复用你的颜色配置

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'register' | 'verify';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, verify } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  
  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setError('');
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await login(email, password);
      onClose(); // 登录成功关闭弹窗
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await register(email, password);
      // 注册成功，跳转验证，保留 email 和 password 用于后续自动登录
      setView('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await verify(email, code);
      // 验证成功，自动登录
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      // 背景遮罩稍微深一点，为了突出白色的弹窗
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      // ✨ [核心] 背景改为纯白
      backgroundColor: '#ffffff',
      
      // 加上柔和的阴影，让卡片有浮起感
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      
      padding: '2.5rem 2rem', // 增加一点内边距，呼吸感更强
      borderRadius: '16px',   // 圆角加大
      width: '380px',
      maxWidth: '90%',
      
      // ✨ [核心] 文字改为深色
      color: '#333333',
      position: 'relative' as 'relative',
    },
    title: {
      fontSize: '1.8rem',
      marginBottom: '1.5rem',
      textAlign: 'center' as 'center',
      
      color: 'black',
      
      fontWeight: '700',
    },
    input: {
      width: '100%',
      padding: '14px',
      marginBottom: '1rem',
      
      // ✨ [核心] 输入框背景也是白色
      backgroundColor: '#ffffff',
      
      // 加上浅灰色边框来区分输入框和背景
      border: '1px solid #e5e7eb', // Tailwind gray-200
      
      borderRadius: '8px',
      
      // 输入文字颜色为黑色
      color: '#1f2937', 
      outline: 'none',
      fontSize: '1rem',
      transition: 'all 0.2s',
      // 给输入框加一点点内阴影，增加质感
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
    },
    button: {
      width: '100%',
      padding: '14px',
      
      // ✨ 按钮背景使用湖蓝色
      backgroundColor:  'black',
      
      color: '#ffffff', // 白字
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem',
      transition: 'transform 0.1s, filter 0.2s',
      boxShadow: `0 4px 14px ${COLORS.themeBlue}40`, // 按钮也带一点蓝色光晕
    },
    link: {
      color: '#6b7280', // 灰色文字 (Gray-500)
      fontSize: '0.9rem',
      textAlign: 'center' as 'center',
      marginTop: '1.5rem',
      cursor: 'pointer',
      transition: 'color 0.2s',
    },
    error: {
      color: '#ef4444', // 鲜艳的红色
      marginBottom: '1rem',
      fontSize: '0.9rem',
      textAlign: 'center' as 'center',
      backgroundColor: '#fef2f2', // 极淡的红色背景
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #fee2e2',
    },
    close: {
        position: 'absolute' as 'absolute',
        top: '20px',
        right: '20px',
        cursor: 'pointer',
        fontSize: '1.5rem',
        color: '#9ca3af', // 浅灰色关闭按钮
        transition: 'color 0.2s',
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.close} onClick={onClose}>✕</div>
        
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <h2 style={styles.title}>System Login</h2>
            {error && <div style={styles.error}>{error}</div>}
            <input 
              style={styles.input} 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              style={styles.input} 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'LOGIN'}
            </button>
            <div style={styles.link} onClick={() => { reset(); setView('register'); }}>
              No account? Register
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <h2 style={{...styles.title, color: COLORS.secondary}}>New User</h2>
            {error && <div style={styles.error}>{error}</div>}
            <input 
              style={styles.input} 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              style={styles.input} 
              type="password" 
              placeholder="Password (Min 8 chars)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button style={{...styles.button, backgroundColor: COLORS.secondary, color: '#fff'}} type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'REGISTER'}
            </button>
            <div style={styles.link} onClick={() => { reset(); setView('login'); }}>
              Have account? Login
            </div>
          </form>
        )}

        {view === 'verify' && (
          <form onSubmit={handleVerify}>
            <h2 style={styles.title}>Verify Email</h2>
            <p style={{marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem', textAlign: 'center'}}>
              Code sent to {email}
            </p>
            {error && <div style={styles.error}>{error}</div>}
            <input 
              style={{...styles.input, textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem'}} 
              type="text" 
              placeholder="000000" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              maxLength={6}
              required 
            />
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'ACTIVATE & LOGIN'}
            </button>
            <div style={styles.link} onClick={() => setView('register')}>
              Back
            </div>
          </form>
        )}
      </div>
    </div>
  );
};