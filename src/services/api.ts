import type { IBlogEdit, IBlogPostCreate, IBlogPostimage, IBlogReq } from '@/types/blog';
import type { ILogin, IPairToken, IUserEdit, IUserSignup } from '@/types/user.ts';
import type { IChatReq } from '@/types/chat';
import { auth, http } from './http';
import type { IRequest } from '@/types/service';
import type { IPlaceCreateReq, IPlanCreateReq, IPlanSearchReq, IPlanUpdateReq } from '@/types/plan';
import type { IModifyPaper } from '@/types/conference';

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

export const accountActivate = (token: string) => http.put('/user/active', { token });
// export const multiRoundChat = (data: IMultiRoundChat) => http.post('/chat', data);

export const googleAuthorize = (token: string) =>
  http.post('/oauth/google', { token }).then((res) => {
    const data = res.data as IPairToken;
    auth.set(data.access_token);
    return res;
  });

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

export const myblogdelete = (id: number) => http.delete('/blog', { params: { id: id } });

export const myblogedit = (data: IBlogEdit) => http.put('/blog', data);

export const Postimage = (data: IBlogPostimage) =>
  http.post('/file/blog', data.image, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const uploadAvatar = (data: FormData) =>
  http.post('/file/avatar', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const invitationAuth = (code: string) => http.post('/user/invitation-auth', { invitation_code: code });
export const joinWaitlist = (message: string) => http.post('/waitlist', { message });

// export const getBlogPost = (id: string) => http.get(`/blog/${id}`);
export const getBlogPost = (id: string) => http.get('/blog', { params: { id } }); // 根据id获取blog

export const getMyBlogList = (req: IBlogReq = {}) => http.get('/my_blogs', { params: req }); // blog列表，可以搜索分页
export const getAllBlogList = (req: IBlogReq = {}) => http.get('/blogs', { params: req }); // 我的blog，blog列表一样的搜索和分页
export const getOsBlogList = (req: IBlogReq = {}) => http.get('/blogs/official', { params: req }); // 官方blog，可以分页

export const comment2Blog = (blogId: number, content: string) =>
  http.post('/comment', {
    id: blogId,
    blog: true,
    content,
  });
export const comment2Comment = (commentId: number, content: string) =>
  http.post('/comment', {
    id: commentId,
    content,
  });
export const commentDel = (id: number) => http.delete('/comment', { params: { id } }); // 删除评论
export const comments = (commentId: number) => http.get(`/comments/${commentId}`);

export const homeviewweather = (city: string) => http.get('/weather', { params: { city } });

/**
 * 关注
 */
export const userFollow = (id: number) => http.post('/user/follow', { id });
export const userUnfollow = (id: number) => http.delete('/user/follow', { params: { id } });
export const userIsFollowing = (id: number) => http.get('user/follow', { params: { id } });
export const userFollowings = (id: number, req: IRequest = {}) => http.get(`/user/followings/${id}`, { params: req });
export const userFollowers = (id: number, req: IRequest = {}) => http.get(`/user/followers/${id}`, { params: req });

/**
 * chat
 */
export const chatStream = (req: IChatReq) =>
  http.post('/chatz', req, {
    headers: {
      Accept: 'text/event-stream',
    },
    responseType: 'stream',
    adapter: 'fetch',
  }); // chat 流试显示

export const chatConversations = () => http.get('/chat/history'); // 主题列表
export const chatRestore = (conversationID: number) => http.get(`/chat/restore/${conversationID}`); //根据主题返回本主题下的所有历史记录

/**
 * plan
 */

/**
 * 创建计划
 * @param data 计划数据
 * @returns Promise
 */
export const planCreate = (data: IPlanCreateReq) => http.post('/plan', data);

/**
 * 修改计划
 * @param data 计划数据（包含ID）
 * @returns Promise
 */
export const planUpdate = (data: IPlanUpdateReq) => http.put('/plan', data);

/**
 * 获取计划详情
 * @param id 计划ID
 * @returns Promise
 */
export const planGet = (id: number) => http.get('/plan', { params: { id } });

/**
 * 删除计划
 * @param id 计划ID
 * @returns Promise
 */
export const planDelete = (id: number) => http.delete('/plan', { params: { id } });

/**
 * 搜索计划
 * @param query 搜索参数
 * @returns Promise
 */
export const planSearch = (query: IPlanSearchReq = {}) => http.get('/plans', { params: query });

/**
 * 获取我的计划列表
 * @param query 查询参数
 * @returns Promise
 */
export const getMyPlans = (query: IPlanSearchReq = {}) => http.get('/my_plans', { params: query });

/**
 * Place 相关 API
 */

/**
 * 创建地点
 * @param data 地点数据
 * @returns Promise
 */
export const placeCreate = (data: IPlaceCreateReq) => http.post('/place', data);

/**
 * 获取地点详情
 * @param id 地点ID
 * @returns Promise
 */
export const placeGet = (id: number) => http.get('/place', { params: { id } });

/**
 * 搜索地点
 * @param query 搜索参数
 * @returns Promise
 */
export const placeSearch = (query: IRequest = {}) => http.get('/places', { params: query });

/**
 * 获取会议列表
 */
export const getConferenceList = (query: IRequest = {}) => http.get('/conference', { params: query });

/*
 *获取会议详情
 */
export const getConferenceDetail = (id: number | string) => http.get(`/conference/${id}`);

/*
我的会议
*/
export const getMyConferenceList = () => http.get('/my-conferences');

/*
我的论文
*/
export const getMyPaperDetail = (id: number) => http.get(`/paper/${id}`);

/*
修改我的论文
*/
export const updateMyPaperDetail = (data: IModifyPaper) => http.put('my-paper', data);

// 获取schedule列表
export const getScheduleList = () => http.get('/schedule');

// 关键词搜索API
export const searchKeywords = (query: string) => http.get(`/keyword?search=${encodeURIComponent(query)}`);
