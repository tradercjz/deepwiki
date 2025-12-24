import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import { authApi } from '../api/client'; // 确保你的 client 有新定义的接口

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  
  // 表单状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    smsVerifyCode: '',
    username: '', // 真实姓名
    nickname: '',
    email: '',
    company: '',
    position: '',
    region: '',
  });

  // 短信倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const reset = () => {
    setError('');
    setLoading(false);
    setFormData({
      phoneNumber: '', password: '', confirmPassword: '', smsVerifyCode: '',
      username: '', nickname: '', email: '', company: '', position: '', region: '',
    });
  };

  // 发送短信验证码
  const handleSendSms = async () => {
    if (!/^1[3-9]\d{9}$/.test(formData.phoneNumber)) {
      setError("请输入正确的手机号");
      return;
    }
    try {
      await authApi.sendSms(formData.phoneNumber);
      setCountdown(60);
      setError('');
    } catch (err: any) {
      setError(err.message || '发送失败');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.phoneNumber, formData.password);
      onClose();
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("两次输入的密码不一致");
        return;
    }
    setError('');
    setLoading(true);
    try {
      // 调用 context 中的 register，传入完整对象
      await register(formData as any); 
      alert("注册成功，请登录");
      setView('login');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#ffffff',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      padding: '2rem',
      borderRadius: '16px',
      width: view === 'login' ? '380px' : '450px', // 注册字段多，稍微调宽一点
      maxHeight: '90vh',
      overflowY: 'auto' as 'auto',
      color: '#333333',
      position: 'relative' as 'relative',
      transition: 'all 0.3s ease',
    },
    title: {
      fontSize: '1.6rem',
      marginBottom: '1.2rem',
      textAlign: 'center' as 'center',
      color: 'black',
      fontWeight: '700',
    },
    label: {
      display: 'block',
      fontSize: '0.85rem',
      color: '#666',
      marginBottom: '4px',
      marginLeft: '2px',
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '0.8rem',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      color: '#1f2937', 
      outline: 'none',
      fontSize: '0.95rem',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
    },
    smsContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '0.8rem',
    },
    smsButton: {
      padding: '0 15px',
      height: '45px',
      whiteSpace: 'nowrap' as 'nowrap',
      backgroundColor: countdown > 0 ? '#f3f4f6' : '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      color: countdown > 0 ? '#999' : COLORS.themeBlue,
      cursor: countdown > 0 ? 'default' : 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
    },
    button: {
      width: '100%',
      padding: '14px',
      backgroundColor: 'black',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '0.5rem',
      boxShadow: `0 4px 14px ${COLORS.themeBlue}40`,
    },
    link: {
      color: '#6b7280',
      fontSize: '0.85rem',
      textAlign: 'center' as 'center',
      marginTop: '1.2rem',
      cursor: 'pointer',
    },
    error: {
      color: '#ef4444',
      marginBottom: '1rem',
      fontSize: '0.85rem',
      textAlign: 'center' as 'center',
      backgroundColor: '#fef2f2',
      padding: '8px',
      borderRadius: '6px',
      border: '1px solid #fee2e2',
    },
    close: {
        position: 'absolute' as 'absolute',
        top: '20px',
        right: '20px',
        cursor: 'pointer',
        fontSize: '1.2rem',
        color: '#9ca3af',
    },
    row: {
        display: 'flex',
        gap: '10px'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.close} onClick={onClose}>✕</div>
        
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <h2 style={styles.title}>Official Login</h2>
            {error && <div style={styles.error}>{error}</div>}
            
            <label style={styles.label}>Phone Number</label>
            <input 
              style={styles.input} 
              type="tel" 
              placeholder="138xxxx0000" 
              value={formData.phoneNumber} 
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
              required 
            />
            
            <label style={styles.label}>Password</label>
            <input 
              style={styles.input} 
              type="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
            
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
            <div style={styles.link} onClick={() => { reset(); setView('register'); }}>
              No account? Register Official Account
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <h2 style={styles.title}>Register</h2>
            {error && <div style={styles.error}>{error}</div>}
            
            <label style={styles.label}>Phone Number</label>
            <input 
              style={styles.input} 
              type="tel" 
              placeholder="Phone Number" 
              value={formData.phoneNumber} 
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
              required 
            />

            <label style={styles.label}>Verification Code</label>
            <div style={styles.smsContainer}>
                <input 
                    style={{...styles.input, marginBottom: 0}} 
                    type="text" 
                    placeholder="6-digit code" 
                    value={formData.smsVerifyCode} 
                    onChange={e => setFormData({...formData, smsVerifyCode: e.target.value})} 
                    required 
                />
                <button 
                    type="button" 
                    style={styles.smsButton} 
                    onClick={handleSendSms}
                    disabled={countdown > 0}
                >
                    {countdown > 0 ? `${countdown}s` : 'Get Code'}
                </button>
            </div>

            <div style={styles.row}>
                <div style={{flex: 1}}>
                    <label style={styles.label}>Real Name</label>
                    <input 
                        style={styles.input} 
                        type="text" 
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        required 
                    />
                </div>
                <div style={{flex: 1}}>
                    <label style={styles.label}>Nickname</label>
                    <input 
                        style={styles.input} 
                        type="text" 
                        value={formData.nickname} 
                        onChange={e => setFormData({...formData, nickname: e.target.value})} 
                    />
                </div>
            </div>

            <label style={styles.label}>Email</label>
            <input 
              style={styles.input} 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />

            <div style={styles.row}>
                <div style={{flex: 1}}>
                    <label style={styles.label}>Company</label>
                    <input 
                        style={styles.input} 
                        type="text" 
                        value={formData.company} 
                        onChange={e => setFormData({...formData, company: e.target.value})} 
                        required 
                    />
                </div>
                <div style={{flex: 1}}>
                    <label style={styles.label}>Position</label>
                    <input 
                        style={styles.input} 
                        type="text" 
                        value={formData.position} 
                        onChange={e => setFormData({...formData, position: e.target.value})} 
                        required 
                    />
                </div>
            </div>

            <label style={styles.label}>Region</label>
            <input 
              style={styles.input} 
              type="text" 
              placeholder="e.g. Shanghai"
              value={formData.region} 
              onChange={e => setFormData({...formData, region: e.target.value})} 
              required 
            />

            <label style={styles.label}>Password</label>
            <input 
              style={styles.input} 
              type="password" 
              placeholder="8-16 chars, letters & numbers" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />

            <label style={styles.label}>Confirm Password</label>
            <input 
              style={styles.input} 
              type="password" 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              required 
            />

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'REGISTER'}
            </button>
            
            <div style={styles.link} onClick={() => { reset(); setView('login'); }}>
              Have account? Login
            </div>
          </form>
        )}
      </div>
    </div>
  );
};