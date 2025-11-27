import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from "./pages/Dashboard.jsx";
import Workouts from "./pages/Workout";
import Chat from "./pages/Chat";
import Quest from "./pages/Quest.jsx";
import Challenges from "./pages/Challenges.jsx";
import { useStore } from "./store";
import { setAuthToken } from "./api";

function Protected({ children }) {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/" replace />;
  setAuthToken(token);
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Protected><Dashboard /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/workouts" element={<Protected><Workouts /></Protected>} />
        <Route path="/quest" element={<Protected><Quest /></Protected>} />
        <Route path="/chat" element={<Protected><Chat /></Protected>} />
        <Route path="/challenges" element={<Protected><Challenges /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}