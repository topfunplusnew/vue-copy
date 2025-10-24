export interface ConferenceEvent {
    id: number;
    name: string;
    place_name: string;
    start_time: string;
    end_time: string;
    logoUrl?: string; // 会议logo URL
    website?: string;
    keywords?: string[];
    conference_type:string;
}

export interface ConferenceSubmission {
    session_name: string;
    chairperson: string[];
}
export interface ConferencePosition {
    formatted_address:string;
    name:string
}
export interface ConferencePaper{
    id: number,
    title: string,
    authors: string[],
    institutions:string[],
    doi: string,
    abstract: string,
    keywords: string[],
    graphicalAbstract: string|null,
    video:string|null,
    slides:string|null,
    poster: string|null,
    additionalInfo: string|null;
}
export interface ConferenceParticipation {
    id: number;
    name: string;
    abbreviation:string;//会议简称
    logoUrl?: string; // 会议logo URL
    sessions: ConferenceSubmission[];
    start_time:string;
    end_time:string;
    registration_fee:number;
    currency:string;
    fullName:string;
    place_position:ConferencePosition;
    website:string;
    conference_type:string; //会议类型
    created_at:string;
    updated_at:string;
    place_id:string;
    session?:[];
    keywords:string[];
    papers? :ConferencePaper[];
    description:string;
}