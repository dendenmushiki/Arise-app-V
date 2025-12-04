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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white p-6 relative overflow-hidden">
      
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

      {/* Awakening Modal */}
      <AwakeningAssessmentModal
        isOpen={showAwakening}
        userId={newUserId}
        onComplete={handleAwakeningComplete}
      />

      {/* CARD CONTAINER */}
      <motion.div
        className="card p-8 w-96 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-lg animate-fade-in relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        
        {/* LOGO + TITLE */}
        <div className="flex flex-col items-center">
          <img
            src="/assets/arise-logo.png"
            alt="Arise Logo"
            className="w-25 h-20 object-contain rounded-md mb-2"
          />

          <motion.h2
            className="text-3xl mb-6 text-center font-heading text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            SIGN UP
          </motion.h2>
        </div>

        {/* FORM WRAPPER */}
        <div
          className="border border-transparent rounded-xl p-6"
          style={{ boxShadow: '0 16px 48px 0 rgba(0,0,0,0.85)' }}
        >

          <form onSubmit={handleSignup} className="space-y-4">

            {/* USERNAME */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 mb-2 rounded-xl bg-[#12141f] border border-violet-700 focus:border-violet-500 text-white placeholder:text-gray-400 transition-all duration-300"
                required
              />
              {usernameError && (
                <p className="text-red-400 text-sm mt-1">{usernameError}</p>
              )}
            </motion.div>

            {/* PASSWORD */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#12141f] border border-violet-700 focus:border-violet-500 text-white placeholder:text-gray-400 transition-all duration-300"
                required
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-1">{passwordError}</p>
              )}
            </motion.div>

            {/* ERROR */}
            {error && (
              <motion.p
                className="text-red-400 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            {/* SUCCESS */}
            {success && (
              <motion.p
                className="text-green-400 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {success}
              </motion.p>
            )}

            {/* SUBMIT BUTTON */}
            <motion.button
              type="submit"
              className="w-full p-3 rounded-xl bg-violet-700 text-white font-bold hover:bg-violet-500 transition-all duration-300 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              SIGN UP
            </motion.button>
          </form>

          {/* LOGIN LINK */}
          <motion.p
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-white">Already have an account? </span>
            <Link
              to="/"
              className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold"
            >
              Log in
            </Link>
          </motion.p>

        </div>
      </motion.div>
    </div>
  );
}
