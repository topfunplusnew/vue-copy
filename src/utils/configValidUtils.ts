export function validConfig() {
  if (!import.meta.env.IPG_IMAGE_URL) {
    throw new Error('import.meta.env.IPG_IMAGE_URL is not configured');
  }
}
