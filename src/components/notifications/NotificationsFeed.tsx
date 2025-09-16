"use client";
import React, { useEffect, useMemo, useState } from 'react';
import styles from './Notifications.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { emitMessagesUpdated, onMessagesUpdated } from '@/lib/messagesBus';
import { armSoundEngine, isSoundEnabled, playDing, setSoundEnabled } from '@/lib/sound';
import Link from 'next/link';

export type NotificationMessage = {
  id: string;
  type: string;
  text: string;
  from?: string;
  unread?: boolean;
  created_at?: string;
};

export function NotificationsFeed() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const prevUnreadRef = React.useRef<number>(-1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastSeenTs, setLastSeenTs] = useState<number>(0);
  const isUserActionRef = React.useRef<boolean>(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    // Initialize sound state & arm engine for Chrome autoplay policy
    setSoundOn(isSoundEnabled());
    armSoundEngine();
    // Cross-tab unread updates -> refresh local messages when we know they changed elsewhere
    const off = onMessagesUpdated(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const md = (user?.user_metadata || {}) as any;
      const msgs = Array.isArray(md.messages) ? md.messages as NotificationMessage[] : [];
      if (!mounted) return;
      setMessages(msgs);
    });
    (async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) { setError(error.message); setLoading(false); return; }
      const md = (user?.user_metadata || {}) as any;
      const msgs = Array.isArray(md.messages) ? md.messages as NotificationMessage[] : [];
      setMessages(msgs);
      // watermark for latest message timestamp to avoid playing sound for history
      const maxTs = msgs.reduce((mx, m) => Math.max(mx, m.created_at ? Date.parse(m.created_at) : 0), 0);
      setLastSeenTs(maxTs);
      emitMessagesUpdated(msgs);
      setLoading(false);
    })();
    // Polling to catch new admin messages quickly without reload
    const POLL_MS = 20000;
    const poll = window.setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const md = (user?.user_metadata || {}) as any;
      const msgs = Array.isArray(md.messages) ? md.messages as NotificationMessage[] : [];
      if (!mounted) return;
      setMessages(msgs);
      emitMessagesUpdated(msgs);
    }, POLL_MS);
    return () => { mounted = false; off(); window.clearInterval(poll); };
  }, [supabase]);

  // Play a ding when either unread count or total messages count increases (after initial mount), if sound is enabled
  const unreadCount = useMemo(() => messages.filter(m => m.unread).length, [messages]);
  const msgCount = messages.length;
  const prevLenRef = React.useRef<number>(-1);
  useEffect(() => {
    if (prevUnreadRef.current === -1 || prevLenRef.current === -1) {
      prevUnreadRef.current = unreadCount;
      prevLenRef.current = msgCount;
      return;
    }
    const unreadIncreased = unreadCount > prevUnreadRef.current;
    const lenIncreased = msgCount > prevLenRef.current;
    if ((unreadIncreased || lenIncreased) && isSoundEnabled() && !isUserActionRef.current) {
      // Check if there is at least one message newer than the watermark
      const maxTs = messages.reduce((mx, m) => Math.max(mx, m.created_at ? Date.parse(m.created_at) : 0), 0);
      if (maxTs > lastSeenTs) {
        playDing();
        setLastSeenTs(maxTs);
      }
    }
    prevUnreadRef.current = unreadCount;
    prevLenRef.current = msgCount;
    // reset the user-action flag each cycle
    if (isUserActionRef.current) isUserActionRef.current = false;
  }, [unreadCount, msgCount, messages, lastSeenTs]);

  const markAllRead = async () => {
    try {
      isUserActionRef.current = true;
      const { data: { user } } = await supabase.auth.getUser();
      const md = (user?.user_metadata || {}) as any;
      const msgs = (Array.isArray(md.messages) ? md.messages : []).map((m: any) => ({ ...m, unread: false }));
      const { error } = await supabase.auth.updateUser({ data: { ...md, messages: msgs } });
      if (error) throw error;
      // Ensure we fetch new user to stay in sync with auth state
      await supabase.auth.refreshSession();
      const { data: { user: u2 } } = await supabase.auth.getUser();
      const md2 = (u2?.user_metadata || {}) as any;
      const msgs2 = (Array.isArray(md2.messages) ? md2.messages : []) as NotificationMessage[];
      setMessages(msgs2);
      emitMessagesUpdated(msgs);
      // Advance watermark to current latest to prevent sound right after user action
      const maxTs = msgs2.reduce((mx, m) => Math.max(mx, m.created_at ? Date.parse(m.created_at) : 0), 0);
      setLastSeenTs(maxTs);
    } catch (e: any) {
      setError(e?.message || 'Failed to update messages');
    }
  };

  const markOneRead = async (id: string) => {
    try {
      isUserActionRef.current = true;
      setUpdatingId(id);
      const { data: { user } } = await supabase.auth.getUser();
      const md = (user?.user_metadata || {}) as any;
      const msgs: any[] = Array.isArray(md.messages) ? md.messages : [];
      const next = msgs.map((m) => m && m.id === id ? { ...m, unread: false } : m);
      const { error } = await supabase.auth.updateUser({ data: { ...md, messages: next } });
      if (error) throw error;
      await supabase.auth.refreshSession();
      const { data: { user: u2 } } = await supabase.auth.getUser();
      const md2 = (u2?.user_metadata || {}) as any;
      const msgs2 = (Array.isArray(md2.messages) ? md2.messages : []) as NotificationMessage[];
      setMessages(msgs2);
      emitMessagesUpdated(msgs2);
      const maxTs = msgs2.reduce((mx, m) => Math.max(mx, m.created_at ? Date.parse(m.created_at) : 0), 0);
      setLastSeenTs(maxTs);
    } catch (e: any) {
      setError(e?.message || 'Failed to update message');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>შეტყობინებები</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => {
              const next = !isSoundEnabled();
              setSoundEnabled(next);
              setSoundOn(next);
              armSoundEngine();
            }}
            className={styles.toolbarBtnGhost}
            aria-pressed={soundOn}
            type="button"
            title="ახალი შეტყობინების ხმის ჩართვა/გამორთვა"
          >
            ხმა: {soundOn ? 'ჩართული' : 'გამორთული'}
          </button>
          {messages.length > 0 && (
            <button onClick={markAllRead} className={styles.toolbarBtn}>
              მონიშნე ყველა წაკითხულად{unreadCount ? ` (${unreadCount})` : ''}
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className={styles.muted}>იტვირთება...</div>
      ) : error ? (
        <div className={styles.alert}>{error}</div>
      ) : messages.length === 0 ? (
        <div className={styles.muted}>შეტყობინებები არ არის.</div>
      ) : (
        <ul className={styles.notificationsList} role="list">
          {messages.map((m) => (
            <li key={m.id} className={`${styles.notificationsItem} ${m.unread ? styles.unread : ''}`}>
              <div className={styles.itemHead}>
                {m.unread && <span className={styles.dot} aria-hidden="true" />}
                <span className={styles.itemType}>{m.type === 'reject' ? 'უარყოფა' : 'ადმინისტრატორი'}</span>
                <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  {m.unread && (
                    <button
                      className={styles.itemActionBtn}
                      type="button"
                      disabled={updatingId === m.id}
                      onClick={() => markOneRead(m.id)}
                    >
                      მონიშნე წაკითხულად
                    </button>
                  )}
                  {m.created_at && (
                    <span className={styles.itemTime}>{new Date(m.created_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div
                className={[
                  styles.itemText,
                  !expanded[m.id] ? styles.itemTextCollapsed : '',
                  styles.itemTextClickable,
                ].join(' ')}
                onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
              >
                {m.text}
              </div>
              {m.text && m.text.length > 120 && (
                <button
                  className={styles.itemMoreBtn}
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
                  aria-expanded={!!expanded[m.id]}
                  aria-controls={`msg-${m.id}`}
                >
                  {expanded[m.id] ? 'ჩაკეცვა' : 'მეტის ნახვა'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.backLink}>
        <Link href="/">← მთავარ გვერდზე დაბრუნება</Link>
      </div>
    </div>
  );
}

export default NotificationsFeed;
