/**
 * Path prefix the app is served under (e.g. `/evclaimsmgmnt` on GitHub Pages).
 * Empty for local dev and the normal deployments, so this is a no-op there.
 *
 * next/link and router.push add the prefix themselves; use this for anything
 * they don't touch: plain <img src>, window.location.*, and public/ assets.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

export function withBasePath(path: string): string {
  if (!BASE_PATH || !path.startsWith('/') || path.startsWith('//')) {
    return path;
  }
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) {
    return path;
  }
  return `${BASE_PATH}${path}`;
}
