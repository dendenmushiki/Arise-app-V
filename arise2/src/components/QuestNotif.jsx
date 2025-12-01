import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../api.js';
import { useStore } from '../store.js';

export default function QuestNotif() {
  const user = useStore((s) => s.user);
  const queuedFromStore = useStore((s) => s.showQuestNotifQueued);
  const setQueuedInStore = useStore((s) => s.setShowQuestNotifQueued);
  const [quest, setQuest] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forceShowRequest, setForceShowRequest] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setForceShowRequest(true);
    window.addEventListener('app:showQuestNotif', handler);
    return () => window.removeEventListener('app:showQuestNotif', handler);
  }, []);

  useEffect(() => {
    if (queuedFromStore) {
      setQueuedInStore(false);
      setForceShowRequest(true);
    }
  }, [queuedFromStore, setQueuedInStore]);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      if (!user?.id) return;
      const today = new Date().toISOString().slice(0, 10);
      const seenKey = `questNotifSeen:${user.id}:${today}`;
      const sessionFlag = sessionStorage.getItem('showQuestNotif');
      // Only show if it's a forced request (login/manual trigger) or if it's the first session load for this day
      let shouldShow = (sessionFlag && !localStorage.getItem(seenKey)) || forceShowRequest;

      if (shouldShow) {
        setForceShowRequest(false);
        if (!cancelled) await fetchQuest();
      }
    }

    runCheck();
    return () => { cancelled = true; };
  }, [user?.id, forceShowRequest]);

  async function fetchQuest() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/quests/today/${user.id}`);
      const q = res?.data?.quest || res?.data || null;
      if (q) {
        setQuest(q);
        playOpenSound();
        setOpen(true);
        try {
          const today = new Date().toISOString().slice(0, 10);
          localStorage.setItem(`questNotifSeen:${user?.id}:${today}`, '1');
        } catch {}
      }
    } catch (err) {
      console.error('Failed to fetch quest', err);
    } finally {
      setLoading(false);
    }
  }

  function playOpenSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch {}
  }

  function remindLater(minutes = 60) {
    try {
      const remindKey = `questNotifRemind:${user?.id}`;
      localStorage.setItem(remindKey, String(Date.now() + minutes * 60 * 1000));
      setOpen(false);
    } catch { setOpen(false); }
  }

  if (!open || !quest) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-40"
        onClick={() => setOpen(false)}
      />

      {/* Quest Notification Modal */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.2}
        whileDrag={{ scale: 1.02 }}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20, duration: 0.45 }}
        className="fixed z-50 left-1/3 top-1/4 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-8 bg-dark-bg rounded-2xl border-2 border-neon-purple shadow-2xl relative animate-border-scan cursor-grab active:cursor-grabbing"
      >
        {/* Floating XP Orb */}
        <motion.div
          className="absolute -top-4 -left-4 w-5 h-5 rounded-full bg-neon-purple shadow-lg shadow-neon-purple"
          animate={{ 
            scale: [1, 1.4, 1], 
            y: [0, -6, 0]  // float up and down
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />

        {/* Header */}
        <div className="flex justify-center items-center mb-6">
          <h3 className="quest-title text-3xl text-white">Today's Quest</h3>
        </div>

        {/* Quest Content + Actions (in a colorless bordered container with strong shadow) */}
        <div className="mb-3 border border-transparent shadow-2xl rounded-2xl p-6" style={{ boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}>
          <div className="mb-6">
            <div className="font-bold text-white text-2xl flex justify-center items-center">{quest.title}</div>
            <div className="description-text text-base text-gray-300 mt-2 flex justify-center items-center">{quest.description}</div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex px-9 py-3 bg-gradient-to-r from-neon-purple to-purple-600 text-white text-md font-bold rounded-2xl shadow-glow-purple hover:shadow-glow-purple/80 transition-all duration-300"
              onClick={() => {
                setOpen(false);
                navigate('/quest');
              }}
            >
              Open Quest
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 border border-neon-purple text-white text-base rounded-2xl hover:border-purple-400 hover:text-purple-300 transition-all duration-300"
              onClick={() => setOpen(false)}
            >
              Dismiss
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex px-55 py-3 border border-yellow-500 text-yellow-300 text-base rounded-2xl hover:bg-yellow-500 hover:text-white transition-all duration-300"
              onClick={() => remindLater(60)}
            >
              Remind me later
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
