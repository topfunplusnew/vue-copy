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
    affiliation?: IAffiliations[]
}
export interface IAffiliations {
    id: number;
    name: string;
    department: string;
    university: string;
    city: string;
    country: string;
}

export interface page {
    total: number;
    page: number;
    current_page: number;
    per_page: number;
}