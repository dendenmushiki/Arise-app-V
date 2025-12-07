import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import AwakeningAssessmentModal from '../components/AwakeningAssessmentModal';
import { useStore } from '../store';
import { setAuthToken } from '../api';
import LightPillar from "../components/LightPillar";

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAwakening, setShowAwakening] = useState(false);
  const [newUserId, setNewUserId] = useState(null);
  const navigate = useNavigate();

  const validateUsername = (value) => {
    if (value.length < 4 || value.length > 20) {
      return 'Username must be 4-20 characters.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only have letters, numbers, and underscores.';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (value.length < 8 || value.length > 20) {
      return 'Password must be 8-20 characters.';
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return 'Password needs uppercase, lowercase, number, and special character.';
    }
    return '';
  };

  async function handleSignup(e) {
    e.preventDefault();

    const userErr = validateUsername(username);
    const passErr = validatePassword(password);

    setUsernameError(userErr);
    setPasswordError(passErr);
    setError('');
    setSuccess('');

    if (userErr || passErr) return;

    try {
      const res = await axios.post('http://localhost:3001/api/register', {
        username,
        password
      });

      setSuccess('Registration successful! Starting awakening assessment...');
      localStorage.setItem('user', JSON.stringify(res.data));

      const setAuth = useStore.getState().setAuth;
      try {
        if (res.data && res.data.token) {
          setAuth(res.data.token, res.data.user);
          setAuthToken(res.data.token);
        }
      } catch (e) {
        console.warn('Failed to set auth in store', e);
      }

      setNewUserId(res.data.user.id);
      setShowAwakening(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  const handleAwakeningComplete = (attributes) => {
    setShowAwakening(false);
    setUsername('');
    setPassword('');

    if (attributes) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        xp: attributes.xp || 0,
        level: attributes.level || 1,
        rank: attributes.rank || 'D',
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      const updateUser = useStore.getState().updateUser;
      try {
        updateUser({
          xp: attributes.xp || 0,
          level: attributes.level || 1,
          rank: attributes.rank || 'D',
        });
      } catch (e) {
        console.warn('Failed to update store:', e);
      }
    }

    setTimeout(() => navigate('/dashboard'), 1000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom right, #0b0d1c, #0a0b16)",
      }}
    >
      {/* Background Light Pillar */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
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
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(82, 39, 255, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(82, 39, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Awakening Modal */}
      <AwakeningAssessmentModal
        isOpen={showAwakening}
        userId={newUserId}
        onComplete={handleAwakeningComplete}
      />

      {/* CARD CONTAINER */}
      <motion.form
        onSubmit={handleSignup}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl border shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(13, 14, 38, 0.6)",
          borderColor: "rgba(138, 43, 226, 0.5)",
          boxShadow: "0 0 40px rgba(82, 39, 255, 0.2), 0 16px 48px rgba(0,0,0,0.85)",
        }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* LOGO + TITLE */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.img
            src="/assets/arise-logo.png"
            alt="Arise Logo"
            className="w-30 h-30 object-contain mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
            SIGN UP
          </h1>
          <p className="text-gray-400 text-sm mt-2">Create your account to begin</p>
        </motion.div>

        {/* USERNAME */}
        <motion.div className="mb-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none"
            style={{ background: "#12141f", border: "1px solid #7c3aed" }}
            onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={(e) => (e.target.style.borderColor = "#7c3aed")}
            required
          />
          {usernameError && (
            <p className="text-red-400 text-sm mt-1">{usernameError}</p>
          )}
        </motion.div>

        {/* PASSWORD */}
        <motion.div className="mb-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none"
            style={{ background: "#12141f", border: "1px solid #7c3aed" }}
            onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
            onBlur={(e) => (e.target.style.borderColor = "#7c3aed")}
            required
          />
          {passwordError && (
            <p className="text-red-400 text-sm mt-1">{passwordError}</p>
          )}
        </motion.div>

        {/* ERROR */}
        {error && (
          <motion.p className="text-red-400 mb-4 text-center text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.p>
        )}

        {/* SUCCESS */}
        {success && (
          <motion.p className="text-green-400 mb-4 text-center text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {success}
          </motion.p>
        )}

        {/* SUBMIT BUTTON */}
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
          SIGN UP
        </motion.button>

        {/* LOGIN LINK */}
        <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <p className="text-white text-sm">
            Already have an account? {" "}
            <Link to="/" className="font-semibold transition-colors duration-300" style={{ color: "#a78bfa" }}>
              Log in
            </Link>
          </p>
        </motion.div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 rounded-tl-2xl pointer-events-none" style={{ borderLeft: "2px solid rgba(82, 39, 255, 0.3)", borderTop: "2px solid rgba(82, 39, 255, 0.3)" }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 rounded-br-2xl pointer-events-none" style={{ borderRight: "2px solid rgba(255, 159, 252, 0.3)", borderBottom: "2px solid rgba(255, 159, 252, 0.3)" }} />
      </motion.form>
    </div>
  );
}
