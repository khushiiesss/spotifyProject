import type { SpotifyArtist, SpotifyTrack, SpotifyPlaylist, GenreCount, AudioFeatures } from '../lib/database.types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export const fetchUserProfile = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

export const fetchTopArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/top/artists?limit=50&time_range=medium_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch top artists');
  }

  const data = await response.json();
  return data.items.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    genres: artist.genres || [],
    popularity: artist.popularity,
    images: artist.images || [],
  }));
};

export const fetchTopTracks = async (accessToken: string): Promise<SpotifyTrack[]> => {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/top/tracks?limit=50&time_range=medium_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch top tracks');
  }

  const data = await response.json();
  return data.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist: any) => ({ name: artist.name })),
    album: {
      name: track.album.name,
      images: track.album.images || [],
    },
    popularity: track.popularity,
  }));
};

export const fetchUserPlaylists = async (accessToken: string): Promise<SpotifyPlaylist[]> => {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch playlists');
  }

  const data = await response.json();
  return data.items.map((playlist: any) => ({
    id: playlist.id,
    name: playlist.name,
    images: playlist.images || [],
    tracks: { total: playlist.tracks.total },
  }));
};

export const fetchAudioFeatures = async (accessToken: string, trackIds: string[]): Promise<AudioFeatures> => {
  if (trackIds.length === 0) {
    return {
      avg_danceability: 0,
      avg_energy: 0,
      avg_valence: 0,
      avg_acousticness: 0,
      avg_instrumentalness: 0,
    };
  }

  const ids = trackIds.slice(0, 100).join(',');
  const response = await fetch(`${SPOTIFY_API_BASE}/audio-features?ids=${ids}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch audio features');
  }

  const data = await response.json();
  const features = data.audio_features.filter((f: any) => f !== null);

  if (features.length === 0) {
    return {
      avg_danceability: 0,
      avg_energy: 0,
      avg_valence: 0,
      avg_acousticness: 0,
      avg_instrumentalness: 0,
    };
  }

  const sum = features.reduce(
    (acc: any, f: any) => ({
      danceability: acc.danceability + f.danceability,
      energy: acc.energy + f.energy,
      valence: acc.valence + f.valence,
      acousticness: acc.acousticness + f.acousticness,
      instrumentalness: acc.instrumentalness + f.instrumentalness,
    }),
    { danceability: 0, energy: 0, valence: 0, acousticness: 0, instrumentalness: 0 }
  );

  return {
    avg_danceability: sum.danceability / features.length,
    avg_energy: sum.energy / features.length,
    avg_valence: sum.valence / features.length,
    avg_acousticness: sum.acousticness / features.length,
    avg_instrumentalness: sum.instrumentalness / features.length,
  };
};

export const extractTopGenres = (artists: SpotifyArtist[]): GenreCount[] => {
  const genreMap = new Map<string, number>();

  artists.forEach((artist) => {
    artist.genres.forEach((genre) => {
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });
  });

  return Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};

export const fetchAllSpotifyData = async (accessToken: string) => {
  const [profile, topArtists, topTracks, playlists] = await Promise.all([
    fetchUserProfile(accessToken),
    fetchTopArtists(accessToken),
    fetchTopTracks(accessToken),
    fetchUserPlaylists(accessToken),
  ]);

  const trackIds = topTracks.map((track) => track.id);
  const audioFeatures = await fetchAudioFeatures(accessToken, trackIds);
  const topGenres = extractTopGenres(topArtists);

  return {
    profile,
    topArtists,
    topTracks,
    playlists,
    topGenres,
    audioFeatures,
  };
};
