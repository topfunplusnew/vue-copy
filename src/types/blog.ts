import type { ICommon } from './base';
import type { IRequest } from './service';
import type { IUser } from './user';

export interface IBlogPost extends ICommon {
  id: number;
  image: string[];
  user: IUser;
  title: string;
  content: string;
  likes: number;
  comments_count: number;
  comments: IBlogComment[];
  coins: number;
  tags: string[];
  isNFT: boolean;
}

export interface IBlogReq extends IRequest {
  keyword?: string; // 关键字
  tag?: string; // 标签
}

export interface IBlogPostCreate {
  title: string;
  content: string;
  image: string[];
  tags: string[];
  social_filters: number[];
  comment_permission: number;
  isNFT?: boolean;
}

export interface ISocialFilter {
  id: number;
  name: string;
  icon: string;
}

export interface IBlogPostimage {
  image: FormData;
}

export interface IBlogComment extends ICommon {
  content: string; // 评论内容
  blog_id: number; // blog id
  user: IUser;
  replies: IBlogComment[];
  total_replies: number;
}

export interface IBlogEdit {
  title: string;
  content: string;
  image?: string[];
  tags?: string[];
  preferences?: string[];
  isNFT?: boolean;
}
