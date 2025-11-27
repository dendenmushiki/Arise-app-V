import React, { useEffect } from 'react'
import QuestNotif from '../components/QuestNotif.jsx'
import { useStore } from '../store.js'

const Home = () => {
  const user = useStore((s) => s.user);

  useEffect(() => {
    console.debug('Home mounted, user:', user);
  }, [user]);

  return (
    <div className="min-h-screen">
      <QuestNotif />
      <div className="p-6">Dashboard</div>
    </div>
  )
}

export default Home;
