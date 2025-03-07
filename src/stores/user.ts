import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { userLogin, userProfile, userModify, userLogout, getMyBlogList, getBlogPost, myblogdelete, userSignup, myblogedit,userFollow, userFollowings, userFollowers, userUnfollow } from '@/services/api';
import type { ILogin, IUser, IUserEdit, IUserSignup } from '@/types/user';
import type { IBlogPost, IBlogEdit } from '@/types/blog';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<IUser>();
  const userPosts = ref<IBlogPost[]>([]);
  const selectedPost = ref<IBlogPost>();
  const followings = ref<IUser[]>([]);
  const followers = ref<IUser[]>([]);

  // 计算属性
  const totalLikes = computed(() => userPosts.value.reduce((sum, post) => sum + post.likes, 0));

  /**
   * 登录
   * @param req
   * @returns
   */
  function login(req: ILogin) {
    return new Promise<{ data: IUser }>((resolve, reject) => {
      userLogin(req)
        .then((res) => {
          const response = res as { data: IUser };
          user.value = response.data;
          resolve(response);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * 登出
   */
  function logout() {
    return userLogout().then(() =>{
      user.value = undefined;
      userPosts.value = [];
    });
  }

  /**
   * 注册
   * @param req
   * @returns
   */
  function signup(req: IUserSignup) {
    return userSignup(req).then(({ data }) => {
      user.value = data;
    });
  }

  /**
   * 用户信息
   * @returns promise
   */
  function getUserInfo() {
    return userProfile().then(({ data }) => {
      user.value = data;
    });
  }

  /**
   * 编辑用户
   * @param req
   * @returns promise
   */
  function editUserInfo(req: IUserEdit) {
    return userModify(req).then(({ data }) => {
      user.value = data;
    });
  }

  /**
   * 获取用户blog列表
   * @returns
   */
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
  /**
   * 根据id删除用户blog
   * @param id
   * @returns
   */
  function delUserBlogByID(id:number) {
    return myblogdelete(id).then(() =>{
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

  /**
   * 清除选中的博客
   */
  function clearSelectedPost() {
    selectedPost.value = undefined;
  }

  /**
   * 关注用户
   * @param id 用户id
   * @returns promise
   */
  function follow(id:number) {
    return userFollow(id);
  }
  /**
   * 取消关注
   * @param id 用户id
   * @returns proomise
   */
  function unfollow(id:number) {
    return userUnfollow(id);
  }
  /**
   * 获取关注用户
   * @param id 被关注用户，不填为用户自己
   * @returns
   */
  function getFollowings(id?:number) {
    if(!id) id = user.value?.id as number;
    return userFollowings(id).then(({data}) =>{
      followings.value = data.list as IUser[]
    });
  }
  /**
   * 获取被关注用户
   * @param id 关注用户，不填为用户自己
   * @returns
   */
  function getFollowers(id?:number) {
    if(!id) id = user.value?.id as number;
    return userFollowers(id).then(({data}) =>{
      followers.value = data.list as IUser[]
    });
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
    follow,
    unfollow,
    getFollowings,
    getFollowers,
    getUserBlogList,
    getUserBlogByID,
    delUserBlogByID,
    editUserBlog,
    clearSelectedPost,
    signup
  };
});
