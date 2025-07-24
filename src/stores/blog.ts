import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAllBlogList, getBlogPost, blogSocialFilters,
  myblogedit, blogPost, Postimage, comments, getOsBlogList,
  } from '@/services/api';
import type { IBlogPage, IBlog, IBlogReq, IBlogPostCreate, ISocialFilter } from '@/types/blog';
import { INIT_BLOG_POST } from '@/types/blog';
import { INIT_PAGINATION } from '@/types/service';
import type { UploadFile } from 'element-plus';
import axios from 'axios';

export const useBlogStore = defineStore('blog', () => {

  const blogs = ref<IBlogPage>(INIT_PAGINATION); // blog列表数据
  const condition = ref<IBlogReq>({}); // 查询blog列表的条件
  const socialFilters = ref<ISocialFilter[]>([]); // 社会过滤器
  const blog = ref<IBlog>(); // 单独blog
  const blogos = ref<IBlogPage>(INIT_PAGINATION); // 官方博客列表
  //点赞
  const likeBlog = async (blogId: number) => {
    const response = await axios.post(
      // `http://127.0.0.1:4523/m1/6157155-5849182-default/api/like`,
      `/api/blog/collection`,
      { blogId },  // 如果需要传参数
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  };

  const checkUserLike = async (blogId: number) => {
    const response = await axios.get(`/blogs/${blogId}/check-like`);
    return response.data;
  };
  const createData = ref<IBlogPostCreate>(INIT_BLOG_POST);

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
  function postReset(id?:number) {
    createData.value = INIT_BLOG_POST;
    if(id) {
      getBlogPost(id.toString()).then(({data}) => {
        data.social_filters = data.social_filters.map((item:ISocialFilter) => item.id)
        createData.value = data;
      });
    }
  }
  /**
   * 上传文件
   * @param file
   * @returns
   */
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
    // console.log("getBlogByID called with id:", id); // 检查是否被多次调用
    if (id <= 0) {  // 如果id小于等于0，返回错误
      return Promise.reject(new Error('Invalid blog ID'));
    }
    return getBlogPost(id.toString())
      .then(({ data }) => {
        // console.log("API response:", data.id); // 检查是否多次返回数据
        blog.value = data;
        return data;
      })
      .catch((e) => {
        console.log(e);
        throw e;
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


  function getComments(commentId: number) {
    return comments(commentId).then(({data}) => {
      if (blog.value) {
        for(const comment of blog.value.comments) {
          if(comment.id === commentId) {
            comment.replies = data.items;
          }
        }
      }
    });
  }
  function collapseComments(commentId: number) {
    if (blog.value) {
      for (const comment of blog.value.comments) {
        if (comment.id === commentId && comment.replies.length > 2) {
          comment.replies = comment.replies.slice(0, 2);
        }
      }
    }
  }


  return {
    blogs, condition, blog, createData, socialFilters,blogos,
    commentPermission,
    getSocialFilter, userPostblog,getBlogList, getBlogByID, clearBlog, userPostimage,postReset,
    editmyblog, getComments,collapseComments,
    getBlogosList,likeBlog,checkUserLike
  };
});
