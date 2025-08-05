import type { ICommon } from './base';
import type { IPagination, IRequest } from './service';
import type { IUser } from './user';

export interface IBlog extends ICommon {
  image: string[];
  files: string[];
  user: IUser;
  title: string;
  content: string;
  likes: number;
  comments_count: number;
  comments: IBlogComment[];
  location: string[];
  coins: number;
  tags: string[];
  isNFT: boolean;
  social_filters: ISocialFilter[];
}
export interface IBlogPage extends IPagination {
  args: IBlogReq;
  items: IBlog[];
}

export interface IBlogReq extends IRequest {
  keyword?: string; // 关键字
  'social_filter[]'?: number[]; // 标签
}

export interface IBlogPostCreate {
  id?: number;
  title: string;
  content: string;
  image: string[];
  tags: string[];
  location: string[];
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

export const INIT_BLOG_POST = {
  title: '',
  content: '',
  image: [],
  tags: [],
  location: [],
  social_filters: [],
  comment_permission: 0,
  isNFT: false,
};
