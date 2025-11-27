import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useStore } from "../store";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Dumbbell, Flame } from "lucide-react";
import LevelProgress from "../components/LevelProgress";
import CoreAttributes from "../components/CoreAttributes";
import QuestNotif from "../components/QuestNotif.jsx";
import { xpToLevel } from "../utils/xp";

export default function Dashboard() {
  const user = useStore((s) => s.user);
  const setAuth = useStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/profile");
        setProfile(res.data.user);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function logout() {
    setAuth(null, null);
    setAuthToken(null);
    navigate('/');
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
  const { level, progress } = xpToLevel(xp);

  return (
    <div className="h-screen bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white px-4">
      <QuestNotif />

      {/* Header */}
      <motion.header
        className="flex justify-between items-center mb-8"
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
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Welcome Card */}
        <motion.section
          className="card p-6 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.h2
            className="text-2xl font-bold mb-2 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Welcome, <span className="font-extrabold text-violet-300">{profile?.username || user?.username}</span>
          </motion.h2>
          <motion.p
            className="description-text text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Level {level} • <span className="text-violet-400 font-bold">{xp} XP</span>
          </motion.p>
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

      {/* Stats Overview */}
      <CoreAttributes xp={xp} level={level} />

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
              className="card p-6 text-center bg-[#12141f] border border-violet-700 rounded-xl shadow-md hover:bg-violet-500 hover:text-white transition-all duration-300"
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
