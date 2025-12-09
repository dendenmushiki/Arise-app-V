import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useStore } from "../store";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Dumbbell, Flame, Trophy } from "lucide-react";
import io from "socket.io-client";
import LevelProgress from "../components/LevelProgress";
import CoreAttributes from "../components/CoreAttributes";
import QuestNotif from "../components/QuestNotif.jsx";
import { xpToLevel } from "../utils/xp";
import ProfileBorder from "../components/ProfileBorders/ProfileBorder";
import AvatarSelectionModal from "../components/AvatarSelectionModal";
import BadgeDisplay from "../components/BadgeDisplay";

export default function Dashboard() {
  const user = useStore((s) => s.user);
  const setAuth = useStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [milestoneNotif, setMilestoneNotif] = useState(null);

  // kunin ang current rank letter para sa styling (D, C, B, A, S)
  const rankLetter = (profile?.rank || user?.rank || 'D').toString().toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/profile");
        setProfile(res.data.user);
        // Mag-trigger ng core attributes refetch pagkatapos ng profile load upang masiguro ang latest data
        if (user?.id) {
          await api.get("/core-attributes");
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();

    // Makinig para sa milestone unlock socket events
    const socket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("stat_milestone", (data) => {
      if (data.userId === user?.id) {
        const message = `🎉 Milestone: ${data.badge_name} (${data.attribute} ${data.milestone})`;
        setMilestoneNotif(message);
        setTimeout(() => setMilestoneNotif(null), 5000);
      }
    });

    return () => socket.disconnect();
  }, [user?.id]);

  function logout() {
    setAuth(null, null);
    setAuthToken(null);
    navigate('/');
  }

  function handleAvatarSelected(avatarUrl) {
    setProfile((prev) => ({ ...prev, avatar: avatarUrl }));
  }

  function handleMilestoneUnlock(milestone) {
    setMilestoneNotif(milestone);
    setTimeout(() => setMilestoneNotif(null), 5000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const xp = profile?.xp ?? user?.xp ?? 0;
  const profileLevel = profile?.level ?? user?.level ?? 1;
  const { level, progress } = xpToLevel(xp, profileLevel);

  return (
    <div className="h-screen bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white px-4 m-6">
      <QuestNotif />

      {/* Milestone Unlock Notification */}
      <AnimatePresence>
        {milestoneNotif && (
          <motion.div
            className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 max-w-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Trophy size={20} className="text-yellow-300" />
            <span className="font-semibold text-center flex-1">{milestoneNotif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4 max-w-[1200px] mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-4xl font-bold text-white"
          whileHover={{ scale: 1.05 }}
        >
          DASHBOARD
        </motion.h1>

        <div className="flex items-center gap-4">
          <nav className="flex space-x-6">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/workouts"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold"
              >
                WORKOUTS
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/chat"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold"
              >
                CHAT
              </Link>
            </motion.div>
          </nav>

          <motion.button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-[#0d0e26] border border-violet-500 text-white font-semibold shadow-button hover:bg-[#0f102b] hover:border-violet-400 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            LOGOUT
          </motion.button>
        </div>
      </motion.header>

      {/* Welcome & Progress Cards Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Welcome Card - Enhanced with Profile */}
        <motion.section
          className={`lg:col-span-2 card p-6 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-md profile-welcome-card dashboard-rank${rankLetter}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex gap-6 items-start">
            {/* Avatar with Rank Border */}
            <motion.div
              className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowAvatarModal(true)}
              whileHover={{ scale: 1.05 }}
            >
              <ProfileBorder borderType={profile?.profileBorder || 'rankD'} size={100}>
                <img
                  src={profile?.avatar || '/assets/avatars/default-avatar.svg'}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    try {
                      const el = e.target;
                      const src = el.src || (profile && profile.avatar) || '';
                      if (src && src.endsWith('.png')) {
                        // subukan ang svg equivalent ONCE
                        const svgSrc = src.replace(/\.png$/i, '.svg');
                        if (svgSrc !== src) {
                          el.onerror = null;
                          el.src = svgSrc;
                          return;
                        }
                      }
                    } catch (err) {}
                    e.target.src = '/assets/avatars/default-avatar.svg';
                  }}
                />
              </ProfileBorder>
              <p className="text-center text-xs text-gray-400 mt-1">Click to change</p>
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className={`text-2xl font-bold text-white username-highlight username-rank${rankLetter}`}>{profile?.username || user?.username}</h2>
                <p className="text-violet-300 font-semibold mt-1">{profile?.title || 'Newly Awakened'}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm text-gray-400">Rank:</span>
                  <span className={`px-3 py-1 rounded-full text-white font-bold text-sm`}>
                    {profile?.rank || 'D'}
                  </span>
                </div>
              </motion.div>

              <motion.p
                className="description-text text-lg mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Level <span className="font-bold text-violet-400">{level}</span> • 
                <span className="text-violet-400 font-bold ml-2">{xp} XP</span>
              </motion.p>

              {/* Badges Section */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Achievements</h3>
                <BadgeDisplay badges={profile?.badges || []} />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Level Progress Card */}
        <motion.section
          className="card p-6 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.h3
            className="text-lg font-semibold mb-4 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Progress to Level {level + 1}
          </motion.h3>
          <LevelProgress level={level} progress={progress} />
        </motion.section>
      </div>

      {/* Avatar Selection Modal */}
      <AvatarSelectionModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarSelected={handleAvatarSelected}
      />

      {/* Stats Overview & Allocation */}
      <CoreAttributes xp={xp} level={level} userId={user?.id} onMilestoneUnlock={handleMilestoneUnlock} />

      {/* Milestone Notification */}
      {milestoneNotif && (
        <motion.div
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg shadow-lg text-white max-w-sm z-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="font-bold">🎉 Milestone Unlocked!</div>
          <div className="text-sm mt-1">{milestoneNotif.attribute} reached {milestoneNotif.milestone}!</div>
          <div className="text-xs mt-2 text-violet-200">New badge & border unlocked</div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <motion.h3
          className="text-2xl mb-6 text-center font-semibold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          QUICK ACTIONS
        </motion.h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Compass, title: "DAILY QUEST", desc: "Complete your mission", link: "/quest" },
            { icon: Dumbbell, title: "LOG WORKOUT", desc: "Track your progress", link: "/workouts" },
            { icon: Flame, title: "CHALLENGES", desc: "Test our limits", link: "/challenges" },
          ].map((action, idx) => {
            const IconComponent = action.icon;
            return (
            <motion.div
              key={idx}
              className="card mb-6 p-6 text-center bg-[#12141f] border border-violet-700 rounded-xl shadow-md hover:bg-violet-500 hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link to={action.link} className="block">
                <div className="mb-4 flex justify-center">
                  <IconComponent size={48} strokeWidth={2} />
                </div>
                <div className="text-violet-400 text-xl font-bold mb-2">{action.title}</div>
                <div className="description-text">{action.desc}</div>
              </Link>
            </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
