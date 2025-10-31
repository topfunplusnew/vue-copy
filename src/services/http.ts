import axios from 'axios';
import { Auth } from './auth.ts';
import { ElMessage } from 'element-plus';
import { UN_TRACKED_URL_PATH_LIST } from './config.ts';

export const auth = new Auth();

// 用于跟踪登录失效错误消息是否已显示
let loginExpiredMessageShown = false;
const MESSAGE_THROTTLE_TIME = 1000; // 1秒内不重复显示

// 判断请求路径是否在排除列表中
function shouldSkipErrorMessage(error: unknown): boolean {
  const axiosError = error as {
    config?: { url?: string; baseURL?: string };
    response?: { config?: { url?: string; baseURL?: string } };
  };

  const requestUrl = axiosError?.config?.url || axiosError?.response?.config?.url || '';
  const baseURL = axiosError?.config?.baseURL || http.defaults.baseURL || '';

  // 获取相对路径（去除 baseURL 部分）
  let path = requestUrl;
  if (baseURL && requestUrl.startsWith(baseURL)) {
    path = requestUrl.replace(baseURL, '');
  }

  // 提取路径部分（去除查询参数和哈希）
  const pathname = path.split('?')[0].split('#')[0];

  // 检查是否在排除列表中
  return UN_TRACKED_URL_PATH_LIST.some(excludedPath =>
    pathname === excludedPath || pathname.startsWith(excludedPath)
  );
}

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
    if (error && error.response && error.response.status === 401) {
      // 登录失效 - 避免短时间内重复显示错误消息
      // 检查是否在排除列表中，如果是则不显示错误消息
      if (!shouldSkipErrorMessage(error) && !loginExpiredMessageShown) {
        loginExpiredMessageShown = true;
        ElMessage.error(error.response.data.error || error.message);

        // 设置定时器，1秒后允许再次显示错误消息
        setTimeout(() => {
          loginExpiredMessageShown = false;
        }, MESSAGE_THROTTLE_TIME);
      }
      auth.del();
    }
    if (error && error.response && error.response.status !== 200 && error.response.status !== 401) {
      // 其他错误 - 避免短时间内重复显示错误消息
      // 检查是否在排除列表中，如果是则不显示错误消息
      if (!shouldSkipErrorMessage(error) && !loginExpiredMessageShown) {
        loginExpiredMessageShown = true;
        ElMessage.error(error.response.data.error || error.message);

        // 设置定时器，1秒后允许再次显示错误消息
        setTimeout(() => {
          loginExpiredMessageShown = false;
        }, MESSAGE_THROTTLE_TIME);
      }
    }
    return Promise.reject(error);
  },
);
