import { useEffect, useRef, useState } from "react";
import "./BackgroundMusic.css";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsPlayback = useRef(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;
    const tryPlaying = () => {
      if (wantsPlayback.current && audio.paused) {
        void audio.play().catch(() => {
          // Browsers may require a user interaction before allowing audio.
        });
      }
    };
    const onInteraction = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".background-music-button")) return;
      tryPlaying();
    };
    const stopListening = () => {
      document.removeEventListener("pointerdown", onInteraction);
      document.removeEventListener("keydown", onInteraction);
    };

    document.addEventListener("pointerdown", onInteraction);
    document.addEventListener("keydown", onInteraction);
    audio.addEventListener("play", stopListening);
    tryPlaying();

    return () => {
      stopListening();
      audio.removeEventListener("play", stopListening);
      audio.pause();
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    wantsPlayback.current = audio.paused;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  const label = isPlaying ? "توقف موسیقی" : "پخش موسیقی";

  return (
    <>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}bg_music.mp3`}
        autoPlay
        loop
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      <button
        type="button"
        className="background-music-button"
        onClick={togglePlayback}
        aria-label={label}
        title={label}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          {isPlaying ? (
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>
    </>
  );
}
