/**
 * 地点类型信息
 */
export interface PlaceType {
  /** 类型ID */
  id: number;
  /** 类型名称 */
  name: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 地点位置信息
 */
export interface PlacePosition {
  /** 地点ID */
  place_id: string;
  /** 地点名称 */
  name: string;
  /** 格式化地址 */
  formatted_address: string;
  /** 纬度 */
  latitude: number;
  /** 经度 */
  longitude: number;
  /** 评分 */
  rating: number;
  /** 用户评分总数 */
  user_ratings_total: number;
  /** 营业状态 */
  business_status: string;
  /** 类型列表 */
  types: PlaceType[];
  /** 图标URL */
  icon: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 会议信息（在session中）
 */
export interface ConferenceInSession {
  /** 会议ID */
  id: number;
  /** 会议名称 */
  name: string;
  /** 会议类型 */
  conference_type: string;
  /** 组织者 */
  organizer: string;
}

/**
 * Session信息
 */
export interface Session {
  /** Session ID */
  id: number;
  /** 会议ID */
  conference_id: number;
  /** Session名称 */
  session_name: string;
  /** Session编号 */
  session_number: string;
  /** 描述 */
  description: string;
  /** 主题 */
  topic: string;
  /** 主持人 */
  chairperson: string;
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
  /** 房间信息 */
  room_info: string;
  /** 容量 */
  capacity: number;
  /** 额外费用 */
  additional_fee: number;
  /** 货币 */
  currency: string;
  /** 地点ID（可选） */
  place_id?: string | null;
  /** 地点位置信息（可选） */
  place_position?: PlacePosition | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 会议信息 */
  conference: ConferenceInSession;
  /** 主席用户列表 */
  chair_users: unknown[];
}

/**
 * Session列表响应
 */
export interface SessionsResponse {
  /** Session列表 */
  sessions: Session[];
  /** 总数 */
  total: number;
  /** 总页数 */
  pages: number;
  /** 当前页码 */
  current_page: number;
  /** 每页数量 */
  per_page: number;
}

/**
 * Session下的论文作者信息
 */
export interface SessionPaperAuthor {
  /** 作者ID */
  id: number;
  /** 作者姓名 */
  name: string;
  /** 头像URL（可选） */
  avatar?: string | null;
  /** 用户ID（可选） */
  user_id?: number | null;
  /** 所属机构列表（可选） */
  affiliations?: unknown[];
}

/**
 * Session下的论文信息
 */
export interface SessionPaper {
  /** 论文ID */
  id: number;
  /** 论文标题 */
  title: string;
  /** 论文摘要（可选） */
  abstract?: string | null;
  /** DOI（可选） */
  doi?: string | null;
  /** 作者列表 */
  authors: SessionPaperAuthor[];
  /** 关键词列表（可选） */
  keywords?: unknown[];
  /** 图形摘要（可选） */
  graphic_abstract?: string[] | null;
  /** 视频文件路径（可选） */
  video?: string | null;
  /** 幻灯片文件路径（可选） */
  slide?: string | null;
  /** 海报文件路径（可选） */
  poster?: string | null;
  /** 全文文件路径（可选） */
  full_text?: string | null;
  /** 是否开放获取（可选） */
  is_open_access?: boolean;
  /** 会议元信息（可选） */
  conference_meta?: {
    /** 会议ID */
    conference_id: number;
    /** 会议名称 */
    conference_name?: string | null;
    /** 展示类型（可选） */
    presentation_type?: string | null;
    /** Session ID */
    session_id?: number | null;
    /** 展示时间（可选） */
    presentation_time?: string | null;
    /** 房间信息（可选） */
    room_info?: string | null;
    /** 是否被接受 */
    is_accepted?: boolean;
    /** 评审分数（可选） */
    review_score?: number | null;
  };
}

/**
 * Session下的论文列表响应
 */
export interface SessionPapersResponse {
  /** Session信息（可选） */
  session?: unknown;
  /** 论文列表 */
  papers: SessionPaper[];
  /** 总数 */
  total: number;
  /** 总页数 */
  pages: number;
  /** 当前页码 */
  current_page: number;
  /** 每页数量 */
  per_page: number;
}

