import { ref } from 'vue';
import { defineStore } from 'pinia';
import { userLogin, userProfile, userModify, logout as logoutApi } from '@/services/api';
import type { ILogin, IUser, IUserEdit } from '@/types/user';
import type { IBlogPost } from '@/types/blog';

export const useUserStore = defineStore('user', () => {
  const user = ref<IUser>();

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
  }


  function getUserInfo() {
    userProfile().then(({ data }) => {
      user.value = data;
    });
  }
  function editUserInfo(req: IUserEdit) {
    return userModify(req).then(({ data }) => {
      user.value = data;
    });
  }

  // function getUserBlogList() {g
  //   getMyBlogList().then((res) => {
  //   console.log(res);
  //   userPosts.value = res.data.blogs;
  // }).catch((e) => {
  //   console.log(e);
  // });

  return { user, login, getUserInfo, editUserInfo, logout };
});
