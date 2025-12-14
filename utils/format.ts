/**
 * 将邮箱转换为后端 K8s 能够识别的 Safe Username Slug
 * 规则：提取 @ 前面的部分，将 . 替换为 -，并转小写
 * 例如: jinzhi.chen@dolphindb.com -> jinzhi-chen
 */
export const getSafeUsername = (email: string): string => {
    if (!email) return '';
    const prefix = email.split('@')[0];
    return prefix.replace(/\./g, '-').toLowerCase();
};