import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WebRTCClassroom } from '../components/WebRTCClassroom';
import api from '../api/axios';

export const LiveRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Require login / registration to join live classroom
  useEffect(() => {
    if (!token && !user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }

    api.get(`/live/room/${roomId}`)
      .then((res) => setSession(res.data.session))
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, [roomId, user, token, navigate, location.pathname]);

  if (!token && !user) {
    return null;
  }

  const handleLeave = () => {
    navigate('/live');
  };

  return (
    <div>
      <WebRTCClassroom
        roomId={roomId}
        user={user}
        sessionTitle={session?.title}
        onLeave={handleLeave}
      />
    </div>
  );
};
