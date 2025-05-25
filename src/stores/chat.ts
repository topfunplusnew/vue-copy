import { ref } from 'vue';
import { defineStore } from 'pinia';
import { chatStream, chatConversations, chatRestore } from '@/services/api';
import type { IChatReq, IConversation, IMessage } from '@/types/chat';


export const useChatStore = defineStore('prompt', () => {

  const message = ref('');
  const messages = ref<IMessage[]>([{
    role: 'ai',
    content: 'You can ask me travel-related questions or simply use "Generate Token" to help you create a travel plan.'
  }]);
  const conversations = ref<IConversation[]>([]);


  let conversation_id:number|undefined = undefined;

  /**
   * 提问
   * @param question 问题
   * @param conversationID 交流id
   * @returns promise
   */
  function chat(question:string, conversationID?:number) {

    if(conversationID) conversation_id = conversationID;
    const req = <IChatReq>{
      content: question,
      stream: true,
      conversation_id
    }
    messages.value.push({
      role: 'user',
      content: question,
    })
    return chatStream(req).then(async res =>{
      let text = ''
      const stream = res.data;
      conversation_id = res.headers['x-conversation-id'];
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
      while(true){
        const {value, done} = await reader.read();
        if(done) break;
        text += value;
        message.value = text;
      }
      messages.value.push({
        role: 'ai',
        content: text
      });
      message.value = '';
      return res;
    });
  }
  /**
   * 清空消息
   */
  function clear(){
    messages.value = [];
  }
  /**
   * 话题列表
   * @returns
   */
  function getConversasions() {
    return chatConversations().then(res =>{
      conversations.value = res.data.history;
      return res;
    });
  }
  /**
   * 根据话题获取chat记录
   * @param id
   * @returns
   */
  function getChatsByConversationID(id:number) {
    return chatRestore(id).then(({data}) => {
      const history = data.history;
      if (history && history.length > 0) {
        history.push({
          role: 'ai',
          content: 'You can ask me travel-related questions or simply use "Generate Token" to help you create a travel plan.'
        })
      }
      messages.value = history;
      conversation_id = id;
    })
  }


  return {
    message,
    messages,
    conversations,
    clear,
    getConversasions,
    getChatsByConversationID,
    chat
  }
});
