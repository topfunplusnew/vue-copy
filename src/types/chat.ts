import type { IRequest } from './service';

export interface IChatReq extends IRequest {
    content: string;
    Conversation_id: string;
}



