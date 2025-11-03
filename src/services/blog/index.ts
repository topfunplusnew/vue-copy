import { http } from '../http';

interface UpdateBlogReq {
  id: number;
  title: string;
  content: string;
  social_filters: number[];
  tags: string[];
  image: string[];
  location: string[];
  isNFT: boolean;
}

export const updateBlog = (data: UpdateBlogReq) =>
  http.request({
    method: 'PUT',
    url: '/blog',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
  });

