import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Cloud,
  CheckCircle2
} from 'lucide-react';

export const VideoPlayer = ({
  src,
  poster,
  title,
  onEnded,
  onProgressUpdate,
  isCompleted,
  onMarkComplete,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is Auto
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const isHls = src.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          name: `${level.height}p`,
          bitrate: level.bitrate,
        }));
        setQualities(levels);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari / iOS)
      video.src = src;
    } else {
      // Direct MP4 / WebM video (e.g. Big Buck Bunny, Sintel, Pexels open movies)
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = src;
      setQualities([
        { index: 0, height: 1080, name: '1080p HD' },
        { index: 1, height: 720, name: '720p' }
      ]);
      setCurrentQuality(0);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);

    if (onProgressUpdate) {
      onProgressUpdate({ currentTime: curr, duration: dur });
    }

    // Auto mark complete when watching 95%+
    if (dur > 0 && curr / dur >= 0.95 && !isCompleted && onMarkComplete) {
      onMarkComplete();
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const skipSeconds = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
  };

  const changePlaybackRate = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const changeQuality = (index) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
    setCurrentQuality(index);
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none shadow-2xl border border-slate-800"
    >
      <video
        ref={videoRef}
        poster={poster}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Quality & Stream Info Tag */}
      <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-none">
        <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] sm:text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 shadow-lg">
          <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
          <span>{src?.includes('.m3u8') ? 'Adaptive HD' : 'HD Video'}</span>
          <span className="text-slate-500">|</span>
          <span className="text-indigo-400">
            {currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height || 720}p`}
          </span>
        </div>

        {isCompleted && (
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-700/60 text-[10px] sm:text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* Center Big Play Button when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center hover:scale-110 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/50 backdrop-blur-sm z-20"
        >
          <Play className="w-8 h-8 ml-1" />
        </button>
      )}

      {/* Video Overlay Controls */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 transition-opacity duration-300 z-30 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Timeline Slider */}
        <div className="relative mb-3 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1 sm:p-1.5 text-slate-200 hover:text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Skip 10s Backward */}
            <button
              onClick={() => skipSeconds(-10)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-white transition-colors hidden xs:block"
              title="Rewind 10s"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Skip 10s Forward */}
            <button
              onClick={() => skipSeconds(10)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-white transition-colors hidden xs:block"
              title="Fast forward 10s"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1 group/volume">
              <button
                onClick={toggleMute}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hidden group-hover/volume:block transition-all"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[10px] sm:text-xs font-mono text-slate-300 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Settings Menu (Quality & Speed) */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Playback Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {showSettings && (
                <div className="absolute right-0 bottom-10 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-40 text-xs">
                  <div className="font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                    Quality
                  </div>
                  <button
                    onClick={() => changeQuality(-1)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-indigo-600/20 ${
                      currentQuality === -1 ? 'text-indigo-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    Auto (Adaptive)
                  </button>
                  {qualities.map((q) => (
                    <button
                      key={q.index}
                      onClick={() => changeQuality(q.index)}
                      className={`w-full text-left px-2 py-1.5 rounded hover:bg-indigo-600/20 ${
                        currentQuality === q.index ? 'text-indigo-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {q.name}
                    </button>
                  ))}

                  <div className="font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mt-2 border-b border-slate-800">
                    Speed
                  </div>
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full text-left px-2 py-1.5 rounded hover:bg-indigo-600/20 ${
                        playbackRate === rate ? 'text-indigo-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {rate}x {rate === 1 && '(Normal)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

