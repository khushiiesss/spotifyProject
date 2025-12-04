/*
  # ibeShi - Music-Based Social Matching Platform

  ## Database Schema

  ### 1. New Tables
  
  #### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `display_name` (text) - User's display name
  - `avatar_url` (text) - Profile picture URL
  - `bio` (text) - User bio
  - `spotify_id` (text, unique) - Spotify user ID
  - `spotify_email` (text) - Email from Spotify
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `last_spotify_sync` (timestamptz) - Last time Spotify data was synced

  #### `spotify_data`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles) - Link to user profile
  - `top_artists` (jsonb) - Array of top artists with details
  - `top_genres` (jsonb) - Array of top genres with frequency
  - `top_tracks` (jsonb) - Array of top tracks
  - `playlists` (jsonb) - User's public playlists
  - `audio_features` (jsonb) - Aggregated audio features (danceability, energy, etc.)
  - `updated_at` (timestamptz) - Last data refresh

  #### `matches`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles) - First user
  - `matched_user_id` (uuid, references profiles) - Second user
  - `compatibility_score` (integer) - Score from 0-100
  - `compatibility_details` (jsonb) - Breakdown of score (artist overlap, genre match, etc.)
  - `status` (text) - Status: 'pending', 'liked', 'matched', 'passed'
  - `user_action` (text) - Action by user_id: 'like', 'pass', or null
  - `matched_user_action` (text) - Action by matched_user_id: 'like', 'pass', or null
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  #### `messages`
  - `id` (uuid, primary key)
  - `match_id` (uuid, references matches) - The match this message belongs to
  - `sender_id` (uuid, references profiles) - Who sent the message
  - `content` (text) - Message content
  - `created_at` (timestamptz)
  - `read` (boolean) - Whether message has been read

  ### 2. Security

  - Enable RLS on all tables
  - Users can read and update their own profile
  - Users can read their own Spotify data
  - Users can view matches where they are involved
  - Users can send/read messages in their matches
  - Only matched users can see each other's full profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  spotify_id text UNIQUE,
  spotify_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_spotify_sync timestamptz
);

-- Create spotify_data table
CREATE TABLE IF NOT EXISTS spotify_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  top_artists jsonb DEFAULT '[]'::jsonb,
  top_genres jsonb DEFAULT '[]'::jsonb,
  top_tracks jsonb DEFAULT '[]'::jsonb,
  playlists jsonb DEFAULT '[]'::jsonb,
  audio_features jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compatibility_score integer NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  compatibility_details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'liked', 'matched', 'passed')),
  user_action text CHECK (user_action IN ('like', 'pass')),
  matched_user_action text CHECK (matched_user_action IN ('like', 'pass')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, matched_user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Spotify data policies
CREATE POLICY "Users can view own spotify data"
  ON spotify_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spotify data"
  ON spotify_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spotify data"
  ON spotify_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "System can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = matched_user_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their matches"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
      AND matches.status = 'matched'
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
      AND matches.status = 'matched'
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
    )
  );