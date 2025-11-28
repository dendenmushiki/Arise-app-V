import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      setSuccess('Registration successful! Redirecting...');
      localStorage.setItem('user', JSON.stringify(res.data));
      setUsername('');
      setPassword('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white p-6">
      <motion.div
        className="card p-8 w-96 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-lg animate-fade-in"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          <img
            src="/assets/arise-logo.png"
            alt="Arise Logo"
            className="w-20 h-20 object-contain rounded-md mb-4"
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

        <form onSubmit={handleSignup} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm mb-2 font-semibold text-white">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 mb-2 rounded-lg bg-[#12141f] border border-violet-700 focus:border-violet-500 text-white placeholder:text-gray-400 transition-all duration-300"
              required
            />
            {usernameError && <p className="text-red-400 text-sm mt-1">{usernameError}</p>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm mb-2 font-semibold text-white">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#12141f] border border-violet-700 focus:border-violet-500 text-white placeholder:text-gray-400 transition-all duration-300"
              required
            />
            {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
          </motion.div>

          {error && (
            <motion.p
              className="text-red-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              className="text-green-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {success}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="w-full p-3 rounded-xl bg-violet-700 text-white font-bold hover:bg-violet-500 hover:text-white transition-all duration-300 shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            SIGN UP
          </motion.button>
        </form>

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
      </motion.div>
    </div>
  );
}
