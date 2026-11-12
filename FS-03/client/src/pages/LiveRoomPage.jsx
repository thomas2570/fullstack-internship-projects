import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WebRTCClassroom } from '../components/WebRTCClassroom';
import api from '../api/axios';

export const LiveRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/live/room/${roomId}`)
      .then((res) => setSession(res.data.session))
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, [roomId]);

  const handleLeave = () => {
    navigate('/live');
  };

  const currentUser = user || {
    _id: `guest_${Math.random().toString(36).substring(2, 7)}`,
    name: 'Guest Learner',
    role: 'student',
  };

  return (
    <div>
      <WebRTCClassroom
        roomId={roomId}
        user={currentUser}
        sessionTitle={session?.title}
        onLeave={handleLeave}
      />
    </div>
  );
};

