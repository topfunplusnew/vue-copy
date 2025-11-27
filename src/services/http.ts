import axios from 'axios';
import { Auth } from './auth.ts';
import { ElMessage } from 'element-plus';
import { UN_TRACKED_URL_PATH_LIST } from './config.ts';

export const auth = new Auth();

// 用于跟踪登录失效错误消息是否已显示
let loginExpiredMessageShown = false;
const MESSAGE_THROTTLE_TIME = 1000; // 1秒内不重复显示

// HTTP 状态 code corresponding friendly error messages
function getFriendlyErrorMessage(status: number, defaultMessage?: string): string {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request parameters, please check your input',
    401: 'Login expired, please login again',
    403: 'No permission to access this resource',
    404: 'Requested resource not found, please contact administrator',
    405: 'Request method not allowed, please contact administrator',
    408: 'Request timeout, please try again later',
    409: 'Resource conflict, please check and try again',
    413: 'Request data too large, please reduce data size',
    414: 'Request URL too long',
    415: 'Unsupported media type',
    422: 'Request parameter validation failed, please check your input',
    429: 'Too many requests, please try again later',
    500: 'Internal server error, please contact administrator!',
    501: 'Server does not support this feature',
    502: 'Gateway error, please try again later',
    503: 'Service temporarily unavailable, please try again later',
    504: 'Gateway timeout, please try again later',
    505: 'HTTP version not supported',
  };

  // If it's a 5xx error, return server error message
  if (status >= 500 && status < 600) {
    return statusMessages[status] || 'Internal server error, please contact administrator!';
  }

  // Return corresponding friendly message, or use default message or generic message
  return statusMessages[status] || defaultMessage || 'Request failed, please try again later';
}

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
    
    if (error && error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      
      // 获取友好的错误提示信息
      const friendlyMessage = getFriendlyErrorMessage(
        status,
        responseData?.error || responseData?.message || error.message
      );

      if (status === 401) {
        // 登录失效 - 避免短时间内重复显示错误消息
        // 检查是否在排除列表中，如果是则不显示错误消息
        if (!shouldSkipErrorMessage(error) && !loginExpiredMessageShown) {
          loginExpiredMessageShown = true;
          ElMessage.error(friendlyMessage);

          // 设置定时器，1秒后允许再次显示错误消息
          setTimeout(() => {
            loginExpiredMessageShown = false;
          }, MESSAGE_THROTTLE_TIME);
        }
        auth.del();
      } else if (status !== 200) {
        // 其他错误 - 避免短时间内重复显示错误消息
        // 检查是否在排除列表中，如果是则不显示错误消息
        if (!shouldSkipErrorMessage(error) && !loginExpiredMessageShown) {
          loginExpiredMessageShown = true;
          ElMessage.error(friendlyMessage);

          // 设置定时器，1秒后允许再次显示错误消息
          setTimeout(() => {
            loginExpiredMessageShown = false;
          }, MESSAGE_THROTTLE_TIME);
        }
      }
    } else if (error && !error.response) {
      // Network error or other non-HTTP errors
      if (!shouldSkipErrorMessage(error) && !loginExpiredMessageShown) {
        loginExpiredMessageShown = true;
        const networkError = error.code === 'ECONNABORTED' 
          ? 'Request timeout, please check your network connection' 
          : 'Network error, please check your network connection and try again';
        ElMessage.error(networkError);

        setTimeout(() => {
          loginExpiredMessageShown = false;
        }, MESSAGE_THROTTLE_TIME);
      }
    }
    
    return Promise.reject(error);
  },
);
