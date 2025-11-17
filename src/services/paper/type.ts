/**
 * 创建论文评论请求数据
 */
export interface CreatePaperCommentData {
  /** 评论内容（必填） */
  content: string;
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
