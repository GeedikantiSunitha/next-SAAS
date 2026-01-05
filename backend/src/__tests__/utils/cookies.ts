/**
 * Cookie Handling Utilities for E2E Tests
 * 
 * Provides helper functions for working with cookies in supertest responses.
 * Handles both string and array formats for set-cookie headers.
 */

/**
 * Extract all cookies from response headers as a string
 * Suitable for passing to subsequent requests via .set('Cookie', ...)
 * 
 * @param headers - Response headers from supertest
 * @returns Cookie string in format "name1=value1; name2=value2"
 */
export const extractCookies = (headers: any): string => {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return '';
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return cookies.filter(Boolean).join('; ');
};

/**
 * Find a specific cookie by name
 * 
 * @param headers - Response headers from supertest
 * @param name - Cookie name to find
 * @returns Cookie value or undefined if not found
 */
export const findCookie = (headers: any, name: string): string | undefined => {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return undefined;
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const cookie = cookies.find((c: string) => c && c.startsWith(`${name}=`));
  
  if (!cookie) return undefined;
  
  // Extract cookie value (before first semicolon)
  return cookie.split('=')[1]?.split(';')[0];
};

/**
 * Check if a cookie exists in response headers
 * 
 * @param headers - Response headers from supertest
 * @param name - Cookie name to check
 * @returns True if cookie exists, false otherwise
 */
export const hasCookie = (headers: any, name: string): boolean => {
  return findCookie(headers, name) !== undefined;
};

/**
 * Extract all cookie names from response headers
 * 
 * @param headers - Response headers from supertest
 * @returns Array of cookie names
 */
export const getCookieNames = (headers: any): string[] => {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return [];
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return cookies
    .filter(Boolean)
    .map((c: string) => c.split('=')[0])
    .filter(Boolean);
};

/**
 * Parse cookie string into object
 * 
 * @param cookieString - Cookie string from extractCookies()
 * @returns Object with cookie names as keys and values as values
 */
export const parseCookies = (cookieString: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  
  return cookies;
};
