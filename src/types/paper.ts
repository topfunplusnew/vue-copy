export interface IPaper {
    id: number;
    conference_id: number;
    paper_title: string;
    paper_authors: IPaperAuthors[];
    abstract: string;
    keywords: string[];
    graphicalAbstract: string | null;
    session_name: string;
    session_id?: number;
    full_text?: string;
    video?: string;
    slide?: string;
    slides?: string;
}
export interface IPaperAuthors {
  id: number;
  name: string;
  avatar?: string;
  affiliations: IAffiliations[];
  user_id?: number|null;
}
export interface IAffiliations {
  id: number;
  name: string;
  department: string;
  university: string;
  city: string;
  country: string;
  state?: string;
}
export interface IConferenceInfo {
  id: number;
  name: string;
  abbreviation: string;
  logo: string;
  start_time:string;
  end_time:string;
  city:string;
  country:string;
}

export interface IpaperDetail {
  //论文详情
  id: string;
  title: string;
  doi: string;
  abstract: string;
  venue: string;
  authors: IPaperAuthors[];
  graphic_abstract?: string[];
  video: string;
  slide: string;
  poster: string;
  keywords: Ikeywords[];
  addition_files: string[];
  poster_status: number;
  slide_status: number;
  video_status: number;
  full_text?: string;
  is_open_access?: boolean;
  can_edit?: boolean;
  conference: IConferenceInfo;
  key_points?: string[];
  session?: {
    id: number;
    session_name: string;
    session_number: string;
    topic: string;
    chairperson: string;
    start_time: string;
    end_time: string;
    room_info: string;
  };
}
export interface Ikeywords {
  id: number;
  name: string;
  order: number;
}

export interface IModifyPaperShow {
  id: string | number;
  title?: string;
  abstract?: string;
  venue?: string;
  url?: string;
  poster_status?: number;
  slide_status?: number;
  video_status?: number;
  key_points?: string[];
}
