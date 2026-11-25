import {AuthDB} from "./client/src/db.ts";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? "";

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  throw new Error('Missing Spotify credentials in .env');
}

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

let accessToken: string | undefined;
let expiresAt = 0;
let refreshToken: string | undefined;


export function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'user-read-playback-state user-modify-playback-state user-read-currently-playing',
    redirect_uri: REDIRECT_URI,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Token exchange failed');
  AuthDB.saveRefreshToken(data.refresh_token);
  accessToken = data.access_token;
  expiresAt = Date.now() + data.expires_in * 1000;
}

async function getValidToken(): Promise<string> {
  // Return cached token if it has more than 60 seconds left
  if (accessToken && Date.now() < expiresAt - 60_000) {
    return accessToken;
  }

  const refreshToken = AuthDB.getRefreshToken();
  if (!refreshToken) throw new Error('Host not logged in');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
          'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = (await res.json()) as SpotifyTokenResponse;
  if (!res.ok) throw new Error('Failed to refresh Spotify token');

  accessToken = data.access_token;
  expiresAt = Date.now() + data.expires_in * 1000;

  // Spotify occasionally rotates refresh tokens—save it if a new one is returned
  if (data.refresh_token) {
    AuthDB.saveRefreshToken(data.refresh_token);
  }

  return accessToken;
}

export async function getCurrentlyPlaying() {
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${await getValidToken() ?? ""}`
    }
  })

  return res.text().then((t) => (t ? JSON.parse(t) : null));
}

export async function getArtistPicture(artistId: string) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${await getValidToken() ?? ""}`
    }
  })

  if (!res.ok) {
    console.error(`Spotify artist fetch failed (${res.status}):`, await res.text());
    return null;
  }

  return res.text().then((t) => (t ? JSON.parse(t)?.images?.[0]?.url : null));
}

interface SpotifySearchResponse {
  tracks: {
    limit: number,
    offset: number,
    total: number,
    items: {
      name: string;
      uri: string;
      artists: {name: string}[];
      album: {
        name: string;
        images: {url: string}[]
      };
    }[];
  }
}

export async function searchTracks(search: string): Promise<SpotifySearchResponse> {
  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(search)}&type=track&limit=10`, {
    headers: {
      Authorization: `Bearer ${await getValidToken() ?? ""}`
    }
  });

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`);
  }

  return (await res.json()) as SpotifySearchResponse;
}