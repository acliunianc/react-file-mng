export const formatByte = (bytes: number | string): string => {
  const bytesNum = Number(bytes);
  if (bytesNum === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytesNum) / Math.log(k));
  return `${parseFloat((bytesNum / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
