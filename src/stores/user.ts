import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { userLogin, userProfile, userModify, userLogout, getMyBlogList, getBlogPost, myblogdelete, userSignup, myblogedit } from '@/services/api';
import type { ILogin, IUser, IUserEdit, IUserSignup } from '@/types/user';
import type { IBlogPost, IBlogEdit } from '@/types/blog';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<IUser>();
  const userPosts = ref<IBlogPost[]>([]);
  const selectedPost = ref<IBlogPost>();

  // 计算属性
  const totalLikes = computed(() => userPosts.value.reduce((sum, post) => sum + post.likes, 0));

  // Actions
  function login(req: ILogin) {
    return new Promise((resolve, reject) => {
      userLogin(req)
        .then((res: any) => {
          user.value = res.data as IUser;
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function logout() {
    userLogout().then(() =>{
      user.value = undefined;
      userPosts.value = [];
    });
  }

  function signup(req: IUserSignup) {
    return userSignup(req).then(({ data }) => {
      user.value = data;
    });
  }

  function getUserInfo() {
    return userProfile().then(({ data }) => {
      user.value = data;
    });
  }

  function editUserInfo(req: IUserEdit) {
    return userModify(req).then(({ data }) => {
      user.value = data;
    });
  }

  // 获取用户博客列表
  function getUserBlogList() {
    return getMyBlogList().then((res) => {
      userPosts.value = res.data.blogs;
    });
  }
  /**
   * 根据id获取blog
   * @param id
   * @returns
   */
  function getUserBlogByID(id: number) {
    return getBlogPost(id.toString())
      .then(({ data }) => {
        selectedPost.value = data;
      })
      .catch((e) => {
        console.log(e);
      });
  }
  function delUserBlogByID(id:number) {
    return myblogdelete(id).then(res =>{
      selectedPost.value = undefined;
    })
  }

  /**
   * 编辑博客
   * @param data 编辑数据
   * @returns Promise
   */
  function editUserBlog(data: IBlogEdit) {
    return myblogedit(data).then(() => {
      // 成功后刷新博客列表
      getUserBlogList();
    });
  }

  // 清除选中的博客
  function clearSelectedPost() {
    selectedPost.value = undefined;
  }

  //编辑用户信息


  return {
    // 状态
    user,
    userPosts,
    selectedPost,
    // 计算属性
    totalLikes,
    // Actions
    login,
    logout,
    getUserInfo,
    editUserInfo,
    getUserBlogList,
    getUserBlogByID,
    delUserBlogByID,
    editUserBlog,
    clearSelectedPost,
    signup
  };
});
