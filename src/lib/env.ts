import { env } from '$env/dynamic/public';

export const config = {
  apiBaseUrl: env.PUBLIC_API_BASE_URL,
  debug: env.PUBLIC_DEBUG === 'true',
}; 