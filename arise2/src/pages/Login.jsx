import React, { useState } from "react";
import { motion } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white p-6">
      <motion.form
        onSubmit={submit}
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
              LOGIN
            </motion.h2>
          </div>
        <div className="border border-transparent rounded-xl p-6" style={{ boxShadow: '0 16px 48px 0 rgba(0,0,0,0.85)' }}>
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-3 mb-2 rounded-xl bg-[#12141f] border border-violet-700 focus:border-violet-500 text-white placeholder:text-gray-400 transition-all duration-300"
              required
            />
          </motion.div>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 rounded-xl bg-[#12141f] border border-violet-700 focus:border-violet-500 text-white placeholder:text-gray-400 transition-all duration-300"
              required
            />
          </motion.div>

          {error && (
            <motion.p
              className="text-red-400 mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
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
            LOGIN
          </motion.button>
</div>
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-white">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold"
              >
                Register here
              </Link>
            </p>
          </motion.div>
      </motion.form>
    </div>
  );
}
