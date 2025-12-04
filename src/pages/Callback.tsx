import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { exchangeCodeForToken, storeAccessToken } from '../services/spotifyAuth';
import { fetchAllSpotifyData } from '../services/spotifyApi';
import { supabase } from '../lib/supabase';

export default function Callback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Authenticating with Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error || !code) {
          throw new Error('Authorization failed');
        }

        setStatus('Exchanging authorization code...');
        const accessToken = await exchangeCodeForToken(code);
        storeAccessToken(accessToken);

        setStatus('Fetching your Spotify data...');
        const spotifyData = await fetchAllSpotifyData(accessToken);

        setStatus('Creating your account...');
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: spotifyData.profile.email,
          password: crypto.randomUUID(),
        });

        if (signUpError && !signUpError.message.includes('already registered')) {
          throw signUpError;
        }

        let userId = authData.user?.id;

        if (!userId) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: spotifyData.profile.email,
            password: crypto.randomUUID(),
          });

          if (signInError) {
            const { data: sessionData } = await supabase.auth.getSession();
            userId = sessionData.session?.user?.id;
          } else {
            userId = signInData.user.id;
          }
        }

        if (!userId) {
          throw new Error('Failed to authenticate');
        }

        setStatus('Setting up your profile...');
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          display_name: spotifyData.profile.display_name || spotifyData.profile.id,
          avatar_url: spotifyData.profile.images?.[0]?.url || null,
          spotify_id: spotifyData.profile.id,
          spotify_email: spotifyData.profile.email,
          last_spotify_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;

        setStatus('Saving your music preferences...');
        const { error: spotifyDataError } = await supabase.from('spotify_data').upsert({
          user_id: userId,
          top_artists: spotifyData.topArtists,
          top_genres: spotifyData.topGenres,
          top_tracks: spotifyData.topTracks,
          playlists: spotifyData.playlists,
          audio_features: spotifyData.audioFeatures,
          updated_at: new Date().toISOString(),
        });

        if (spotifyDataError) throw spotifyDataError;

        setStatus('All set! Redirecting...');
        setTimeout(() => navigate('/discover'), 1000);
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-white mb-2">{status}</h2>
        <p className="text-slate-400">Please wait while we set up your profile</p>
      </div>
    </div>
  );
}
