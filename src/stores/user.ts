import { ref } from 'vue';
import { defineStore } from 'pinia';
import { userLogin, userProfile, accountActivate, userModify, userLogout, uploadAvatar,
  getMyBlogList, getBlogPost, myblogdelete, userSignup, googleAuthorize,
  comment2Blog,comment2Comment,commentDel,comments,
  myblogedit,userFollow,userIsFollowing, userFollowings, userFollowers, userUnfollow, invitationAuth, joinWaitlist, 
  getMyNote,getManagers,getUserCustom,updateUserCustom} from '@/services/api';
import { getUserTimezone, updateUserTimezone } from '@/services/user';
import type { ILogin, IUser, IUserEdit, IUserSignup,IManager,IUserCustom } from '@/types/user';
import type { IBlogPage, IBlog, IBlogEdit } from '@/types/blog';
import { INIT_PAGINATION } from '@/types/service';
import { auth } from '@/services/http';
import type { INote } from '@/types/note';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<IUser>();
  const blogs = ref<IBlogPage>(INIT_PAGINATION);
  const selectedPost = ref<IBlog>();
  const followings = ref<IUser[]>([]);
  const followers = ref<IUser[]>([]);
  const notes = ref<INote[]>([]);
  const manager = ref<IManager[]>([]);
  const userCustom=ref<IUserCustom>()
  const timezone = ref<string | null>(null)
/* 
 * 获取用户note列表
*/
  function getMyNoteList() {
    return getMyNote().then((res) => {
      notes.value = res.data.data;
      return res;
    });
  }
/* 
获取用户自定义配置
*/
  function getUserCustomInfo() {
    return getUserCustom().then((res) => {
      userCustom.value = res.data.custom_json;
      return res;
    });
  }
  /**
   * 更新用户自定义配置
   * @param req
   * @returns
   */
  function updateUserCustomInfo(req: IUserCustom) {
    return updateUserCustom(req).then((res) => {
      userCustom.value = res.data;
      return res;
    });
  }
  
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
  function isLogin() {
    return auth.get() && user.value;
  }

  function oauth(token:string, platform:string='google') {
    if(platform=='google'){
      return googleAuthorize(token)
    } else {
      return false;
    }
  }

  /**
   * 登出
   */
  function logout() {
    return userLogout().then(() =>{
      user.value = undefined;
      blogs.value.items = [];
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

  function activate(token:string) {
    return accountActivate(token);
  }

  /**
   * 用户信息
   * @returns promise
   */
  function getUserInfo() {
    return userProfile().then((res) => {
      user.value = res.data;
      return res;
    });
  }

  /**
   * 编辑用户
   * @param req
   * @returns promise
   */
  function editUserInfo(req: IUserEdit) {
    return userModify(req).then((res) => {
      user.value = res.data;
      return res
    });
  }

  /**
   * 获取用户blog列表
   * @returns
   */
  function getUserBlogList(refresh:boolean = false) {
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
      getMyBlogList(blogs.value.args).then((res) => {
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
    return myblogdelete(id).then(res =>{
      selectedPost.value = undefined;
      return res;
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

  function commenttoBlog(blogId: number, comment: string) {
    return comment2Blog(blogId, comment);
  }
  function commenttoComment(commentId: number, comment: string) {
    return comment2Comment(commentId, comment);
  }
  function userDeleteComment(id:number) {
    return commentDel(id);
  }
  function getComments(commentId: number) {
    return comments(commentId).then(({data}) => {
      if (selectedPost.value) {
        for(const comment of selectedPost.value.comments) {
          if(comment.id === commentId) {
            comment.replies = data.items;
          }
        }
      }
    });
  }
  function collapseComments(commentId: number) {
    if (selectedPost.value) {
      for (const comment of selectedPost.value.comments) {
        if (comment.id === commentId && comment.replies.length > 2) {
          comment.replies = comment.replies.slice(0, 2);
        }
      }
    }
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
   * 是否关注
   * @param id 用户id
   * @returns
   */
  function isFollowing(id:number) {
    return userIsFollowing(id);
  }
  /**
   * 获取关注用户
   * @param id 被关注用户，不填为用户自己
   * @returns
   */
  function getFollowings(id?:number) {
    if(!id) id = user.value?.id as number;
    return userFollowings(id).then(({data}) =>{
      followings.value = data.items as IUser[]
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
      followers.value = data.items as IUser[]
    });
  }

  function uploadImage(image:Blob){
    const data = new FormData()
    data.append('file', image, "cropped.png");
    return uploadAvatar(data);
  }


  //----- invitation -----

function invitation(code:string) {
  return invitationAuth(code);

}
function joinWait(message:string) {
  return joinWaitlist(message);
}

function getManagerList() {
  return getManagers().then((res) =>{
    manager.value = res.data.items
    return res
  });
}

/**
 * 获取用户时区
 * @returns promise
 */
function getUserTimezoneInfo() {
  return getUserTimezone().then((res) => {
    timezone.value = res.data.timezone;
    return res;
  });
}

/**
 * 更新用户时区
 * @param tz 时区字符串
 * @returns promise
 */
function updateUserTimezoneInfo(tz: string) {
  return updateUserTimezone(tz).then((res) => {
    timezone.value = res.data.timezone;
    return res;
  });
}



  return {
    // 状态
    userCustom,
    notes,
    user,
    blogs,
    selectedPost,
    followings,
    followers,
    manager,
    timezone,
    // invitation
    invitation,
    joinWait,
    // Actions
    login,
    isLogin,
    logout,
    activate,
    getUserInfo,
    oauth,
    editUserInfo,
    uploadImage,
    follow,
    unfollow,
    isFollowing,
    getFollowings,
    getFollowers,
    getUserBlogList,
    getUserBlogByID,
    delUserBlogByID,
    editUserBlog,
    commenttoBlog,
    commenttoComment,
    userDeleteComment,
    getComments,
    collapseComments,
    clearSelectedPost,
    signup,
    getMyNoteList,
    getManagerList,
    getUserCustomInfo,
    updateUserCustomInfo,
    getUserTimezoneInfo,
    updateUserTimezoneInfo
  };
});
