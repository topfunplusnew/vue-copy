import type { IRequest } from './service';

export interface IChatReq extends IRequest {
    content: string;
    conversation_id?: string;
}



