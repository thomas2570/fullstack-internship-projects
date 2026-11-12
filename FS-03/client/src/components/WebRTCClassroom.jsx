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
  MessageSquare
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
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants'

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const chatBottomRef = useRef(null);

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
        console.warn('Could not access media devices, falling back to audio/dummy:', err.message);
        // Fallback: create empty stream or join without camera
        socket.emit('join-room', { roomId, user });
      });

    // 4. Socket Listeners
    socket.on('room-state', ({ participants }) => {
      setParticipants(participants);
    });

    socket.on('user-joined', async ({ socketId, user: newUser }) => {
      setParticipants((prev) => [...prev.filter((p) => p.socketId !== socketId), newUser]);

      // Initiator creates an RTCPeerConnection and sends offer to the new participant
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
    });

    socket.on('hand-status-changed', ({ socketId, raised }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, raisedHand: raised } : p))
      );
    });

    return () => {
      // Cleanup all tracks and peer connections
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createPeerConnection = (targetSocketId, isInitiator) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    // Attach local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote track arrivals
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // If initiator, create offer
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
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track on all peer connections
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
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
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
      socketRef.current.emit('toggle-hand', { roomId, raised: nextState });
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

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Main Video Grid Area */}
      <div className="flex-1 flex flex-col p-4 bg-slate-900/60 border-r border-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <h2 className="text-base font-bold text-white truncate max-w-md">
                {sessionTitle || 'Live Interactive Classroom'}
              </h2>
              <div className="text-xs text-slate-400">
                Room: <span className="font-mono text-indigo-400">{roomId}</span> | Peer-to-Peer WebRTC Mesh
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{participants.length || 1} Present</span>
            </span>
          </div>
        </div>

        {/* Video Tiles Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {/* Local User Tile */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-indigo-500/40 shadow-xl flex items-center justify-center aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
            />
            {isVideoOff && (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-indigo-400">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs">Camera is Off</span>
              </div>
            )}

            {/* Overlay Badges */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-1.5">
                <span>{user?.name || 'You'} (You)</span>
                {user?.role === 'instructor' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Instructor</span>
                )}
              </div>
              {isMuted && (
                <div className="p-1 rounded-md bg-rose-500/80 text-white">
                  <MicOff className="w-3 h-3" />
                </div>
              )}
              {handRaised && (
                <div className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-xs font-bold flex items-center gap-1 animate-bounce">
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
          {Object.keys(remoteStreams).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-500 aspect-video">
              <Users className="w-12 h-12 mb-3 text-slate-600" />
              <div className="text-sm font-semibold text-slate-400">Waiting for other participants...</div>
              <div className="text-xs text-slate-600 max-w-xs mt-1">
                Share the Room ID or invite classmates to join this live WebRTC session.
              </div>
            </div>
          )}
        </div>

        {/* Floating Controls Bar (Responsive on mobile & tablet) */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-2 sm:gap-3.5">
          <button
            onClick={toggleMic}
            className={`p-2.5 sm:p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-3.5 rounded-full transition-all ${
              isVideoOff
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2.5 sm:p-3.5 rounded-full transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          >
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={toggleHand}
            className={`p-2.5 sm:p-3.5 rounded-full transition-all ${
              handRaised
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={onLeave}
            className="p-2.5 sm:p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/50"
            title="Leave Classroom"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar (Chat & Participants) */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-950">
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
            <span>Participants ({participants.length})</span>
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
              {messages.map((msg) => (
                <div key={msg.id} className="text-xs">
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
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
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
                      {p.name} {p.socketId === socketRef.current?.id && '(You)'}
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
          </div>
        )}
      </div>
    </div>
  );
};

// Component for rendering remote peer video tile
const RemoteVideoTile = ({ stream, participant }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl aspect-video flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
        <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-1.5">
          <span>{participant?.name || 'Classmate'}</span>
          {participant?.role === 'instructor' && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Instructor</span>
          )}
        </div>
        {participant?.raisedHand && (
          <div className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 animate-bounce">
            <Hand className="w-3 h-3" /> Hand Raised
          </div>
        )}
      </div>
    </div>
  );
};

