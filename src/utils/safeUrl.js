/**
 * Returns true if the value resolves to an http(s) URL.
 * Blocks javascript:, data: and other schemes before a value is used as a link or navigation target.
 *
 * @param {string} value - Absolute or relative URL
 * @returns {boolean}
 */
export function isSafeUrl(value) {
  try {
    const { protocol } = new URL(value, window.location.origin);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}
