import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAllBlogList, getBlogPost } from '@/services/api';
import type { IBlogPost } from '@/types/blog';
import type { IBlogReq } from '@/types/blog';

export const useBlogStore = defineStore('blog', () => {
  const blogs = ref<IBlogPost[]>([]); // blog数组
  const condition = ref<IBlogReq>({}); // 查询blog列表的条件

  const blog = ref<IBlogPost>(); // 单独blog

  /**
   * 获取blog列表
   * @returns
   */
  function getBlogList() {
    return getAllBlogList(condition.value)
      .then(({ data }) => {
        blogs.value = data.blogs;
      })
      .catch((e) => {
        console.log(e);
      });
  }
  /**
   * 根据id获取blog
   * @param id
   * @returns
   */
  function getBlogByID(id: number) {
    return getBlogPost(id.toString())
      .then(({ data }) => {
        blog.value = data;
      })
      .catch((e) => {
        console.log(e);
      });
  }
  function clearBlog() {
    blog.value = <IBlogPost>{};
  }
  return { blogs, condition, blog, getBlogList, getBlogByID, clearBlog };
});
