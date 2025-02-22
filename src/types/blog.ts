import type { ICommon } from './base';
import type { IUser } from './user';


export interface IBlogPost extends ICommon {
  id: number;
  image: string[];
  user: {
    avatar: string;
    name: string;
  };
  title: string;
  content: string;
  likes: number;
  comments: number;
  coins: number;
  tags: string[];
  isNFT: boolean;
}

export interface IBlogPostCreate {
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  preferences?: string[];
  isNFT?: boolean;
}

export interface IBlogPostimage {
  image: FormData;
}
