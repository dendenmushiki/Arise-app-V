import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";
import LightPillar from "../components/LightPillar";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowForm(true), 5500);
    // small delay so the pillar is visible before the floating logo appears
    const logoTimer = setTimeout(() => setShowLogo(true), 2000);
    return () => {
      clearTimeout(t);
      clearTimeout(logoTimer);
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/login", { username, password });
      const { token, user } = res.data;
      setAuth(token, user);
      setAuthToken(token);
      useStore.getState().setShowQuestNotifQueued(true);
      sessionStorage.setItem('showQuestNotif', '1');
      window.dispatchEvent(new Event('app:showQuestNotif'));
      navigate("/home");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed. Please check your credentials.");
    }
  }
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom right, #0b0d1c, #0a0b16)",
      }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={1.0}
          rotationSpeed={0.3}
          glowAmount={0.005}
          pillarWidth={3.0}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={0}
          interactive={false}
          mixBlendMode="screen"
        />
      </motion.div>

      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(82, 39, 255, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(82, 39, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Floating logo that appears first, then animates into the form logo via shared layoutId */}
      <AnimatePresence>
        {!showForm && showLogo && (
          <motion.img
            key="floating-logo"
            src="/assets/arise-logo.png"
            alt="Arise Logo"
            layoutId="arise-logo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 10, damping: 18, mass: 1.1, delay: 0.08 }}
            style={{ position: 'absolute', bottom: '1%', left: '22%', transform: 'translate(-10%, -10%)', zIndex: 20, width: 840, height: 840, objectFit: 'contain' }}
          />
        )}
      </AnimatePresence>

      {/* show form after delay so the pillar and floating logo have time to appear */}
      {/* form mounting triggers the shared-layout animation from floating logo -> form logo */}
      {/* Delay kept in sync with the form transition delay below */}
      <AnimatePresence>
        {showForm && (
          <motion.form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl border shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(13, 14, 38, 0.6)",
          borderColor: "rgba(138, 43, 226, 0.5)",
          boxShadow: "0 0 40px rgba(82, 39, 255, 0.2), 0 16px 48px rgba(0,0,0,0.85)",
        }}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
          <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
                  <motion.img
                    src="/assets/arise-logo.png"
                    alt="Arise Logo"
                    layoutId="arise-logo"
                    className="wd-25px h-25px object-contain mb-4"
                    transition={{ type: 'spring', stiffness: 90, damping: 16, mass: 1.1 }}
                    // slower layout transition to match floating logo
                    layoutTransition={{ duration: 1.2, ease: 'easeInOut' }}
                  />
          <h1
            className="text-3xl font-bold tracking-wider"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(to right, #5227FF, #FF9FFC)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            LOGIN
          </h1>
          <p className="text-gray-400 text-sm mt-2">Enter your credentials to continue</p>
        </motion.div>

        <motion.div className="mb-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-3 rounded-xl text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none"
            style={{ background: "#12141f", border: "1px solid #7c3aed" }}
            onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={(e) => (e.target.style.borderColor = "#7c3aed")}
            required
          />
        </motion.div>

        <motion.div className="mb-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded-xl text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none"
            style={{ background: "#12141f", border: "1px solid #7c3aed" }}
            onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={(e) => (e.target.style.borderColor = "#7c3aed")}
            required
          />
        </motion.div>

        {error && (
          <motion.p className="text-red-400 mb-4 text-center text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          className="w-full p-3 rounded-xl text-white font-bold transition-all duration-300 shadow-md mb-4"
          style={{ background: "#7c3aed" }}
          whileHover={{ scale: 1.03, background: "#8b5cf6", boxShadow: "0 0 30px rgba(82, 39, 255, 0.5)" }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          LOGIN
        </motion.button>

        <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <p className="text-white text-sm">
            Don't have an account? {" "}
            <Link to="/register" className="font-semibold transition-colors duration-300" style={{ color: "#a78bfa" }}>
              Register here
            </Link>
          </p>
        </motion.div>

        <div className="absolute top-0 left-0 w-16 h-16 rounded-tl-2xl pointer-events-none" style={{ borderLeft: "2px solid rgba(82, 39, 255, 0.3)", borderTop: "2px solid rgba(82, 39, 255, 0.3)" }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 rounded-br-2xl pointer-events-none" style={{ borderRight: "2px solid rgba(255, 159, 252, 0.3)", borderBottom: "2px solid rgba(255, 159, 252, 0.3)" }} />
        </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
