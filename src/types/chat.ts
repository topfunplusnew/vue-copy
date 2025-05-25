import type { ICommon } from './base';
import type { IRequest } from './service';

export interface IChatReq extends IRequest {
    content: string;
    conversation_id?: number;
    stream?: boolean;
}

export interface IMessage extends ICommon {
  role: string; // user or ai
  content: string;
  conversation_id?: number;
}

export interface IConversation extends ICommon {
  user_id: number;
  title: string;
}



