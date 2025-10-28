import { http } from '@/services/http.ts';

export const getFileUploadAddress = () => '/paper/upload-file';
// 文件上传
export const uploadVideo = (formatDate: FormData) => http.post('/paper/upload-file', formatDate);

// 删除文件
export const deleteFile = (params: { paper_id: number; file_type: string; file_path: string }) => http.delete('paper/upload-file', { params });
