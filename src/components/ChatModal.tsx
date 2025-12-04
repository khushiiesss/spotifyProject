import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Match = Database['public']['Tables']['matches']['Row'] & {
  matched_profile?: Database['public']['Tables']['profiles']['Row'];
};

type Message = Database['public']['Tables']['messages']['Row'];

interface ChatModalProps {
  match: Match;
  onClose: () => void;
}

export default function ChatModal({ match, onClose }: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    const subscription = supabase
      .channel(`match-${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [match.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', match.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);

      const unreadMessages = data.filter(
        (msg) => msg.sender_id !== user?.id && !msg.read
      );
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessages.map((msg) => msg.id));
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);

    const { error } = await supabase.from('messages').insert({
      match_id: match.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }

    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[600px] flex flex-col border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={match.matched_profile?.avatar_url || 'https://via.placeholder.com/40'}
              alt={match.matched_profile?.display_name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {match.matched_profile?.display_name}
              </h3>
              <p className="text-sm text-emerald-400">{match.compatibility_score}% Match</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                Start the conversation! Say hi and share your favorite music.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
