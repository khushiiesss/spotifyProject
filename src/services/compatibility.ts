import type { Database } from '../lib/database.types';
import type { CompatibilityDetails } from '../lib/database.types';

type SpotifyData = Database['public']['Tables']['spotify_data']['Row'];

export const calculateCompatibility = (
  user1Data: SpotifyData,
  user2Data: SpotifyData
): { score: number; details: CompatibilityDetails } => {
  const artistScore = calculateArtistOverlap(user1Data.top_artists, user2Data.top_artists);
  const genreScore = calculateGenreMatch(user1Data.top_genres, user2Data.top_genres);
  const audioFeaturesScore = calculateAudioFeaturesSimilarity(
    user1Data.audio_features,
    user2Data.audio_features
  );

  const totalScore = Math.round(artistScore * 0.4 + genreScore * 0.4 + audioFeaturesScore * 0.2);

  return {
    score: totalScore,
    details: {
      artist_overlap: Math.round(artistScore),
      genre_match: Math.round(genreScore),
      audio_features_similarity: Math.round(audioFeaturesScore),
      common_artists: findCommonArtists(user1Data.top_artists, user2Data.top_artists),
      common_genres: findCommonGenres(user1Data.top_genres, user2Data.top_genres),
    },
  };
};

const calculateArtistOverlap = (artists1: any[], artists2: any[]): number => {
  if (!artists1?.length || !artists2?.length) return 0;

  const set1 = new Set(artists1.map((a) => a.id));
  const set2 = new Set(artists2.map((a) => a.id));

  const intersection = new Set([...set1].filter((id) => set2.has(id)));
  const union = new Set([...set1, ...set2]);

  return (intersection.size / union.size) * 100;
};

const calculateGenreMatch = (genres1: any[], genres2: any[]): number => {
  if (!genres1?.length || !genres2?.length) return 0;

  const genreSet1 = new Set(genres1.map((g) => g.genre));
  const genreSet2 = new Set(genres2.map((g) => g.genre));

  const commonGenres = [...genreSet1].filter((genre) => genreSet2.has(genre));

  if (commonGenres.length === 0) return 0;

  const genre1Map = new Map(genres1.map((g) => [g.genre, g.count]));
  const genre2Map = new Map(genres2.map((g) => [g.genre, g.count]));

  const maxCount1 = Math.max(...genres1.map((g) => g.count));
  const maxCount2 = Math.max(...genres2.map((g) => g.count));

  let weightedScore = 0;
  commonGenres.forEach((genre) => {
    const weight1 = (genre1Map.get(genre) || 0) / maxCount1;
    const weight2 = (genre2Map.get(genre) || 0) / maxCount2;
    weightedScore += (weight1 + weight2) / 2;
  });

  const maxPossibleScore = Math.min(genreSet1.size, genreSet2.size);
  return (weightedScore / maxPossibleScore) * 100;
};

const calculateAudioFeaturesSimilarity = (features1: any, features2: any): number => {
  if (!features1 || !features2) return 0;

  const keys: (keyof typeof features1)[] = [
    'avg_danceability',
    'avg_energy',
    'avg_valence',
    'avg_acousticness',
    'avg_instrumentalness',
  ];

  let totalDifference = 0;
  keys.forEach((key) => {
    const val1 = features1[key] || 0;
    const val2 = features2[key] || 0;
    totalDifference += Math.abs(val1 - val2);
  });

  const avgDifference = totalDifference / keys.length;
  return (1 - avgDifference) * 100;
};

const findCommonArtists = (artists1: any[], artists2: any[]): string[] => {
  if (!artists1?.length || !artists2?.length) return [];

  const set1 = new Map(artists1.map((a) => [a.id, a.name]));
  const set2 = new Set(artists2.map((a) => a.id));

  return Array.from(set1.entries())
    .filter(([id]) => set2.has(id))
    .map(([, name]) => name)
    .slice(0, 10);
};

const findCommonGenres = (genres1: any[], genres2: any[]): string[] => {
  if (!genres1?.length || !genres2?.length) return [];

  const genreSet1 = new Set(genres1.map((g) => g.genre));
  const genreSet2 = new Set(genres2.map((g) => g.genre));

  return [...genreSet1].filter((genre) => genreSet2.has(genre)).slice(0, 10);
};
