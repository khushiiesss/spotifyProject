import { Music, Heart, Users, Sparkles } from 'lucide-react';
import { getSpotifyAuthUrl } from '../services/spotifyAuth';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = getSpotifyAuthUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-2 text-white">
            <Music className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold">VibeShi</span>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20"></div>
              <Sparkles className="w-20 h-20 text-emerald-400 relative" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Find Your <span className="text-emerald-400">Sonic Soulmate</span>
          </h1>

          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with people who share your musical DNA. VibeShi analyzes your Spotify listening
            habits to match you with your perfect music companion.
          </p>

          <button
            onClick={handleLogin}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-5 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl hover:shadow-emerald-500/50 inline-flex items-center gap-3"
          >
            <Music className="w-6 h-6" />
            Connect with Spotify
          </button>

          <div className="grid md:grid-cols-3 gap-8 mt-24">
            <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Music Analysis</h3>
              <p className="text-slate-400 leading-relaxed">
                Deep dive into your top artists, genres, and listening patterns to build your unique
                musical profile.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Matching</h3>
              <p className="text-slate-400 leading-relaxed">
                Our algorithm calculates compatibility based on shared artists, genres, and audio
                preferences.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Connect & Chat</h3>
              <p className="text-slate-400 leading-relaxed">
                Match with people who vibe with your taste and start conversations about your
                favorite music.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
