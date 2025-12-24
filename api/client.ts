// src/api/client.ts
import { LoginResponse, ConversationSummary, ClaimResponse, UserReturnInfoVO } from '../types/auth';
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
  // 发送短信
  sendSms: (phoneNumber: string) => 
    request<boolean>(`/auth/verification-codes/sms?phoneNumber=${phoneNumber}`, { method: 'POST' }),

  // 检查昵称
  checkNickname: (nickname: string) =>
    request<boolean>(`/auth/users/nickname/availability?nickname=${nickname}`, { method: 'GET' }),

  // 注册
  register: (data: any) => 
    request<boolean>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, source: 1 }) // source: 1 代表本系统
    }),

  // 登录
  login: async (phoneNumber: string, password: string): Promise<UserReturnInfoVO> => {
    // 注意：后端现在接收的是 JSON 格式的 UserLoginDTO
    return request<UserReturnInfoVO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password })
    });
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

export const cloudApi = {
  // 获取状态
  getStatus: () => request<{ status: 'running' | 'stopped' | 'creating' | 'error' }>('/cloud/workspace'),
  
  // 启动/创建
  create: () => request<{ status: string, url: string }>('/cloud/workspace', { method: 'POST' }),
  
  // 销毁
  delete: () => request<void>('/cloud/workspace', { method: 'DELETE' }),
};

export const agentApi = {
  // Agent Chat 的 Endpoint URL
  chatEndpoint: `${API_BASE_URL}/api/v1/agent/chat`,
};