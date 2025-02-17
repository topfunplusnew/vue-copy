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
