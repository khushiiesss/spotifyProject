export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string;
          spotify_id: string | null;
          spotify_email: string | null;
          created_at: string;
          updated_at: string;
          last_spotify_sync: string | null;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string;
          spotify_id?: string | null;
          spotify_email?: string | null;
          created_at?: string;
          updated_at?: string;
          last_spotify_sync?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string;
          spotify_id?: string | null;
          spotify_email?: string | null;
          created_at?: string;
          updated_at?: string;
          last_spotify_sync?: string | null;
        };
      };
      spotify_data: {
        Row: {
          id: string;
          user_id: string;
          top_artists: SpotifyArtist[];
          top_genres: GenreCount[];
          top_tracks: SpotifyTrack[];
          playlists: SpotifyPlaylist[];
          audio_features: AudioFeatures;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          top_artists?: SpotifyArtist[];
          top_genres?: GenreCount[];
          top_tracks?: SpotifyTrack[];
          playlists?: SpotifyPlaylist[];
          audio_features?: AudioFeatures;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          top_artists?: SpotifyArtist[];
          top_genres?: GenreCount[];
          top_tracks?: SpotifyTrack[];
          playlists?: SpotifyPlaylist[];
          audio_features?: AudioFeatures;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          matched_user_id: string;
          compatibility_score: number;
          compatibility_details: CompatibilityDetails;
          status: 'pending' | 'liked' | 'matched' | 'passed';
          user_action: 'like' | 'pass' | null;
          matched_user_action: 'like' | 'pass' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          matched_user_id: string;
          compatibility_score: number;
          compatibility_details?: CompatibilityDetails;
          status?: 'pending' | 'liked' | 'matched' | 'passed';
          user_action?: 'like' | 'pass' | null;
          matched_user_action?: 'like' | 'pass' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          matched_user_id?: string;
          compatibility_score?: number;
          compatibility_details?: CompatibilityDetails;
          status?: 'pending' | 'liked' | 'matched' | 'passed';
          user_action?: 'like' | 'pass' | null;
          matched_user_action?: 'like' | 'pass' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          read: boolean;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          read?: boolean;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          read?: boolean;
        };
      };
    };
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: { url: string }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
}

export interface GenreCount {
  genre: string;
  count: number;
}

export interface AudioFeatures {
  avg_danceability: number;
  avg_energy: number;
  avg_valence: number;
  avg_acousticness: number;
  avg_instrumentalness: number;
}

export interface CompatibilityDetails {
  artist_overlap: number;
  genre_match: number;
  audio_features_similarity: number;
  common_artists: string[];
  common_genres: string[];
}
