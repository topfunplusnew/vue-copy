/**
 * 创建论文评论请求数据
 */
export interface CreatePaperCommentData {
  /** 评论内容（必填） */
  content: string;
  /** 父评论ID（可选，用于回复评论） */
  parent_id?: number;
}

/**
 * 更新论文评论请求数据
 */
export interface UpdatePaperCommentData {
  /** 评论ID（必填） */
  id: number;
  /** 是否私有（可选） */
  is_private?: boolean;
}

/**
 * 评论用户信息
 */
export interface CommentUser {
  /** 用户ID */
  id: number;
  /** 用户名 */
  name: string;
  /** 用户头像 */
  avatar?: string;
}

/**
 * 论文评论信息
 */
export interface Comment {
  /** 评论ID */
  id: number;
  /** 论文ID */
  paper_id: number;
  /** 用户ID */
  user_id: number;
  /** 父评论ID（null表示顶级评论） */
  parent_id: number | null;
  /** 评论内容 */
  content: string;
  /** 是否是作者回复 */
  is_owner_reply: boolean;
  /** 是否私有 */
  is_private: boolean;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 用户信息 */
  user: CommentUser;
  /** 回复列表（可选，列表接口返回） */
  replies?: Comment[];
  /** 回复数量（可选，列表接口返回） */
  replies_count?: number;
  /** 是否已读（可选，列表接口返回） */
  is_read?: boolean;
}

/**
 * 获取论文评论列表响应数据
 */
export interface GetPaperCommentsResponse {
  /** 评论列表 */
  items: Comment[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  per_page: number;
  /** 总页数 */
  pages: number;
}

/**
 * 论文评论操作响应数据（创建/更新）
 */
export interface PaperCommentResponse {
  /** 响应消息 */
  message: string;
  /** 评论信息 */
  comment: Comment;
}

/**
 * 论文笔记请求数据（创建/更新共用）
 */
export interface PaperNoteData {
  /** 笔记内容 */
  content: string;
}

/**
 * 论文笔记信息
 */
export interface PaperNote {
  /** 笔记ID */
  id: number;
  /** 论文ID */
  paper_id: number;
  /** 用户ID */
  user_id: number;
  /** 笔记标题（可选） */
  title?: string | null;
  /** 笔记内容 */
  content: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 获取论文笔记列表响应数据
 */
export interface GetPaperNotesResponse {
  /** 笔记列表 */
  items: PaperNote[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  per_page: number;
  /** 总页数 */
  pages: number;
}

/**
 * 获取单篇论文笔记响应数据
 */
export interface GetPaperNoteResponse {
  /** 笔记信息 */
  note: PaperNote;
}

/**
 * 论文笔记操作响应数据（创建/更新）
 */
export interface PaperNoteResponse {
  /** 响应消息 */
  message: string;
  /** 笔记信息 */
  note: PaperNote;
}
