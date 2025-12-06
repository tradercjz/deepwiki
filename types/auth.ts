// src/types/auth.ts

export interface User {
  email: string;
  token: string;
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