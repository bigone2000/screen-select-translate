import type { Rect } from '@/types';

export async function cropImage(imageDataUrl: string, rect: Rect, devicePixelRatio: number): Promise<string> {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const physicalRect = {
    x: rect.x * devicePixelRatio,
    y: rect.y * devicePixelRatio,
    width: rect.width * devicePixelRatio,
    height: rect.height * devicePixelRatio,
  };

  const canvas = new OffscreenCanvas(physicalRect.width, physicalRect.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('無法取得 canvas context');
  }

  ctx.drawImage(
    imageBitmap,
    physicalRect.x, physicalRect.y, physicalRect.width, physicalRect.height,
    0, 0, physicalRect.width, physicalRect.height
  );

  const canvasBlob = await canvas.convertToBlob({ type: 'image/png' });
  if (!canvasBlob) {
    throw new Error('無法將 Canvas 轉換為 Blob');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(canvasBlob);
  });
}