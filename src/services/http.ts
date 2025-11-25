import axios from 'axios';
import { Auth } from './auth.ts';
import { ElMessage } from 'element-plus';
import { UN_TRACKED_URL_PATH_LIST } from './config.ts';

export const auth = new Auth();

// 用于跟踪登录失效错误消息是否已显示
let loginExpiredMessageShown = false;
const MESSAGE_THROTTLE_TIME = 1000; // 1秒内不重复显示

// HTTP 状态码对应的友好提示信息
function getFriendlyErrorMessage(status: number, defaultMessage?: string): string {
  const statusMessages: Record<number, string> = {
    400: '请求参数错误，请检查输入信息',
    401: '登录已过期，请重新登录',
    403: '没有权限访问该资源',
    404: '请求的资源不存在，请联系管理员',
    405: '请求方法不允许，请联系管理员',
    408: '请求超时，请稍后重试',
    409: '资源冲突，请检查后重试',
    413: '请求数据过大，请减少数据量',
    414: '请求URL过长',
    415: '不支持的媒体类型',
    422: '请求参数验证失败，请检查输入信息',
    429: '请求过于频繁，请稍后重试',
    500: '服务器内部错误，请联系管理员！',
    501: '服务器不支持该功能',
    502: '网关错误，请稍后重试',
    503: '服务暂时不可用，请稍后重试',
    504: '网关超时，请稍后重试',
    505: 'HTTP版本不支持',
  };

  // 如果是 5xx 错误，返回服务器错误提示
  if (status >= 500 && status < 600) {
    return statusMessages[status] || '服务器内部错误，请联系管理员！';
  }

  // 返回对应的友好提示，如果没有则使用默认消息或通用提示
  return statusMessages[status] || defaultMessage || '请求失败，请稍后重试';
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
      // 网络错误或其他非 HTTP 错误
      if (!shouldSkipErrorMessage(error) && !loginExpiredMessageShown) {
        loginExpiredMessageShown = true;
        const networkError = error.code === 'ECONNABORTED' 
          ? '请求超时，请检查网络连接' 
          : '网络错误，请检查网络连接后重试';
        ElMessage.error(networkError);

        setTimeout(() => {
          loginExpiredMessageShown = false;
        }, MESSAGE_THROTTLE_TIME);
      }
    }
    
    return Promise.reject(error);
  },
);
