"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Scissors, Download, FileVideo, Film, CheckCircle2 } from "lucide-react";

export default function ClipTrimmerUI() {
  const [clips, setClips] = useState<string[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success" | "error">("idle");
  const [exportMessage, setExportMessage] = useState<string>("");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("9:16");
  const [filePrefix, setFilePrefix] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/clips")
      .then((res) => res.json())
      .then((data) => {
        if (data.clips) {
          setClips(data.clips);
        }
      })
      .catch((err) => console.error("Error fetching clips:", err));
  }, []);

  const handleClipSelect = (clip: string) => {
    setSelectedClip(clip);
    setStartTime(0);
    setEndTime(0);
    setDuration(0);
    setIsPlaying(false);
    setExportStatus("idle");
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setEndTime(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed >= 4 ? 1 : playbackSpeed + 1;
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        videoRef.current.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        if (videoRef.current.currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        } else if (videoRef.current.currentTime < startTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const handleExport = async () => {
    if (!selectedClip) return;
    setExportStatus("exporting");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip: selectedClip,
          start: startTime,
          end: endTime,
          aspectRatio: aspectRatio,
          filePrefix: filePrefix,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setExportStatus("success");
        setExportMessage(`Saved: ${data.file}`);
      } else {
        setExportStatus("error");
        setExportMessage(data.error || "Export failed");
      }
    } catch (err) {
      setExportStatus("error");
      setExportMessage("Network error during export");
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar - Clip Explorer */}
      <div className="w-80 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl flex flex-col z-10">
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <Film className="w-6 h-6 text-indigo-400" />
            Clip Library
          </h1>
          <p className="text-neutral-400 text-sm mt-2 font-medium">Select a video to edit</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {clips.length === 0 ? (
            <div className="text-center text-neutral-500 py-10">No clips found in public directory.</div>
          ) : (
            clips.map((clip, index) => {
              const isSelected = selectedClip === clip;
              const clipName = clip.split('/').pop() || clip;
              return (
                <button
                  key={index}
                  onClick={() => handleClipSelect(clip)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ease-out flex items-center gap-3 ${
                    isSelected
                      ? "bg-indigo-500/10 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)] text-indigo-300"
                      : "bg-neutral-800/30 border border-transparent hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300"
                  }`}
                >
                  <FileVideo className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-indigo-400" : "text-neutral-500"}`} />
                  <span className="truncate text-sm font-medium">{clipName}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area (Video Player) */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-br from-neutral-950 to-neutral-900 h-full overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        {selectedClip ? (
          <div className="flex-1 flex items-center justify-center p-8 z-10 relative h-full">
            <div className={`relative overflow-hidden shadow-2xl shadow-black/50 border border-neutral-800 bg-black group h-full ${
              aspectRatio === "16:9" ? "w-full max-w-5xl aspect-video" : "aspect-[9/16]"
            } rounded-2xl`}>
              <video
                ref={videoRef}
                src={selectedClip}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlayPause}
                controls={false}
              />
              
              {/* Play/Pause Overlay Component */}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 pointer-events-none ${
                  isPlaying ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-lg">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>

              {/* Overlay Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCurrentTime(val);
                    if (videoRef.current) {
                      videoRef.current.currentTime = val;
                    }
                  }}
                  className="w-full accent-indigo-500 h-1.5 bg-white/30 hover:h-2 transition-all rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 z-10">
            <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 mb-6 shadow-2xl">
              <Film className="w-10 h-10 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-300">No Video Selected</h2>
            <p className="mt-2 text-neutral-500 text-sm max-w-sm text-center">
              Choose a video from your clip library on the left to start editing and trimming.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Trimming Controls */}
      {selectedClip && (
        <div className="w-[450px] border-l border-neutral-800 bg-neutral-900/50 backdrop-blur-xl flex flex-col z-10 flex-shrink-0">
          <div className="p-6 border-b border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-indigo-400" />
              Edit Clip
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Top Bar Controls (Play, Speed, Aspect, Time) */}
            <div className="flex flex-col gap-4 bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-full text-white shadow-lg shadow-indigo-600/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={toggleSpeed}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm font-bold text-neutral-300 rounded-lg border border-neutral-700 transition-colors"
                    title="Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>
                  <button 
                    onClick={() => setAspectRatio(aspectRatio === "16:9" ? "9:16" : "16:9")}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm font-bold text-neutral-300 rounded-lg border border-neutral-700 transition-colors"
                    title="Toggle Aspect Ratio"
                  >
                    {aspectRatio}
                  </button>
                </div>
              </div>
              <div className="text-xl font-mono tracking-wider font-light text-center bg-black/40 py-2 rounded-lg border border-black/50">
                {formatTime(currentTime)} <span className="text-neutral-500">/ {formatTime(duration)}</span>
              </div>
            </div>

            {/* Set Start/End Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (videoRef.current) setStartTime(videoRef.current.currentTime);
                }}
                className="py-3 bg-neutral-800/80 hover:bg-neutral-700 transition-colors border border-neutral-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 text-emerald-400" />
                Set Start
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) setEndTime(videoRef.current.currentTime);
                }}
                className="py-3 bg-neutral-800/80 hover:bg-neutral-700 transition-colors border border-neutral-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 text-rose-400" />
                Set End
              </button>
            </div>

            {/* Main Progress Bar Scrubber */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Playhead Position</label>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.01"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-indigo-500 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="h-px bg-neutral-800 w-full" />

            {/* Sliders Area */}
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val < endTime) setStartTime(val);
                  }}
                  className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
                <label className="text-sm font-medium text-emerald-400">Start: {formatTime(startTime)}</label>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > startTime) setEndTime(val);
                  }}
                  className="w-full accent-rose-500 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
                <label className="text-sm font-medium text-rose-400">End: {formatTime(endTime)}</label>
              </div>
            </div>

            <div className="h-px bg-neutral-800 w-full" />

            {/* Action Area */}
            <div className="space-y-4">
              <div className="text-sm text-neutral-400 text-center">
                Trimmed Duration: <span className="text-white font-mono">{formatTime(endTime - startTime)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">File Prefix (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. IG_Reel, TikTok"
                  value={filePrefix}
                  onChange={(e) => setFilePrefix(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              
              <button
                onClick={handleExport}
                disabled={exportStatus === "exporting"}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl text-base font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {exportStatus === "exporting" ? "Exporting..." : "Export Trim"}
              </button>

              {exportStatus === "success" && (
                <div className="text-emerald-400 text-sm flex items-center justify-center gap-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-4 h-4" />
                  {exportMessage}
                </div>
              )}
              {exportStatus === "error" && (
                <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                  {exportMessage}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
