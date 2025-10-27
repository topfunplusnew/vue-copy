export interface IConferenceKey {
  id: number;
  name: string;
}

export interface IConferenceEvent {
  id: number;
  name: string;
  place_name: string;
  start_time: string;
  end_time: string;
  logoUrl?: string; // 会议logo URL
  website?: string;
  keywords?: IConferenceKey[];
  conference_type: string;
}

export interface IConferenceSubmission {
  id: number;
  session_name: string;
  chairperson: string[];
}

export interface IConferencePosition {
  //会议地点信息
  formatted_address: string;
  name: string;
}

export interface IConferencePaper {
  //会议论文
  id: number;
  title: string;
  authors: string[];
  institutions: string[];
  doi: string;
  abstract: string;
  keywords: string[];
  graphicalAbstract: string | null;
  video: string | null;
  slides: string | null;
  poster: string | null;
  additionalInfo: string | null;
}

export interface IConferenceParticipation {
  //会议详情
  id: number;
  name: string;
  abbreviation: string; //会议简称
  logoUrl?: string; // 会议logo URL
  sessions: IConferenceSubmission[];
  start_time: string;
  end_time: string;
  registration_fee?: number;
  currency: string;
  fullName: string;
  place_position?: IConferencePosition;
  website: string;
  conference_type: string; //会议类型
  created_at: string;
  updated_at: string;
  place_id: string;
  keywords: IConferenceKey[];
  papers?: IConferencePaper[];
  description: string;
  city: string;
  country: string;
  address: string; //会场
  submission_deadline: string;
  notification_date: string;
  committee_website: string;
  registration_website: string;
}

export interface IMyConference {
  //我的会议
  id: string;
  name: string;
  abbreviation: string;
  conference_type: string;
  start_time: string;
  end_time: string;
  website: string;
  logo: string;
  place_name: string;
  my_papers_count: number;
  my_papers: IMyPapers[];
}

export interface IMyPapers {
  paper_id: number;
  paper_title: string;
  presentation_type: string;
  is_accepted: boolean;
  presentation_time: string;
  session_name: string;
}

export interface IAffiliation {
  id: number;
  name: string;
  department?: string;
  university?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface IAuthor {
  id: number;
  name: string;
  order: number;
  is_corresponding: boolean;
  affiliations: IAffiliation[];
}

export interface IConference {
  id: number;
  name: string;
  abbreviation: string; //会议简称
  start_time: string;
  end_time: string;
  website: string;
  committee_website: string;
  registration_website: string;
  logo: string;
  city: string;
  country: string;
  address: string;
}

export interface ISession {
  id: number;
  session_name: string;
  session_number: string;
  topic: string;
  chairperson: string;
  start_time: string;
  end_time: string;
  room_info: string;
}

export interface IPapers {
  id: number;
  title: string;
  abstract: string;
  venue: string;
  authors: IAuthor[];
  conference: IConference;
  created_at: string;
  updated_at: string;
  session: ISession[];
  video: string | null;
  slide: string | null;
  graphic_abstract: string | null;
  poster?: string | null;
  addition_files?: string[];
}

export interface Ivideo {
  paper_id: number;
  file_type: string;
  file: File;
}
