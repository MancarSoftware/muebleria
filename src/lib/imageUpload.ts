const maxEdge = 1920;
const webpQuality = 0.84;

function safeFileName(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase() || 'imagen';
}

async function imageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  try {
    const image = await imageFromFile(file);
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', webpQuality));
    if (!blob) return file;
    // Keep a smaller original WebP intact. Other inputs are converted so the storage
    // format remains predictable and cacheable.
    if (file.type === 'image/webp' && blob.size >= file.size) return file;
    return new File([blob], `${safeFileName(file.name)}.webp`, { type: 'image/webp' });
  } catch {
    // Uploading the original is preferable to rejecting a valid photograph on older browsers.
    return file;
  }
}
