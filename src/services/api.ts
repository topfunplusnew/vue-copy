import type{ IBlogReq } from '@/types/blog';
import type { IPairToken, ILogin, IUserEdit, IUserSignup } from '@/types/user.ts';
import type { IBlogPostCreate, IBlogPostimage, IBlogEdit } from '@/types/blog';
import type { IChatReq } from '@/types/chat';
import { http, auth } from './http';



/**
 * 用户登录
 * @param credentials 登录信息
 * @returns
 */
export const userLogin = (credentials: ILogin) =>
  new Promise((resole, reject) => {
    http
      .post('/user/login', credentials)
      .then((res) => {
        const data = res.data as IPairToken;
        auth.set(data.access_token);
        resole(res);
      })
      .catch((e) => {
        reject(e);
      });
  });
/**
 * 用户登出
 * @returns promise
 */
export const userLogout = () =>
  new Promise((resole) => {
    auth.del();
    resole(true);
  });

// export const multiRoundChat = (data: IMultiRoundChat) => http.post('/chat', data);

/**
 * 注册
 * @param data 注册信息
 * @returns promise
 */
export const userSignup = (data: IUserSignup) => http.post('/user/signup', data);

export const userProfile = () => http.get('/user/profile');

export const userModify = (data: IUserEdit) => http.put('/user/profile', data);

export const blogPost = (data: IBlogPostCreate) => http.post('/blog', data);

export const blogSocialFilters = () => http.get('/social_filters');

export const myblogdelete = (id: number) => http.delete('/blog', {params: {id: id}});

export const myblogedit = (data: IBlogEdit) => http.put('/blog', data);

export const Postimage = (data: IBlogPostimage) => http.post('/file/blog', data.image, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const PostAvatar = (data: IBlogPostimage) => http.post('/file/avatar', data.image, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// export const getBlogPost = (id: string) => http.get(`/blog/${id}`);
export const getBlogPost = (id: string) => http.get('/blog', {params:{id}});

export const getMyBlogList = () => http.get('/my_blogs');

export const getAllBlogList = (req:IBlogReq) => http.get('/blogs', {params:req});


export const comment2Blog = (blogId: number, content: string) => http.post('/comment', {id:blogId, blog:true, content});
export const comment2Comment = (commentId: number, content: string) => http.post('/comment', {id:commentId, content});
export const comments = (commentId: number) => http.get(`/comments/${commentId}`);

export const homeviewweather = (city: string) => http.get('/weather', {params:{city}});


/**
 * 关注
 */
export const userFollow = (id:number) => http.post('/user/follow', {id});
export const userUnfollow = (id:number) => http.delete('/user/follow', {params:{id}});
export const userIsFollowing = (id:number) => http.get('user/follow', {params:{id}});
export const userFollowings = (id:number) => http.get(`/user/followings/${id}`);
export const userFollowers = (id:number) => http.get(`/user/followers/${id}`);


/**
 * chat
 */
export const chatStream = (req:IChatReq) => http.post('/chatz', req, {
  headers: {
    'Accept': 'text/event-stream'
  },
  responseType:'stream',
  adapter:'fetch'
}); // chat 流试显示
export const chatConversations = () => http.get('/chat/history'); // 主题列表
export const chatRestore = (conversationID:number) => http.get(`/chat/restore/${conversationID}`); //根据主题返回本主题下的所有历史记录

