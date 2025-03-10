// psblog.ts personal profile

import type { IBlogPost } from '@/types/blog';
import macauImg from '@/assets/macau.jpg';

// 生成随机数的辅助函数
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// 随机选择数组中的一个元素

// 标签列表
const tags = ['Sightseeing', 'Educational', 'Business', 'Medical', 'Gastronomy', 'Culture'];

// 随机生成2-4个标签
const generateTags = () => {
  const numTags = randomInt(2, 4);
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
};

// 生成随机博客数据
const generateBlog = (id: number): IBlogPost => ({
  id,
  image: [macauImg],
  user: {
    avatar: `https://via.placeholder.com/50?text=${String.fromCharCode(65 + (id % 26))}`,
    name: `User ${id}`,
  },
  title: `Travel Experience ${id}`,
  content: `This is a randomly generated blog post content for post ${id}. It contains some interesting travel experiences and stories.`,
  likes: randomInt(10, 1000),
  comments: randomInt(5, 100),
  coins: randomInt(1, 50),
  tags: generateTags(),
  isNFT: Math.random() < 0.3, // 30%的概率是NFT
});

// 生成50个博客帖子
export const generateBlogs = (): IBlogPost[] => {
  return Array.from({ length: 50 }, (_, i) => generateBlog(i + 1));
};

export interface UserInfo {
  id: string;
  joined: string;
  avatar: string;
  name: string;
  likes: number;
  coins: number;
  blogs: IBlogPost[];
  followings: number;
  followers: number;
}

// 初始用户信息，并默认加载第一页博客（每页 10 篇）
export const userInfo: UserInfo = {
  id: '123456',
  joined: '2022-01-01',
  avatar: 'https://via.placeholder.com/150',
  name: 'Travel Explorer',
  likes: randomInt(1000, 5000),
  coins: randomInt(100, 1000),
  blogs: generateBlogs(),
  followings: randomInt(5000, 15000),
  followers: randomInt(50000, 150000),
};

export type BlogPost = IBlogPost;
