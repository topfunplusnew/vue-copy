import axios from 'axios';
import { Auth } from './auth.ts';
import type { IPairToken, ILogin, IUserEdit } from '@/types/user.ts';
import type { IBlogPostCreate, IBlogPostimage } from '@/types/blog';

const auth = new Auth();
/**
 * 登出
 */
export function logout() {
  // 之后根据后台完成
  auth.del();
}
export function login(token: string) {
  auth.set(token);
}
const http = axios.create({
  baseURL: import.meta.env.IPG_API_URL,
  // 创建axios实例
  validateStatus(status: number) {
    // 状态
    return status >= 200 && status < 300;
  },
  withCredentials: true, // 跨域设置
  timeout: 500000, // 设置超时
});
http.interceptors.request.use((request) => {
  // 请求拦截
  const token = auth.get();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});
http.interceptors.response.use(
  // 返回拦截
  (response) => {
    return response;
  },
  (error) => {
    // alert(error.message);
    if (error && error.response && error.response.status == 401) {
      // 登录失效
      logout();
    }
    return Promise.reject(error);
  },
);

export const userLogin = (credentials: ILogin) =>
  new Promise((resole, reject) => {
    http
      .post('/user/login', credentials)
      .then((res) => {
        const data = res.data as IPairToken;
        login(data.access_token);
        resole(res);
      })
      .catch((e) => {
        reject(e);
      });
  });


// export const multiRoundChat = (data: IMultiRoundChat) => http.post('/chat', data);

export const userSignup = (data: IUserEdit) => http.post('/user/signup', data);

export const userProfile = () => http.get('/user/profile');

export const userModify = (data: IUserEdit) => http.put('/user/profile', data);

export const blogPost = (data: IBlogPostCreate) => http.post('/blog', data);

export const Postimage = (data: IBlogPostimage) => http.post('/file/blog', data.image, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const PostAvatar = (data: IBlogPostimage) => http.post('/file/avatar', data.image, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const getBlogPost = (id: string) => http.get(`/blog/${id}`);

export const getMyBlogList = () => http.get('/my_blogs');

export const getAllBlogList = () => http.get('/blogs');



