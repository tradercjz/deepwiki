// src/api/client.ts
import { LoginResponse, ConversationSummary, ClaimResponse } from '../types/auth';
import { API_BASE_URL } from '../config';

// 通用请求封装
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // 如果不是 FormData (上传图片) 且没设置 Content-Type，默认 JSON
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 尝试解析错误信息
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) { /* ignore json parse error */ }
    
    // 如果是 401，可能需要处理 token 过期（这里简单抛出错误，由 Context 处理登出）
    if (response.status === 401) {
        window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    throw new Error(errorMessage);
  }

  // 如果状态码是 204，直接返回空对象，不要尝试解析 JSON
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const authApi = {
  // 注册
  register: (email: string, password: string) => 
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  // 验证验证码
  verify: (email: string, code: string) => 
    request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    }),

  // 登录 (OAuth2 Password Flow)
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const params = new URLSearchParams();
    params.append('username', email); // 后端 FastAPI OAuth2 默认要求 username 字段
    params.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
    }
    return response.json();
  },
};

export const historyApi = {
  // 批量认领游客数据
  claim: (ids: string[]) => 
    request<ClaimResponse>('/history/claim', {
      method: 'POST',
      body: JSON.stringify(ids)
    }),

  // 获取云端列表
  list: () => request<ConversationSummary[]>('/history/conversations'),
  
  // 获取单条详情
  get: (id: string) => request<any>(`/rag/conversations/${id}`),

  delete: (id: string) => 
    request<void>(`/history/conversations/${id}`, {
      method: 'DELETE'
    }),
};