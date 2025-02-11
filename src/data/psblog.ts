// psblog.ts

export interface BlogPost {
  id: number;
  image: string;
  likes: number;
  comments: number;
  coins: number;
}

// 用于模拟生成博客数据（总共 50 篇博客）
export function generateBlogs(page: number, perPage: number): BlogPost[] {
  const blogs: BlogPost[] = [];
  const start = (page - 1) * perPage + 1;
  for (let i = 0; i < perPage; i++) {
    const id = start + i;
    if (id > 50) break;
    blogs.push({
      id,
      image: `https://via.placeholder.com/300x200?text=Post+${id}`,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      coins: Math.floor(Math.random() * 20),
    });
  }
  return blogs;
}

export interface UserInfo {
  id: string;
  joined: string;
  avatar: string;
  likes: number;
  coins: number;
  blogs: BlogPost[];
  followings:number;
  followers:number;
}

// 初始用户信息，并默认加载第一页博客（每页 10 篇）
export const userInfo: UserInfo = {
  id: '123456',
  joined: '2022-01-01',
  avatar: 'https://via.placeholder.com/150',
  likes: 120,
  coins: 350,
  blogs: generateBlogs(1, 10),
  followings:10000,
  followers:102000,
};
