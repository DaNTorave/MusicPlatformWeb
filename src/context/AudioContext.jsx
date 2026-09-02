import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(() => {
    const saved = localStorage.getItem('player_track');
    return saved ? JSON.parse(saved) : null;
  });
  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('player_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem('player_volume') || '0.8');
  });

  const audioRef = useRef(new Audio());
  const currentSrcRef = useRef('');

  const queueRef = useRef(queue);
  queueRef.current = queue;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;

  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem('player_volume', volume.toString());
  }, [volume]);

  const nextTrack = () => {
    const currentQ = queueRef.current;
    const currentT = currentTrackRef.current;
    if (!currentQ || currentQ.length === 0 || !currentT) return;

    const currentIndex = currentQ.findIndex(t => t.id === currentT.id);
    if (currentIndex !== -1 && currentIndex + 1 < currentQ.length) {
      const nextT = currentQ[currentIndex + 1];
      setCurrentTrack(nextT);
      setIsPlaying(true);
    }
  };

  const prevTrack = () => {
    const currentQ = queueRef.current;
    const currentT = currentTrackRef.current;
    if (!currentQ || currentQ.length === 0 || !currentT) return;

    const currentIndex = currentQ.findIndex(t => t.id === currentT.id);
    if (currentIndex > 0) {
      const prevT = currentQ[currentIndex - 1];
      setCurrentTrack(prevT);
      setIsPlaying(true);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      nextTrack();
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (currentTrack) {
      const targetSrc = currentTrack.streamUrl || `/api/stream/${currentTrack.id}`;

      if (currentSrcRef.current !== targetSrc) {
        currentSrcRef.current = targetSrc;
        audioRef.current.src = targetSrc;

        if (!currentTrack.streamUrl) {
          localStorage.setItem('player_track', JSON.stringify(currentTrack));
        }

        if (isPlaying) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }
    } else {
      audioRef.current.pause();
      audioRef.current.src = '';
      currentSrcRef.current = '';
      setIsPlaying(false);
      localStorage.removeItem('player_track');
    }
  }, [currentTrack, isPlaying]);

const playTrack = (track, newQueue = null) => {
    if (!track) return;

    if (currentTrack?.id === track.id && !track.streamUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
      return;
    }

    if (newQueue && Array.isArray(newQueue)) {
      setQueue(newQueue);
      queueRef.current = newQueue;
      localStorage.setItem('player_queue', JSON.stringify(newQueue));
    }

    setCurrentTrack(track);
    currentTrackRef.current = track;
    setIsPlaying(true);
  };

  const updateTrackTitle = (newTitle) => {
    setCurrentTrack(prev => {
      if (!prev) return prev;
      const updated = { ...prev, title: newTitle };
      if (!prev.streamUrl) {
        localStorage.setItem('player_track', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateTrackCover = (newCover) => {
    setCurrentTrack(prev => {
      if (!prev) return prev;
      const updated = { ...prev, cover: newCover };
      if (!prev.streamUrl) {
        localStorage.setItem('player_track', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const stopPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    currentSrcRef.current = '';
    setIsPlaying(false);
    setCurrentTrack(null);
    setQueue([]);
    localStorage.removeItem('player_track');
    localStorage.removeItem('player_queue');
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      queue,
      isPlaying,
      volume,
      setVolume,
      playTrack,
      nextTrack,
      prevTrack,
      updateTrackTitle,
      updateTrackCover,
      stopPlayer,
      audioRef
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioPlayer = () => useContext(AudioContext);