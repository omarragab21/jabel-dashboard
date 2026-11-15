// Header photo of the legal pages: reading the URL the site-images upload endpoint answers with.

/** The URL out of an upload response ({data:{image_url}}, {url}, a bare string ...), or '' when it has none. */
export const uploadedImageUrl = (body) => {
  const candidates = [body, body?.data, body?.data?.data, body?.data?.image, body?.image];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = typeof candidate === 'string'
      ? candidate
      : (candidate.image_url || candidate.url || candidate.image || candidate.path || candidate.file || candidate.src);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};
