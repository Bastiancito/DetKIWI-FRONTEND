import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getBaseURL } from './config';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  rol_id?: number;
  sede_id?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface JwtPayload {
  exp?: number;
}

interface AuthErrorResponse {
  msg?: string;
  error?: string;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let interceptorsConfigured = false;
let authRedirectInProgress = false;

class AuthService {
  private baseURL: string;
  private refreshInFlight: Promise<string | null> | null = null;
  
  constructor() {
    this.baseURL = getBaseURL();
    this.setupAxiosInterceptors();
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private decodeTokenPayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedBase64)) as JwtPayload;
      return payload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return true;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds + 30;
  }

  private hasValidAccessToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }

  private isAuthEndpoint(url?: string): boolean {
    return !!url && (
      url.includes('/auth/login')
      || url.includes('/auth/register')
      || url.includes('/auth/refresh')
    );
  }

  private isJwtAuthFailure(error: AxiosError): boolean {
    const status = error.response?.status;
    if (status === 401) {
      return true;
    }

    if (status !== 422 && status !== 403) {
      return false;
    }

    const data = (error.response?.data || {}) as AuthErrorResponse;
    const rawMessage = `${data.msg || ''} ${data.error || ''}`.toLowerCase();

    return rawMessage.includes('token')
      || rawMessage.includes('jwt')
      || rawMessage.includes('expired')
      || rawMessage.includes('signature')
      || rawMessage.includes('authorization');
  }

  private async requestTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/auth/refresh`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
          },
        }
      );

      const newAccessToken = response.data?.access_token;
      const newRefreshToken = response.data?.refresh_token || refreshToken;

      if (!newAccessToken) {
        return null;
      }

      this.saveTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.requestTokenRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }

    return this.refreshInFlight;
  }

  private setupAxiosInterceptors(): void {
    if (interceptorsConfigured) {
      return;
    }

    interceptorsConfigured = true;

    axios.interceptors.request.use((config) => {
      const token = this.getToken();
      if (!token) {
        return config;
      }

      config.headers = config.headers || {};
      const existingAuthHeader = String(config.headers.Authorization || '');

      if (!existingAuthHeader || existingAuthHeader.startsWith('Bearer ')) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (!originalRequest || !this.isJwtAuthFailure(error)) {
          return Promise.reject(error);
        }

        if (originalRequest._retry || this.isAuthEndpoint(originalRequest.url)) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        const newAccessToken = await this.refreshAccessToken();
        if (!newAccessToken) {
          this.logout();
          this.forceLoginRedirect();
          return Promise.reject(error);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axios(originalRequest);
      }
    );
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private forceLoginRedirect(): void {
    if (authRedirectInProgress) {
      return;
    }

    if (window.location.pathname === '/login') {
      return;
    }

    authRedirectInProgress = true;
    window.location.replace('/login');
  }

  async ensureValidSession(): Promise<boolean> {
    if (this.hasValidAccessToken()) {
      return true;
    }

    const refreshedToken = await this.refreshAccessToken();
    if (!refreshedToken) {
      this.logout();
      this.forceLoginRedirect();
      return false;
    }

    return true;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, credentials, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.access_token) {
        this.saveTokens(response.data.access_token, response.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return {
        data: response.data,
        status: response.status,
        message: 'Login exitoso'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error en el login'
      };
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/register`, userData, {
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Registro exitoso'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error en el registro'
      };
    }
  }

  logout(): void {
    this.clearTokens();
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:logout'));
  }

  isAuthenticated(): boolean {
    return !!this.getToken() || !!this.getRefreshToken();
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

const authService = new AuthService();

export default authService;
export type { LoginCredentials, LoginResponse, RegisterData, ApiResponse };