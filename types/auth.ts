// src/types/auth.ts

export interface UserInfoVO {
  userId: string;
  username: string;
  nickname?: string;
  companyName?: string;
  position?: string;
  email?: string;
  avatar?: string;
  emailNotificationPreference: number;
  phoneNumber: string;
  region?: string;
}

export interface UserReturnInfoVO {
  token: string;
  user: UserInfoVO;
}

export interface APIResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  phoneNumber: string;
  token: string;
  info: UserInfoVO;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_email: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimResponse {
  status: string;
  migrated_count: number;
  message: string;
}

export interface ApiError {
  detail: string;
}