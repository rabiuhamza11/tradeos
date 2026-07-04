'use client';
import { create } from 'zustand';

interface User { id: string; email: string; name: string; role: string; }
interface AuthState {
  user: User | null; token: string | null;
  setAuth: (u: User, t: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, token: null,
  setAuth: (user, token) => { localStorage.setItem('tradeos_token', token); localStorage.setItem('tradeos_user', JSON.stringify(user)); set({ user, token }); },
  logout: () => { localStorage.removeItem('tradeos_token'); localStorage.removeItem('tradeos_user'); set({ user: null, token: null }); },
  loadFromStorage: () => { const t = localStorage.getItem('tradeos_token'); const u = localStorage.getItem('tradeos_user'); if (t && u) set({ token: t, user: JSON.parse(u) }); },
}));
