import axios from 'axios';
import { Auth } from './auth.ts';
import { ElMessage } from 'element-plus';

export const auth = new Auth();

export function login(token: string) {
  auth.set(token);
}

export const http = axios.create({
  baseURL: import.meta.env.IPG_API_URL,
  // 创建axios实例
  validateStatus(status: number) {
    // 状态
    return status >= 200 && status < 300;
  },
  withCredentials: true, // 跨域设置
  timeout: 500000, // 设置超时
});
http.interceptors.request.use(
  (request) => {
    // 请求拦截
    const token = auth.get();
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },
  (err) => {
    console.log(`error`, err);
  },
);
http.interceptors.response.use(
  // 返回拦截
  (response) => {
    console.log(`response`, response);
    return response;
  },
  (error) => {
    console.log(`error`, error);
    if (error && error.response && error.response.status == 401) {
      // 登录失效
      auth.del();
    }
    if (error.status !== 200) {
      ElMessage.error(error.response.data.error || error.message);
    }
    return Promise.reject(error);
  },
);
