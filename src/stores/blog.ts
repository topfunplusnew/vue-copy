import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAllBlogList, getBlogPost, comment2Blog, comment2Comment, myblogedit, blogPost } from '@/services/api';
import type { IBlogPost, IBlogReq, IBlogPostCreate } from '@/types/blog';

export const useBlogStore = defineStore('blog', () => {
  const blogs = ref<IBlogPost[]>([]); // blog数组
  const condition = ref<IBlogReq>({}); // 查询blog列表的条件

  const blog = ref<IBlogPost>(); // 单独blog

  const postData = ref<IBlogPostCreate>({
    title: '',
    content: '',
    image: [],
    tags: [],
    social_filters: 0,
    isNFT: false,
  }); // 发布blog的数据
  function userPostblog() {
    return blogPost(postData.value);
  }
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

  function editmyblog(blogId: number, blog: IBlogPost) {
    return myblogedit(blogId, blog);
  }

  function commenttoBlog(blogId: number, comment: string) {
    return comment2Blog(blogId, comment);
  }
  function commenttoComment(commentId: number, comment: string) {
    return comment2Comment(commentId, comment);
  }
  return { blogs, condition, blog, postData, userPostblog,getBlogList, getBlogByID, clearBlog, commenttoBlog, commenttoComment, editmyblog };
});
