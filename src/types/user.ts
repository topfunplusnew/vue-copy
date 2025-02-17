import type { ICommon } from './base';
export interface IUser extends ICommon {
  name: string; // 用户名
  avatar: string; // 用户头像
}
