/**
 * 查询论文查看历史参数
 */
export interface GetPaperViewHistoryParams {
  /** 页码（可选，默认：1） */
  page?: number;
  /** 每页数量（可选，默认：20） */
  per_page?: number;
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

