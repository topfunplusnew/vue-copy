import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAllBlogList, getBlogPost, comment2Blog, blogSocialFilters,
  comment2Comment, myblogedit, blogPost, Postimage, comments, getOsBlogList } from '@/services/api';
import type { IBlogPage, IBlog, IBlogReq, IBlogPostCreate, ISocialFilter } from '@/types/blog';
import { INIT_PAGINATION } from '@/types/service';
import type { UploadFile } from 'element-plus';

export const useBlogStore = defineStore('blog', () => {
  const blogs = ref<IBlogPage>(INIT_PAGINATION); // blog列表数据
  const condition = ref<IBlogReq>({}); // 查询blog列表的条件
  const socialFilters = ref<ISocialFilter[]>([]); // 社会过滤器
  const blog = ref<IBlog>(); // 单独blog
  const blogos = ref<IBlogPage>(INIT_PAGINATION); // 官方博客列表

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
  function userPostimage(file: UploadFile) {
    const formData = new FormData();
    if(file.raw) formData.append('files', file.raw);
    return new Promise((resolve, reject) => {
      Postimage({ image: formData }).then(res => {
        const arr = res.data.success as string[];
        for (const url of arr) {
          createData.value.image.push(url);
        }
        resolve(res);
      }).catch((e) => {
        reject(e);
      });
    });
  }
  /**
   * 获取blog列表
   * @returns
   */
  function getBlogList(refresh:boolean = false) {
    return new Promise((resovle, reject) =>{
      if(refresh) {
        blogs.value.args.page = 1;
      } else {
        if(blogs.value.has_next) {
          blogs.value.args.page = (blogs.value.args.page||1) + 1;
        }else {
          return reject({});
        }
      }
      blogs.value.loading = true;
      getAllBlogList(blogs.value.args).then((res) => {
        const data = res.data;
        if(!refresh && blogs.value?.items.length)
          data.items = [...(blogs.value?.items || []), ...data.items];
        blogs.value = data;
        resovle(res);
      }).catch(e => reject(e)).finally(()=> blogs.value.loading = false);
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
    /**
   * 获取官方博客列表
   * @returns
   */
  function getBlogosList(refresh:boolean = false) {
    return new Promise((resovle, reject) =>{
      if(refresh) {
        blogos.value.args.page = 1;
      } else {
        if(blogos.value.has_next) {
          blogos.value.args.page = (blogos.value.args.page||1) + 1;
        }else {
          return reject({});
        }
      }
      blogos.value.loading = true;
      getOsBlogList(blogos.value.args).then((res) => {
        const data = res.data;
        if(!refresh && blogos.value?.items.length)
          data.items = [...(blogos.value?.items || []), ...data.items];
        blogos.value = data;
        resovle(res);
      }).catch(e => reject(e)).finally(() => blogos.value.loading = false);
    });


  }

  function clearBlog() {
    blog.value = <IBlog>{};
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
    blogs, condition, blog, createData, socialFilters,blogos,
    commentPermission,
    getSocialFilter, userPostblog,getBlogList, getBlogByID, clearBlog, userPostimage,
    commenttoBlog, commenttoComment, editmyblog, getComments,
    getBlogosList
  };
});
