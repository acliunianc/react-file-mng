export const isImageExtension = (name: string) => {
  const imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'tiff',
    'webp',
    'svg',
    'ico',
  ];

  const extension = name.split('.').at(-1);
  if (!extension) return false;

  const formattedExtension = extension.toLowerCase();

  return imageExtensions.includes(formattedExtension);
};
