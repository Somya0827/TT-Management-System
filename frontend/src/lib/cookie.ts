export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) return cookieValue;
  }
  return null;
};

export const setCookie = (name: string, value: string, days: number): void => {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export const deleteCookie = (name: string) => {
  document.cookie =  `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};