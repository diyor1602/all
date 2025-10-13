import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause } from "lucide-react";

// keep global reference
let currentlyPlaying = null;

const VoiceMessagePlayer = ({ message, isMine }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: isMine ? "#93c5fd" : "#d1d5db",
      progressColor: isMine ? "#2563eb" : "#4b5563",
      cursorColor: "#000",
      height: 40,
      barWidth: 2,
      barRadius: 2,
      responsive: true,
      normalize: true,
    });

    wavesurfer.load(message.file_path);

    wavesurfer.on("ready", () => {
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on("audioprocess", () => {
      if (wavesurfer.isPlaying()) {
        setCurrentTime(wavesurfer.getCurrentTime());
      }
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (currentlyPlaying === wavesurfer) {
        currentlyPlaying = null;
      }
    });

    wavesurferRef.current = wavesurfer;

    // listen for global pause events
    const handlePauseOthers = (e) => {
      if (e.detail !== wavesurferRef.current) {
        wavesurferRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener("pauseAllVoices", handlePauseOthers);

    return () => {
      wavesurfer.destroy();
      window.removeEventListener("pauseAllVoices", handlePauseOthers);
    };
  }, [message.file_path]);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;

    if (!isPlaying) {
      // tell others to pause themselves
      window.dispatchEvent(
        new CustomEvent("pauseAllVoices", { detail: wavesurferRef.current })
      );
      currentlyPlaying = wavesurferRef.current;
    }

    wavesurferRef.current.playPause();
  };

  const formatSeconds = (s) => {
    if (!s) return "0:00";
    const minutes = Math.floor(s / 60);
    const seconds = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-2xl max-w-sm ${
        isMine
          ? "bg-blue-500 text-white rounded-br-none"
          : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
      }`}
    >
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div ref={waveformRef} className="w-full min-w-[100px]" />
        <div className="flex justify-end text-xs">
          <span>
            {isPlaying ? formatSeconds(currentTime) : formatSeconds(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
