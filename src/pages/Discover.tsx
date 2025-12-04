import { useEffect, useState } from 'react';
import { Music, Heart, X, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateCompatibility } from '../services/compatibility';
import type { Database } from '../lib/database.types';
import MatchCard from '../components/MatchCard';
import ChatModal from '../components/ChatModal';

type Profile = Database['public']['Tables']['profiles']['Row'];
type SpotifyData = Database['public']['Tables']['spotify_data']['Row'];
type Match = Database['public']['Tables']['matches']['Row'] & {
  matched_profile?: Profile;
};

export default function Discover() {
  const { user, profile, signOut } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<{
    profile: Profile;
    spotifyData: SpotifyData;
    score: number;
    details: any;
  } | null>(null);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Match | null>(null);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (user) {
      loadNextMatch();
      loadMyMatches();
    }
  }, [user]);

  const loadMyMatches = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        matched_profile:profiles!matches_matched_user_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'matched')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyMatches(data as Match[]);
    }
  };

  const loadNextMatch = async () => {
    if (!user) return;

    setLoading(true);

    const { data: mySpotifyData } = await supabase
      .from('spotify_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!mySpotifyData) {
      setLoading(false);
      return;
    }

    const { data: existingMatches } = await supabase
      .from('matches')
      .select('matched_user_id')
      .eq('user_id', user.id);

    const excludedIds = [user.id, ...(existingMatches?.map((m) => m.matched_user_id) || [])];

    const { data: potentialMatches } = await supabase
      .from('profiles')
      .select('*, spotify_data(*)')
      .not('id', 'in', `(${excludedIds.join(',')})`)
      .limit(1);

    if (potentialMatches && potentialMatches.length > 0) {
      const match = potentialMatches[0];
      const spotifyData = (match as any).spotify_data?.[0];

      if (spotifyData) {
        const compatibility = calculateCompatibility(mySpotifyData, spotifyData);

        await supabase.from('matches').insert({
          user_id: user.id,
          matched_user_id: match.id,
          compatibility_score: compatibility.score,
          compatibility_details: compatibility.details,
          status: 'pending',
        });

        setCurrentMatch({
          profile: match,
          spotifyData,
          score: compatibility.score,
          details: compatibility.details,
        });
      }
    } else {
      setCurrentMatch(null);
    }

    setLoading(false);
  };

  const handleAction = async (action: 'like' | 'pass') => {
    if (!user || !currentMatch) return;

    const { data: existingMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('matched_user_id', currentMatch.profile.id)
      .maybeSingle();

    if (existingMatch) {
      const newStatus = action === 'like' ? 'liked' : 'passed';

      await supabase
        .from('matches')
        .update({
          user_action: action,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMatch.id);

      if (action === 'like') {
        const { data: reverseMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id', currentMatch.profile.id)
          .eq('matched_user_id', user.id)
          .maybeSingle();

        if (reverseMatch?.user_action === 'like') {
          await supabase
            .from('matches')
            .update({ status: 'matched' })
            .eq('id', existingMatch.id);

          await supabase
            .from('matches')
            .update({ status: 'matched' })
            .eq('id', reverseMatch.id);

          loadMyMatches();
        }
      }
    }

    loadNextMatch();
  };

  if (loading && !currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-emerald-400 animate-pulse mx-auto mb-4" />
          <p className="text-white text-xl">Finding your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Music className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold">ibeShi</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMatches(!showMatches)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Matches ({myMatches.length})</span>
            </button>

            <div className="flex items-center gap-3 text-white">
              <img
                src={profile?.avatar_url || 'https://via.placeholder.com/40'}
                alt={profile?.display_name}
                className="w-10 h-10 rounded-full"
              />
              <span className="font-medium">{profile?.display_name}</span>
            </div>

            <button
              onClick={signOut}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {showMatches ? (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Your Matches</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => setActiveChat(match)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={match.matched_profile?.avatar_url || 'https://via.placeholder.com/60'}
                      alt={match.matched_profile?.display_name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {match.matched_profile?.display_name}
                      </h3>
                      <p className="text-emerald-400 font-semibold">
                        {match.compatibility_score}% Match
                      </p>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
                    Start Chat
                  </button>
                </div>
              ))}

              {myMatches.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No matches yet. Keep swiping!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            {currentMatch ? (
              <div>
                <MatchCard
                  profile={currentMatch.profile}
                  spotifyData={currentMatch.spotifyData}
                  score={currentMatch.score}
                  details={currentMatch.details}
                />

                <div className="flex justify-center gap-8 mt-8">
                  <button
                    onClick={() => handleAction('pass')}
                    className="w-20 h-20 rounded-full bg-slate-700 hover:bg-red-500 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-xl"
                  >
                    <X className="w-10 h-10" />
                  </button>
                  <button
                    onClick={() => handleAction('like')}
                    className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-xl"
                  >
                    <Heart className="w-10 h-10" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Music className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">
                  No more matches right now
                </h3>
                <p className="text-slate-400">Check back later for more sonic soulmates!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {activeChat && (
        <ChatModal match={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  );
}
