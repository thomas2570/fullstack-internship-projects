import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Send,
  Users,
  MessageSquare,
  Copy,
  Check,
  X,
  Sparkles
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const WebRTCClassroom = ({ roomId, user, sessionTitle, onLeave }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants' for desktop
  const [mobileDrawer, setMobileDrawer] = useState(null); // null | 'chat' | 'participants' for mobile/tablet
  const [copiedLink, setCopiedLink] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const chatBottomRef = useRef(null);
  const mobileChatBottomRef = useRef(null);

  useEffect(() => {
    // 1. Connect to Socket.IO signaling server
    const socketEndpoint = import.meta.env.VITE_API_BASE_URL || '/';
    const socket = io(socketEndpoint, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // 2. Obtain local media stream (camera & mic)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Join room after getting media stream
        socket.emit('join-room', { roomId, user });
      })
      .catch((err) => {
        console.warn('Could not access media devices, joining room in spectator mode:', err.message);
        socket.emit('join-room', { roomId, user });
      });

    // 4. Socket Listeners
    socket.on('room-state', ({ participants }) => {
      setParticipants(participants || []);
    });

    socket.on('user-joined', async ({ socketId, user: newUser }) => {
      setParticipants((prev) => [...prev.filter((p) => p.socketId !== socketId), newUser]);
      createPeerConnection(socketId, true);
    });

    socket.on('offer', async ({ callerSocketId, offer }) => {
      const pc = createPeerConnection(callerSocketId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer', {
        targetSocketId: callerSocketId,
        answer,
      });
    });

    socket.on('answer', async ({ responderSocketId, answer }) => {
      const pc = peerConnections.current[responderSocketId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = peerConnections.current[senderSocketId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    });

    socket.on('user-left', ({ socketId }) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setUnreadChat((prev) => prev + 1);
    });

    socket.on('hand-status-changed', ({ socketId, raised }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, raisedHand: raised } : p))
      );
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    mobileChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobileDrawer]);

  const createPeerConnection = (targetSocketId, isInitiator) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit('offer', {
            targetSocketId,
            offer,
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      };
    }

    return pc;
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported on this device/browser.');
      return;
    }
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled:', err.message);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const toggleHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (socketRef.current) {
      socketRef.current.emit('raise-hand', {
        roomId,
        raised: nextState,
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      roomId,
      message: inputMessage.trim(),
      user,
    });
    setInputMessage('');
  };

  const copyRoomInvite = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const openMobileChat = () => {
    setUnreadChat(0);
    setMobileDrawer('chat');
  };

  const openMobileParticipants = () => {
    setMobileDrawer('participants');
  };

  const hasRemotePeers = Object.keys(remoteStreams).length > 0;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative">
      {/* Main Video & Controls Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
        {/* Header Bar */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {sessionTitle || 'Live Interactive Classroom'}
              </h2>
              <div className="text-[10px] sm:text-xs text-slate-400 truncate">
                Room: <span className="font-mono text-indigo-400 font-semibold">{roomId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Copy Invite Link */}
            <button
              onClick={copyRoomInvite}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Copy link to invite others"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline text-[11px]">Invite Link</span>
                </>
              )}
            </button>

            {/* Participants Count Pill */}
            <span className="px-2.5 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-[11px] sm:text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{participants.length || 1} Present</span>
            </span>
          </div>
        </div>

        {/* Video Tiles Grid Area */}
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto min-h-0">
          <div className={`grid gap-3 sm:gap-4 h-full ${
            hasRemotePeers ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {/* Local User Tile */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-indigo-500/40 shadow-xl flex items-center justify-center aspect-video max-h-[38vh] sm:max-h-none w-full">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
              />
              {isVideoOff && (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg sm:text-xl font-bold text-indigo-400 shadow-inner">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-medium">Camera is Off</span>
                </div>
              )}

              {/* Overlay Badges */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 z-10">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-white flex items-center gap-1.5 shadow-md border border-slate-800">
                  <span className="truncate max-w-[120px] sm:max-w-none">{user?.name || 'You'} (You)</span>
                  {user?.role === 'instructor' && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-bold uppercase">
                      Instructor
                    </span>
                  )}
                </div>
                {isMuted && (
                  <div className="p-1 rounded-md bg-rose-500 text-white shadow-md">
                    <MicOff className="w-3 h-3" />
                  </div>
                )}
                {handRaised && (
                  <div className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-bold flex items-center gap-1 animate-bounce shadow-md">
                    <Hand className="w-3 h-3" /> Hand Raised
                  </div>
                )}
              </div>
            </div>

            {/* Remote Peers Tiles */}
            {Object.entries(remoteStreams).map(([peerSocketId, stream]) => {
              const peerInfo = participants.find((p) => p.socketId === peerSocketId);
              return (
                <RemoteVideoTile
                  key={peerSocketId}
                  stream={stream}
                  participant={peerInfo}
                />
              );
            })}

            {/* Placeholder when no peers connected */}
            {!hasRemotePeers && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center p-4 sm:p-6 text-center text-slate-500 aspect-video max-h-[38vh] sm:max-h-none">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-slate-600" />
                <div className="text-xs sm:text-sm font-semibold text-slate-300">Waiting for other participants...</div>
                <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mt-1">
                  Share the Room ID or invite link with classmates or instructor to connect via peer-to-peer WebRTC.
                </p>
                <button
                  onClick={copyRoomInvite}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Classroom Invite</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Controls Bar (Fully Responsive on Mobile & Tablet) */}
        <div className="py-2.5 sm:py-3 px-3 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md flex items-center justify-center gap-2 sm:gap-3.5 shrink-0">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`p-2.5 sm:p-3 rounded-full transition-all ${
              isMuted
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-3 rounded-full transition-all ${
              isVideoOff
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-2.5 sm:p-3 rounded-full transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          >
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHand}
            className={`p-2.5 sm:p-3 rounded-full transition-all ${
              handRaised
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Mobile / Tablet Chat Toggle Button */}
          <button
            onClick={openMobileChat}
            className="lg:hidden p-2.5 sm:p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 relative transition-all"
            title="Open Class Chat"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadChat > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadChat}
              </span>
            )}
          </button>

          {/* Mobile / Tablet Participants Toggle Button */}
          <button
            onClick={openMobileParticipants}
            className="lg:hidden p-2.5 sm:p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 relative transition-all"
            title="View Participants"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-[9px] font-bold flex items-center justify-center">
              {participants.length || 1}
            </span>
          </button>

          {/* End Call / Leave */}
          <button
            onClick={onLeave}
            className="p-2.5 sm:p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/50 transition-all hover:scale-105"
            title="Leave Classroom"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Always Visible on lg+ screens) */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-slate-950 border-l border-slate-800">
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Class Chat</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px]">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'participants'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participants ({participants.length || 1})</span>
          </button>
        </div>

        {/* Tab 1: Live Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  Welcome to the live chat! Ask questions, share links, or say hello.
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessageItem key={msg.id || i} msg={msg} />
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message to the class..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Participants Roster */}
        {activeTab === 'participants' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            <ParticipantsList participants={participants} currentSocketId={socketRef.current?.id} />
          </div>
        )}
      </div>

      {/* Mobile & Tablet Drawer Modal Sheet */}
      {mobileDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawer(null)}
          />

          {/* Bottom Sheet */}
          <div className="relative z-10 w-full h-[75vh] sm:h-[65vh] bg-slate-950 rounded-t-3xl border-t border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
            {/* Sheet Handle & Header */}
            <div className="w-12 h-1 rounded-full bg-slate-700 mx-auto mt-2.5 mb-1 shrink-0" />
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setMobileDrawer('chat')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    mobileDrawer === 'chat'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat ({messages.length})</span>
                </button>
                <button
                  onClick={() => setMobileDrawer('participants')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    mobileDrawer === 'participants'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Participants ({participants.length || 1})</span>
                </button>
              </div>

              <button
                onClick={() => setMobileDrawer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Sheet Content */}
            {mobileDrawer === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 text-xs py-8">
                      Welcome to the live chat! Type a message below.
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <ChatMessageItem key={msg.id || i} msg={msg} />
                  ))}
                  <div ref={mobileChatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message to the class..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                <ParticipantsList participants={participants} currentSocketId={socketRef.current?.id} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for Chat Messages
const ChatMessageItem = ({ msg }) => (
  <div className="text-xs">
    <div className="flex items-center gap-2 mb-0.5">
      <span className="font-semibold text-slate-200">{msg.sender}</span>
      <span
        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
          msg.role === 'instructor'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-indigo-500/20 text-indigo-400'
        }`}
      >
        {msg.role}
      </span>
      <span className="text-[10px] text-slate-500 ml-auto">{msg.timestamp}</span>
    </div>
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-300 leading-relaxed break-words">
      {msg.text}
    </div>
  </div>
);

// Component for Participants List
const ParticipantsList = ({ participants, currentSocketId }) => (
  <>
    {participants.map((p) => (
      <div
        key={p.socketId}
        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold">
            {p.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="font-semibold text-slate-200">
              {p.name} {p.socketId === currentSocketId && '(You)'}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              {p.role || 'Student'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {p.raisedHand && (
            <span className="p-1 rounded bg-amber-500/20 text-amber-400" title="Hand is raised">
              <Hand className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    ))}
  </>
);

// Component for Remote Video Tile
const RemoteVideoTile = ({ stream, participant }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl aspect-video max-h-[38vh] sm:max-h-none flex items-center justify-center w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 z-10">
        <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-white flex items-center gap-1.5 shadow-md border border-slate-800">
          <span className="truncate max-w-[120px] sm:max-w-none">{participant?.name || 'Classmate'}</span>
          {participant?.role === 'instructor' && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-bold uppercase">
              Instructor
            </span>
          )}
        </div>
        {participant?.raisedHand && (
          <div className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-bold flex items-center gap-1 animate-bounce shadow-md">
            <Hand className="w-3 h-3" /> Hand Raised
          </div>
        )}
      </div>
    </div>
  );
};
