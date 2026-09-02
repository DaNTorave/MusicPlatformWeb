import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(() => {
    try {
      const saved = localStorage.getItem('player_track');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('player_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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
    const audio = audioRef.current;
    audio.volume = volume;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    setIsPlaying(false);

    if (currentTrack?.id) {
      const targetSrc = currentTrack.streamUrl || `/api/stream/${currentTrack.id}`;
      currentSrcRef.current = targetSrc;
      audio.src = targetSrc;
    }

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem('player_volume', volume.toString());
  }, [volume]);

  const nextTrack = () => {
    const currentQ = queueRef.current;
    const currentT = currentTrackRef.current;
    if (!currentQ || currentQ.length === 0 || !currentT) return;

    const currentIndex = currentQ.findIndex(t => String(t.id) === String(currentT.id));
    if (currentIndex !== -1 && currentIndex + 1 < currentQ.length) {
      const nextT = currentQ[currentIndex + 1];
      playTrack(nextT, currentQ);
    }
  };

  const prevTrack = () => {
    const currentQ = queueRef.current;
    const currentT = currentTrackRef.current;
    if (!currentQ || currentQ.length === 0 || !currentT) return;

    const currentIndex = currentQ.findIndex(t => String(t.id) === String(currentT.id));
    if (currentIndex > 0) {
      const prevT = currentQ[currentIndex - 1];
      playTrack(prevT, currentQ);
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

  const playTrack = (track, newQueue = null) => {
    if (!track || !track.id) return;
    const audio = audioRef.current;

    if (newQueue && Array.isArray(newQueue)) {
      setQueue(newQueue);
      queueRef.current = newQueue;
      try {
        localStorage.setItem('player_queue', JSON.stringify(newQueue));
      } catch (e) {
        console.warn('Queue storage error:', e);
      }
    }

    const targetSrc = track.streamUrl || `/api/stream/${track.id}`;
    const isSameTrack = currentTrack && String(currentTrack.id) === String(track.id);

    if (isSameTrack && !track.streamUrl) {
      if (!audio.src || currentSrcRef.current !== targetSrc) {
        audio.src = targetSrc;
        currentSrcRef.current = targetSrc;
      }

      if (!audio.paused && isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(err => {
          console.warn('Play was prevented:', err);
          setIsPlaying(false);
        });
      }
      return;
    }

    setCurrentTrack(track);
    currentTrackRef.current = track;

    if (!track.streamUrl) {
      try {
        localStorage.setItem('player_track', JSON.stringify(track));
      } catch (e) {
        console.warn('Track storage error:', e);
      }
    }

    currentSrcRef.current = targetSrc;
    audio.src = targetSrc;
    audio.currentTime = 0;

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.warn('Playback error:', err);
      setIsPlaying(false);
    });
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
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
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