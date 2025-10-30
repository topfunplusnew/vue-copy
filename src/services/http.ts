import axios from 'axios';
import { Auth } from './auth.ts';
import { ElMessage } from 'element-plus';

export const auth = new Auth();

// 用于跟踪登录失效错误消息是否已显示
let loginExpiredMessageShown = false;
const MESSAGE_THROTTLE_TIME = 1000; // 1秒内不重复显示

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
      // 登录失效 - 避免短时间内重复显示错误消息
      if (!loginExpiredMessageShown) {
        loginExpiredMessageShown = true;
        ElMessage.error('登录失效，请重新登录');

        // 设置定时器，1秒后允许再次显示错误消息
        setTimeout(() => {
          loginExpiredMessageShown = false;
        }, MESSAGE_THROTTLE_TIME);
      }
      auth.del();
    }
    return Promise.reject(error);
  },
);
