import { http } from '../http';

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
