const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
'user-read-recently-played'

].join(' ');

export const getSpotifyAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    show_dialog: 'true',
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string): Promise<string> => {
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

  const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Token exchange failed:", data);
    throw new Error("Failed to exchange authorization code for token");
  }

  return data.access_token;
};


export const storeAccessToken = (token: string) => {
  localStorage.setItem('spotify_access_token', token);
};

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem('spotify_access_token');
};

export const clearAccessToken = () => {
  localStorage.removeItem('spotify_access_token');
};
