import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAllBlogList, getBlogPost, comment2Blog, blogSocialFilters, 
  comment2Comment, myblogedit, blogPost, Postimage, comments } from '@/services/api';
import type { IBlogPost, IBlogReq, IBlogPostCreate, ISocialFilter } from '@/types/blog';

export const useBlogStore = defineStore('blog', () => {
  const blogs = ref<IBlogPost[]>([]); // blog数组
  const condition = ref<IBlogReq>({}); // 查询blog列表的条件
  const socialFilters = ref<ISocialFilter[]>([]); // 社会过滤器
  const blog = ref<IBlogPost>(); // 单独blog

  const createData = ref<IBlogPostCreate>({
    title: '',
    content: '',
    image: [],
    tags: [],
    social_filters: [],
    comment_permission: 0,
    isNFT: false,
  });

  const commentPermission = [{id: 0, name: 'Everyone'}, {id: 10, name: 'Followers'}, {id: 11, name: 'Only me'}];
  /**
   * 获取社会过滤器
   * @returns Promise
   */
  function getSocialFilter() {
    return blogSocialFilters().then(({data}) => {
      socialFilters.value = data;
    });
  }
  /**
   * 发布blog
   * @returns Promise
   */
  function userPostblog() {
    return blogPost(createData.value);
  }
  function userPostimage(file: any) {
    const formData = new FormData();
    formData.append('files', file.raw);
    return new Promise((resolve, reject) => {
      Postimage({ image: formData }).then(({data}) => {
        const arr = data.success as string[];
        for (const url of arr) {
          createData.value.image.push(url);
        }
        resolve(data);
      }).catch((e) => {
        reject(e);
      });
    });
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
   * 加载更多博客（用于无限滚动）
   * @param page 页码
   * @returns Promise
   */
  function loadMoreBlogs(page: number) {
    // 添加页码到查询条件
    const queryParams = { ...condition.value, page };
    
    return getAllBlogList(queryParams)
      .then(({ data }) => {
        // 将新加载的博客追加到现有列表，而不是替换
        if (data.blogs && data.blogs.length > 0) {
          blogs.value = [...blogs.value, ...data.blogs];
        }
        return data.blogs || [];
      })
      .catch((e) => {
        console.error('Failed to load more blogs:', e);
        return [];
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

  function editmyblog() {
    return myblogedit(createData.value);
  }

  function commenttoBlog(blogId: number, comment: string) {
    return comment2Blog(blogId, comment);
  }
  function commenttoComment(commentId: number, comment: string) {
    return comment2Comment(commentId, comment);
  }
  function getComments(commentId: number) {
    return comments(commentId).then(({data}) => {
      if (blog.value) {
        for(const comment of blog.value.comments) {
          if(comment.id === commentId) {
            comment.replies = data.list;
          }
        }
      }
    });
  }
  return { 
    blogs, condition, blog, createData, socialFilters, 
    commentPermission,
    getSocialFilter, userPostblog,getBlogList, getBlogByID, clearBlog, userPostimage,
    commenttoBlog, commenttoComment, editmyblog, loadMoreBlogs, getComments };
});
