// src/data/blogPosts.ts for iPologo blog data in blogview.vue
export interface BlogPost {
  id: string;
  title: string;
  readingTime: string;
  categories: string[];
  content?: string;
  image?: string;
  author?: {
    name: string;
    avatar: string;
  };
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
  tags?: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Technology, Leisure, and Budget: The Future of Travel',
    readingTime: '12 min read',
    categories: ['Technology', 'Leisure', 'Budget'],
    content: `The future of travel is being shaped by technological advancements, changing leisure preferences, and budget considerations. As we move forward, we're seeing an increasing integration of AI and virtual reality in travel planning.

    Smart tourism is becoming the norm, with AI-powered personalized recommendations and virtual tours allowing travelers to preview destinations before booking. This not only enhances the planning experience but also helps in making more informed decisions about where to spend your travel budget.`,
    image: 'https://picsum.photos/800/400?random=1',
    author: {
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john'
    },
    stats: {
      likes: 156,
      comments: 24,
      shares: 38
    },
    tags: ['#FutureTravel', '#TechTrends', '#TravelBudget']
  },
  {
    id: '2',
    title: 'AI and The Travel Industry',
    readingTime: '05 min read',
    categories: ['AI', 'Innovation'],
    content: `Artificial Intelligence is revolutionizing the travel industry in unprecedented ways. From personalized recommendations to automated booking systems, AI is making travel more accessible and efficient than ever before.

    One of the most significant impacts of AI in travel is in customer service. Chatbots and virtual assistants are now handling everything from flight bookings to hotel inquiries, providing instant responses 24/7.`,
    image: 'https://picsum.photos/800/400?random=2',
    author: {
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=jane'
    },
    stats: {
      likes: 243,
      comments: 32,
      shares: 56
    },
    tags: ['#AI', '#TravelTech', '#Innovation']
  }
]
