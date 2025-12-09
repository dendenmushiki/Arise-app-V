import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";
import api from "../api";
import { useStore } from "../store";
import { Link } from "react-router-dom";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001");

export default function Chat() {
  const user = useStore((s) => s.user);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const messagesEnd = useRef(null);

  /* ----------------------- FETCH INITIAL MESSAGES ----------------------- */
  useEffect(() => {
    (async () => {
      const res = await api.get("/messages");
      setMessages(res.data.messages || []);
    })();

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.senderId) setOnlineUsers((prev) => new Set(prev).add(msg.senderId));
    });

    // Update server pag nagbago profile pecture
    socket.on("user_updated", (payload) => {
      try {
        if (!payload || !payload.id) return;
        setUsers((prev) => {
          const exists = prev.find((u) => u.id === payload.id);
          if (exists) {
            return prev.map((u) => (u.id === payload.id ? { ...u, avatar: payload.avatar } : u));
          }
          return prev;
        });
      } catch (e) {
      }
    });

    socket.on("online_users", (ids) => setOnlineUsers(new Set(ids || [])));
    socket.on("user_online", (id) => setOnlineUsers((prev) => new Set(prev).add(id)));
    socket.on("user_offline", (id) =>
      setOnlineUsers((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      })
    );

    socket.emit("get_online_users");

    return () => {
      socket.off("new_message");
      socket.off("user_updated");
      socket.off("online_users");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, []);

  /* ----------------------- FETCH USER LIST ----------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data.users || []);
      } catch {}
    })();
  }, []);

  /* ----------------------- SCROLL TO BOTTOM ----------------------- */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ----------------------- USERS MAP ----------------------- */
  const usersMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  function getAvatarForId(id) {
    const u = usersMap.get(id);
    return (u && u.avatar) || "/assets/avatars/default-avatar.svg";
  }

  function handleAvatarError(e) {
    const img = e.target;
    try {
      const src = img.src || "";
      if (!img.dataset.triedSvg && /\.png($|\?)/i.test(src)) {
        img.dataset.triedSvg = "true";
        img.src = src.replace(/\.png($|\?)/i, ".svg$1");
        return;
      }
    } catch (err) {
    }
    img.src = "/assets/avatars/default-avatar.svg";
  }

  /* ----------------------- SEND MESSAGE ----------------------- */
  function sendMessage() {
    if (!text.trim()) return;
    socket.emit("send_message", {
      senderId: user?.id,
      senderName: user?.username,
      content: text,
    });
    setText("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6 animate-fade-in">
      <div className="max-w-[1200px] mx-auto">

        {/* Header - centered above panels */}
        <motion.header
          className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 className="quest-title text-3xl md:text-4xl" whileHover={{ scale: 1.05 }}>
            CHATROOM
          </motion.h1>

          <nav className="flex space-x-6">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/home"
                className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold"
              >
                DASHBOARD
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/workouts"
                className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold"
              >
                WORKOUTS
              </Link>
            </motion.div>
          </nav>
        </motion.header>

        {/* Center panels below header (responsive: stacked on small screens, side-by-side on md+) */}
        <div className="flex justify-center">
          <div className="flex flex-col md:flex-row gap-6 items-start w-full md:ml-[4vw]">

            {/* ----------------------- LEFT COLUMN: CHAT (responsive) ----------------------- */}
            <div className="w-full md:w-[820px] flex-shrink-0 flex flex-col">

          {/* Chat Box */}
          <motion.div className="card h-[110vh] md:h-[72vh] flex flex-col rounded-lg border border-neon-cyan shadow-lg bg-card-bg animate-slide-up w-full">

            {/* Chat Info */}
            <div className="p-4 border-b border-neon-cyan/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-muted">Public Chat</div>
                  <div className="text-xs text-gray-400">Be kind — this is a community space</div>
                </div>
              </div>
            </div>

            {/* Messages Panel: fixed height, scrollable */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 chat-scroll">
              {messages.map((msg, index) => {
                  const isOwn = msg.senderId && user && msg.senderId === user.id;
                  const avatarSrc = getAvatarForId(msg.senderId);
                  const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : "";

                  return (
                    <motion.div
                      key={msg.id || index}
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          <img
                            src={avatarSrc}
                            alt="avatar"
                            onError={handleAvatarError}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-neon-cyan font-semibold text-sm">{msg.senderName || "anon"}</span>
                          <span className="text-xs text-gray-400">{timeStr}</span>
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] md:max-w-[75%] px-4 py-2 rounded-2xl break-words text-sm ${
                          isOwn
                            ? "bg-[#0f1724] border border-neon-cyan/10 shadow-[0_6px_20px_rgba(0,0,0,0.6)] text-white"
                            : "bg-[#0b1220] border border-neon-cyan/20 shadow-md text-white"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {isOwn && (
                        <div className="flex items-center justify-end space-x-2 mt-1">
                          <span className="text-xs text-gray-400">{timeStr}</span>
                          <img
                            src={avatarSrc}
                            alt="avatar"
                            onError={handleAvatarError}
                            className="w-7 h-7 rounded-full"
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neon-cyan/10">
              <div className="flex flex-inline sm:flex-row gap-4">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Say something..."
                  className="flex-1 p-3 rounded-xl bg-[#12141f] border border-neon-cyan focus:border-glow-cyan focus:ring-1 focus:ring-glow-cyan transition-all duration-300 text-white placeholder:text-gray-400"
                />
                <button
                  onClick={sendMessage}
                  className="w-auto sm:w-auto px-6 sm:px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-glow-cyan transition-all duration-300 animate-glow"
                >
                  SEND
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ----------------------- RIGHT COLUMN: USERS (aligned top, responsive) ----------------------- */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="card p-4 rounded-lg border border-neon-cyan shadow-lg bg-card-bg h-[34vh] md:h-[72vh] flex flex-col w-full">
            {/* Header */}
            <div className="mb-4">
              <div className="text-lg font-heading">Users</div>
              <div className="text-xs text-gray-400">Online presence shown live</div>
            </div>

            {/* Users Panel: scrollable */}
            <div className="flex-1 overflow-y-auto bg-[#0a0c18] border border-neon-cyan/30 rounded-lg p-3 space-y-2">
              {users.length > 0
                ? users.map((u) => {
                    const isOnline = onlineUsers.has(u.id);
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.username || "avatar"}
                            onError={handleAvatarError}
                            className={`w-9 h-9 rounded-full flex-shrink-0 ${isOnline ? "ring-2 ring-neon-cyan" : "bg-gray-700"}`}
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                              isOnline ? "bg-neon-cyan text-[#021019]" : "bg-gray-700 text-white"
                            }`}
                          >
                            {u.username ? u.username.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{u.username || "User"}</div>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: isOnline ? "#34D399" : "#374151" }}
                        />
                      </div>
                    );
                  })
                : "No users found"}
            </div>
          </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
