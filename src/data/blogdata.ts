// src/data/blogData.ts user blog in homeviwe

export interface BlogPost {
  id: number;
  image: string;
  avatar: string;
  username: string;
  title: string;
  likes: number;
  comments: number;
  coins: number;
  tags: string[];
  isNFT?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    image: 'https://via.placeholder.com/300x200?text=Blog+1',
    avatar: 'https://via.placeholder.com/50?text=A',
    username: 'Alice',
    title: 'Exploring the Best Places to Visit in 2025',  // 新添加的title
    likes: 23,
    comments: 5,
    coins: 10,
    tags: ['Sightseeing', 'Business'],
    isNFT: false
  },
  {
    id: 2,
    image: 'https://via.placeholder.com/300x200?text=Blog+2',
    avatar: 'https://via.placeholder.com/50?text=B',
    username: 'Bob',
    title: 'Educational Advancements in Modern Culture',  // 新添加的title
    likes: 45,
    comments: 12,
    coins: 20,
    tags: ['Educational', 'Culture'],
    isNFT: true,
  },
  {
    id: 3,
    image: 'https://via.placeholder.com/300x200?text=Blog+2',
    avatar: 'https://via.placeholder.com/50?text=B',
    username: 'Bob',
    title: 'The Future of NFTs in the Education Sector',  // 新添加的title
    likes: 45,
    comments: 12,
    coins: 20,
    tags: ['Educational', 'Culture'],
    isNFT: true,
  },
  {
    id: 4,
    image: 'https://via.placeholder.com/300x200?text=Blog+3',
    avatar: 'https://via.placeholder.com/50?text=C',
    username: 'Charlie',
    title: 'Exploring the Impact of AI on Urban Development',  // 新添加的title
    likes: 30,
    comments: 8,
    coins: 15,
    tags: ['AI', 'Urban Development'],
    isNFT: false,
  },
  {
    id: 5,
    image: 'https://via.placeholder.com/300x200?text=Blog+4',
    avatar: 'https://via.placeholder.com/50?text=D',
    username: 'David',
    title: 'The Rise of Smart Cities in Asia',  // 新添加的title
    likes: 50,
    comments: 15,
    coins: 25,
    tags: ['Smart Cities', 'Technology'],
    isNFT: false,
  },
  {
    id: 6,
    image: 'https://via.placeholder.com/300x200?text=Blog+5',
    avatar: 'https://via.placeholder.com/50?text=E',
    username: 'Eva',
    title: 'Blockchain and Its Potential in Sustainable Development',  // 新添加的title
    likes: 60,
    comments: 20,
    coins: 30,
    tags: ['Blockchain', 'Sustainability'],
    isNFT: true,
  },
  // 添加更多博客帖子数据...
];

