"use client";
import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import Link from 'next/link';

type Message = {
  id: string;
  type: string;
  text: string;
  from?: string;
  unread?: boolean;
  created_at?: string;
};

export default function NotificationsPage() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) { setError(error.message); setLoading(false); return; }
      const md = (user?.user_metadata || {}) as any;
      const msgs = Array.isArray(md.messages) ? md.messages as Message[] : [];
      setMessages(msgs);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const unreadCount = useMemo(() => messages.filter(m => m.unread).length, [messages]);

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const md = (user?.user_metadata || {}) as any;
      const msgs = (Array.isArray(md.messages) ? md.messages : []).map((m: any) => ({ ...m, unread: false }));
      const { error } = await supabase.auth.updateUser({ data: { ...md, messages: msgs } });
      if (error) throw error;
      setMessages(msgs);
    } catch (e: any) {
      setError(e?.message || 'Failed to update messages');
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>შეტყობინებები</h1>
        {messages.length > 0 && (
          <button onClick={markAllRead} style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: 8, padding: '.45rem .7rem', fontWeight: 600, fontSize: '.8rem' }}>
            მონიშნე ყველა წაკითხულად{unreadCount ? ` (${unreadCount})` : ''}
          </button>
        )}
      </div>
      {loading ? (
        <div>იტვირთება...</div>
      ) : error ? (
        <div style={{ color: '#991b1b', background: '#fee2e2', padding: '.6rem .8rem', border: '1px solid #fecaca', borderRadius: 8 }}>{error}</div>
      ) : messages.length === 0 ? (
        <div style={{ color: '#475569' }}>შეტყობინებები არ არის.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {messages.map((m) => (
            <li key={m.id} style={{ border: '1px solid #e2e8f0', background: m.unread ? '#f8fafc' : '#ffffff', borderRadius: 10, padding: '.7rem .85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#475569' }}>{m.type === 'reject' ? 'უარყოფა' : 'ადმინისტრატორი'}</span>
                {m.created_at && <span style={{ fontSize: '.65rem', color: '#94a3b8' }}>{new Date(m.created_at).toLocaleString()}</span>}
              </div>
              <div style={{ fontSize: '.86rem', color: '#0f172a', lineHeight: '1.25rem' }}>{m.text}</div>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: '1rem' }}>
        <Link href="/">← მთავარ გვერდზე დაბრუნება</Link>
      </div>
    </div>
  );
}
