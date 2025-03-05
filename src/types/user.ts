import type { ICommon } from './base';

export interface IUser extends ICommon {
  name: string; // 用户名
  avatar: string; // 用户头像
  likes: number; // 点赞数
  coins: number; // 金币数
  followers: number; // 粉丝数
  followings: number; // 关注数
}

export interface ILogin {
  email: string; // 登录邮箱
  password: string; // 登录密码
}

export interface IUserSignup {
  email: string;
  password: string;
  password_confirm: string;
  name: string;
}

export interface IUserEdit {
  name: string; // 可以修改用户名
  avatar: string; // 可以修改用户头像
  email?: string;
  password?: string;
}

export interface IPairToken {
  access_token: string;
  refresh_token: string;
}
