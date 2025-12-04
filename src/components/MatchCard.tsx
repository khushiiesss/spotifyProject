import { Music2, Disc3, Radio } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type SpotifyData = Database['public']['Tables']['spotify_data']['Row'];

interface MatchCardProps {
  profile: Profile;
  spotifyData: SpotifyData;
  score: number;
  details: any;
}

export default function MatchCard({ profile, spotifyData, score, details }: MatchCardProps) {
  const topArtists = spotifyData.top_artists.slice(0, 6);
  const topGenres = spotifyData.top_genres.slice(0, 8);

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="relative">
        <div className="h-64 bg-gradient-to-br from-emerald-500/20 to-slate-800 flex items-center justify-center">
          <img
            src={profile.avatar_url || 'https://via.placeholder.com/300'}
            alt={profile.display_name}
            className="w-48 h-48 rounded-full border-4 border-slate-700 object-cover"
          />
        </div>

        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg">
          {score}% Match
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-3xl font-bold text-white mb-2">{profile.display_name}</h2>
        {profile.bio && <p className="text-slate-300 mb-6">{profile.bio}</p>}

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Top Artists</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {topArtists.map((artist: any) => (
                <div key={artist.id} className="text-center">
                  {artist.images?.[0] && (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-full aspect-square rounded-lg object-cover mb-2"
                    />
                  )}
                  <p className="text-sm text-slate-300 truncate">{artist.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Top Genres</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topGenres.map((genre: any, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
                >
                  {genre.genre}
                </span>
              ))}
            </div>
          </div>

          {details.common_artists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Disc3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Artists You Both Love</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {details.common_artists.map((artist: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm border border-emerald-500/30"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
