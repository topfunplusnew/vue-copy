export interface IPaper {
    id: number;
    conference_id: number;
    paper_title: string;
    paper_authors: IPaperAuthors[];
    abstract: string;
    keywords: string[];
    graphicalAbstract: string | null;
    session_name: string;
}
export interface IPaperAuthors {
    id: number;
    name: string;
    affiliations: IAffiliations[]
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
}

export interface IpaperDetail {//论文详情
    id: string;
    title: string;
    doi: string;
    abstract: string;
    venue: string;
    authors: IPaperAuthors[]
    graphic_abstract?: string[]
    video: string
    slide: string;
    poster: string;
    keywords: Ikeywords[];
    addition_files: string[];
    poster_status: number,
    slide_status: number,
    video_status: number,
    is_open_access?: boolean,
    can_edit?: boolean,
    conference?: IConferenceInfo,
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
