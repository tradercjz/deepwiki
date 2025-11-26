// src/utils/ossUpload.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://183.134.101.139:8007';

interface OssSignature {
  accessid: string;
  host: string;
  policy: string;
  signature: string;
  expire: number;
  callback: string;
  dir: string;
}

interface UploadResult {
  status: string;
  url: string;
  filename: string;
}

/**
 * 获取 OSS 上传签名
 */
async function getOssSignature(): Promise<OssSignature> {
  const response = await fetch(`${API_BASE_URL}/api/v1/oss/signature`);
  if (!response.ok) {
    throw new Error('Failed to get OSS signature');
  }
  return response.json();
}

/**
 * 上传单个文件到 OSS
 */
export async function uploadFileToOSS(file: File): Promise<string> {
  try {
    // 1. 获取签名 (在实际生产中，签名可以缓存，直到快过期再重新获取)
    const sig = await getOssSignature();

    // 2. 生成唯一文件名，防止覆盖
    // 格式: chat-uploads/timestamp_random_filename
    const uniqueFileName = `${sig.dir}${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;

    // 3. 构造 FormData
    const formData = new FormData();
    // ⚠️ 注意：key 必须是表单的第一个参数
    formData.append('key', uniqueFileName);
    formData.append('policy', sig.policy);
    formData.append('OSSAccessKeyId', sig.accessid);
    formData.append('success_action_status', '200'); // 让 OSS 返回 200 而不是 204
    formData.append('callback', sig.callback); // ✨ 关键：触发后端回调
    formData.append('signature', sig.signature);
    formData.append('file', file); // file 必须是最后一个参数

    // 4. 直传 OSS
    const response = await fetch(sig.host, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OSS upload failed: ${response.statusText}`);
    }

    // 5. 解析结果
    // 因为我们设置了 callback，OSS 会把我们后端的返回值透传回来
    const result: UploadResult = await response.json();
    
    if (result.status !== 'ok' || !result.url) {
      throw new Error('Upload callback returned invalid status');
    }

    return result.url;
  } catch (error) {
    console.error('Error uploading file:', file.name, error);
    throw error;
  }
}