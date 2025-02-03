import { defineStore } from 'pinia';
import { loginUser } from '../services/api';

export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials: { email: string; password: string }) {
      const response = await loginUser(credentials);
      localStorage.setItem('accessToken', response.token);
    }
  }
});
