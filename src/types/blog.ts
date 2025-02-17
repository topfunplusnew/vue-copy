import type { ICommon } from './base';
import type { IUser } from './user';

export interface IBlogPost extends ICommon {
  title: string; // blog标题
  content: string; // blog内容
  image: string[]; // blog图片，最多9张
  tags: string[]; //标签
  likes: number; // 点赞数
  comments: number; // 评论数
  coins: number; // 价值
  isNFT?: boolean; // 是否nft
  user: IUser; // 用户数据
}
