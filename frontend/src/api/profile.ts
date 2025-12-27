/**
 * Profile API Service
 * API endpoints for user profile management
 */

import apiClient from './client';
import { User } from './auth';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

export interface ChangePasswordResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export const profileApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/api/profile/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await apiClient.put<ProfileResponse>('/api/profile/me', data);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await apiClient.put<ChangePasswordResponse>('/api/profile/password', data);
    return response.data;
  },
};

