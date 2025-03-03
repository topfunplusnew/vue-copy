import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { userLogin, userProfile, userModify, logout as logoutApi, getMyBlogList,getBlogPost, myblogdelete } from '@/services/api';
import type { ILogin, IUser, IUserEdit } from '@/types/user';
import type { IBlogPost } from '@/types/blog';

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
    logoutApi();
    user.value = undefined;
    userPosts.value = [];
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

  // 清除选中的博客
  function clearSelectedPost() {
    selectedPost.value = undefined;
  }

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
    clearSelectedPost
  };
});
