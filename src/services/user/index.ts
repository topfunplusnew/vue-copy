import { http } from '../http';
import type { GetPaperViewHistoryParams, AddPaperViewHistoryData, UploadBioPdfData, UpdateUserProfileData, UserProfileData } from './type';

/**
 * 获取忘记密码验证码
 * @returns Promise 返回验证码图片的 Blob 对象
 */
export const getForgetPasswordCaptcha = () =>
  http.request({
    method: 'GET',
    url: '/user/forget-password/captcha',
    responseType: 'blob',
  });

/**
 * 发送忘记密码邮件
 * @param data 发送邮件的数据
 * @param data.email 用户邮箱
 * @param data.captcha 验证码
 * @param data.session_id 会话ID（从获取验证码接口返回）
 * @returns Promise
 */
export const sendForgetPasswordEmail = (data: { email: string; captcha: string; session_id: string }) =>
  http.request({
    method: 'POST',
    url: '/user/forget-password/send-email',
    data,
    headers: {
      'Content-Type': 'application/json',
    },
  });

/**
 * 重置密码
 * @param data 重置密码的数据
 * @param data.reset_token 重置令牌
 * @param data.email 用户邮箱
 * @param data.password 新密码
 * @param data.repeat_password 重复密码
 * @returns Promise
 */
export const resetPassword = (data: { reset_token: string; email: string; password: string; repeat_password: string }) =>
  http.request({
    method: 'POST',
    url: '/user/forget-password/reset',
    data,
    headers: {
      'Content-Type': 'application/json',
    },
  });

/**
 * 查询当前用户的论文查看历史
 * @param params 查询参数
 * @returns Promise
 */
export const getPaperViewHistory = (params?: GetPaperViewHistoryParams) =>
  http.request({
    method: 'GET',
    url: '/paper/view-history',
    params,
  });

/**
 * 新增论文查看历史
 * @param data 查看历史数据
 * @returns Promise
 */
export const addPaperViewHistory = (data: AddPaperViewHistoryData) =>
  http.request({
    method: 'POST',
    url: '/paper/view-history',
    data,
    headers: {
      'Content-Type': 'application/json',
    },
  });

/**
 * 上传用户简历PDF文件
 * @param data 文件上传数据
 * @param data.file 要上传的PDF文件
 * @returns Promise
 */
export const uploadBioPdf = (data: UploadBioPdfData) => {
  const formData = new FormData();
  formData.append('file', data.file);
  return http.request({
    method: 'POST',
    url: '/file/user/bio-pdf',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 获取用户资料
 * @returns Promise 返回用户资料数据
 */
export const getUserProfile = () =>
  http.request<UserProfileData>({
    method: 'GET',
    url: '/user/profile',
  });

/**
 * 更新用户资料
 * @param data 用户资料数据
 * @returns Promise
 */
export const updateUserProfile = (data: UpdateUserProfileData) =>
  http.request({
    method: 'PUT',
    url: '/user/profile',
    data,
    headers: {
      'Content-Type': 'application/json',
    },
  });
