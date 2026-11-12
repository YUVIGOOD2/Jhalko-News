const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT = 10 * 1024 * 1024; // 10MB original
const MAX_W = 1600;

/**
 * Image ko check karke canvas par dobara bana deta hai (WebP).
 * Isse: size chhota, EXIF/GPS metadata hat jata hai, aur image me chhupa
 * koi bhi malicious payload khatam ho jata hai.
 */
export async function processImage(file: File): Promise<Blob> {
  if (!ALLOWED.includes(file.type)) throw new Error('सिर्फ JPG, PNG या WebP फोटो चलेगी।');
  if (file.size > MAX_INPUT) throw new Error('फोटो 10MB से छोटी होनी चाहिए।');

  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error('यह फाइल सही फोटो नहीं है।');
  }
  const scale = Math.min(1, MAX_W / bmp.width);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser image process नहीं कर पा रहा।');
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.82));
  if (!blob) throw new Error('फोटो convert नहीं हो पाई।');
  if (blob.size > 3 * 1024 * 1024) throw new Error('फोटो compress होने के बाद भी 3MB से बड़ी है।');
  return blob;
}
