/**
 * 查询论文查看历史参数
 */
export interface GetPaperViewHistoryParams {
  /** 页码（可选，默认：1） */
  page?: number;
  /** 每页数量（可选，默认：20） */
  per_page?: number;
  /** 会议类型（可选） */
  conference_type?: string;
}

/**
 * 新增论文查看历史数据
 */
export interface AddPaperViewHistoryData {
  /** 论文ID（必填） */
  paper_id: number;
  /** 查看时长，单位：秒（可选） */
  view_duration?: number;
  /** 查看类型（可选，默认：detail） */
  view_type?: 'detail' | 'list' | 'search';
  /** 查看来源（可选） */
  view_source?: string;
  /** 来源URL（可选） */
  referrer_url?: string;
  /** 会话ID（可选） */
  session_id?: string;
}

/**
 * 上传用户简历PDF文件数据
 */
export interface UploadBioPdfData {
  /** 文件对象 */
  file: File;
}

/**
 * 用户资料返回数据
 */
export interface UserProfileData {
  /** 用户ID */
  id: number;
  /** 姓名 */
  name: string;
  /** 头像URL */
  avatar: string;
  /** 点赞数 */
  likes: number;
  /** 粉丝数 */
  followers: number;
  /** 关注数 */
  followings: number;
  /** 博客数量 */
  blogs_count: number;
  /** 收藏数量 */
  collections_count: number;
  /** 金币数 */
  coins: number;
  /** 用户类型 */
  user_types: unknown[];
  /** 更新时间 */
  updated_at: string;
  /** 创建时间 */
  created_at: string;
  /** 所属机构（可选） */
  affiliation?: string;
  /** 部门（可选） */
  department?: string;
  /** 大学（可选） */
  university?: string;
  /** 城市（可选） */
  city?: string;
  /** 国家（可选） */
  country?: string;
  /** 个人简介（可选） */
  bio?: string;
  /** 个人主页（可选） */
  homepage?: string;
  /** ORCID（可选） */
  orcid?: string;
  /** 简历PDF路径（可选） */
  bio_pdf?: string;
}

/**
 * 更新用户资料数据
 */
export interface UpdateUserProfileData {
  /** 姓名（可选） */
  name?: string;
  /** 头像URL（可选） */
  avatar?: string;
  /** 所属机构（可选） */
  affiliation?: string;
  /** 部门（可选） */
  department?: string;
  /** 大学（可选） */
  university?: string;
  /** 城市（可选） */
  city?: string;
  /** 国家（可选） */
  country?: string;
  /** 个人简介（可选） */
  bio?: string;
  /** 个人主页（可选） */
  homepage?: string;
  /** ORCID（可选） */
  orcid?: string;
}

/**
 * 会议中的论文信息
 */
export interface MyPaperInConference {
  /** 论文ID */
  paper_id: number;
  /** 论文标题 */
  paper_title: string;
  /** 作者列表 */
  authors: string[];
  /** 展示类型（可选） */
  presentation_type?: string | null;
  /** 是否被接受 */
  is_accepted: boolean;
  /** 展示时间（可选） */
  presentation_time?: string | null;
  /** 分会场名称（可选） */
  session_name?: string | null;
}

/**
 * 我的会议信息
 */
export interface MyConference {
  /** 会议ID */
  id: number;
  /** 会议名称 */
  name: string;
  /** 会议缩写（可选） */
  abbreviation?: string | null;
  /** 会议类型（可选） */
  conference_type?: string | null;
  /** 开始时间（可选） */
  start_time?: string | null;
  /** 结束时间（可选） */
  end_time?: string | null;
  /** 会议网站（可选） */
  website?: string | null;
  /** 会议Logo（可选） */
  logo?: string | null;
  /** 地点名称（可选） */
  place_name?: string | null;
  /** 我的论文数量 */
  my_papers_count: number;
  /** 我的论文列表（可选） */
  my_papers?: MyPaperInConference[];
}

/**
 * 我的会议列表响应
 */
export interface MyConferencesResponse {
  /** 会议列表 */
  items: MyConference[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  per_page: number;
  /** 总页数 */
  pages: number;
}
