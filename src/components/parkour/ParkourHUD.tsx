'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Compass,
  ExternalLink,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { useParkourStore } from '@/lib/parkourStore';
import { COURSE_CHECKPOINTS } from '@/lib/parkourCourse';

export function ParkourHUD() {
  const {
    currentStage,
    stageName,
    stageSubtitle,
    timer,
    deaths,
    dashCooldown,
    canDoubleJump,
    platformMode,
    isMuted,
    activeNotification,
    showVictoryModal,
    finishTime,
    setPlatformMode,
    toggleMute,
    restartGame,
    setJoystickVector,
    setJumpHeld,
    setDashHeld,
    teleportToStage,
    triggerRespawn,
    clearNotification,
    gameMode,
    roomCode,
    playerCount,
    playerRank,
    standings,
    playerName,
  } = useParkourStore();

  const [showStageSelector, setShowStageSelector] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyRoomCode = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}?room=${roomCode}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Auto clear notifications after 3.5s
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeNotification, clearNotification]);

  // Trigger Confetti on Victory
  useEffect(() => {
    if (showVictoryModal) {
      const end = Date.now() + 3.5 * 1000;
      const colors = ['#00ffff', '#ff007f', '#ffd700', '#00ff88', '#818cf8'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [showVictoryModal]);

  // Format Timer mm:ss.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Virtual Joystick Handling for Mobile
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null || !joystickBaseRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickPos({ x: 0, y: 0 });
        setJoystickVector({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let normX = dx / maxRadius;
    let normY = dy / maxRadius;

    if (dist > maxRadius) {
      normX = (dx / dist);
      normY = (dy / dist);
    }

    setJoystickPos({ x: normX * (maxRadius * 0.7), y: normY * (maxRadius * 0.7) });
    // Invert Y for 3D world forward
    setJoystickVector({ x: normX, y: -normY });
  };

  // Rank calculation for 15-minute course
  const calculateRank = (timeInSec: number) => {
    if (timeInSec <= 600) return { rank: 'S-RANK', title: 'CYBER SPEEDRUN GOD', color: 'text-amber-400 border-amber-500/50 bg-amber-500/10' };
    if (timeInSec <= 900) return { rank: 'A-RANK', title: 'SUMMIT CHAMPION (< 15 MIN)', color: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10' };
    if (timeInSec <= 1200) return { rank: 'B-RANK', title: 'NEON PARKOUR RUNNER', color: 'text-purple-400 border-purple-500/50 bg-purple-500/10' };
    return { rank: 'SURVIVOR', title: 'PARKOUR CONQUEROR', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' };
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3 md:p-6 font-mono">
      {/* ==================================================== */}
      {/* TOP BAR: TIMER, STAGE, CHECKPOINT & CROSSPLAY SWITCH */}
      {/* ==================================================== */}
      <div className="flex flex-wrap items-start justify-between gap-3 pointer-events-auto">
        {/* Stage & Level Title + Multiplayer Room Badge */}
        <div className="flex flex-col gap-2 max-w-sm">
          {/* Multiplayer Room Code Badge */}
          {gameMode === 'multiplayer' && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-fuchsia-500/50 rounded-xl px-3 py-1.5 shadow-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="text-xs font-black text-white tracking-wider">ROOM: {roomCode}</span>
                <span className="text-[10px] text-fuchsia-300 font-bold">({playerCount} PLAYERS)</span>
              </div>
              <button
                onClick={handleCopyRoomCode}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-fuchsia-950/60 hover:bg-fuchsia-900 border border-fuchsia-400/40 text-[10px] text-fuchsia-300 font-bold transition-all active:scale-95"
                title="Copy Room Link to Clipboard"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>SHARE</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Stage & Level Info */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-lg shadow-cyan-950/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-cyan-500 text-slate-950">
                STAGE {currentStage}/10
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest">
                PAR TIME: 15:00
              </span>
            </div>
            <h1 className="text-base md:text-lg font-black tracking-wider text-white flex items-center gap-2">
              <span className="text-cyan-400">✦</span> {stageName}
            </h1>
            <p className="text-xs text-slate-400 line-clamp-1">{stageSubtitle}</p>

            {/* Quick Stage Selector Toggle */}
            <button
              onClick={() => setShowStageSelector(!showStageSelector)}
              className="mt-2 text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors uppercase font-bold"
            >
              <Compass className="w-3 h-3" />
              {showStageSelector ? 'Close Stage Map' : 'Select Stage Checkpoint'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Speedrun Timer Stopwatch (Center) */}
        <div className="flex flex-col items-center bg-slate-950/90 backdrop-blur-md border border-cyan-400/50 rounded-2xl px-5 py-2.5 shadow-xl shadow-cyan-500/20">
          <span className="text-[10px] tracking-widest text-cyan-400 uppercase font-bold flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
            {gameMode === 'multiplayer' ? 'MULTIPLAYER RACE (PAR 15:00)' : 'SPEEDRUN TIMER (PAR 15:00)'}
          </span>
          <div className={`text-2xl md:text-3xl font-black tracking-tight ${timer > 900 ? 'text-amber-400' : 'text-cyan-300'}`}>
            {formatTime(timer)}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-0.5">
            <span>FALLS: <b className="text-red-400">{deaths}</b></span>
            <span>AIR DASH: <b className={dashCooldown <= 0.05 ? 'text-emerald-400' : 'text-slate-500'}>{dashCooldown <= 0.05 ? 'READY' : `${Math.ceil(dashCooldown * 100)}%`}</b></span>
            <span>2X JUMP: <b className={canDoubleJump ? 'text-cyan-400' : 'text-slate-500'}>{canDoubleJump ? 'READY' : 'USED'}</b></span>
          </div>
        </div>

        {/* Top Right Controls & Live Multiplayer Standings */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {/* Developer Portfolio Link */}
            <a
              href="https://abijith.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/80 hover:bg-cyan-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-lg px-2.5 py-2 text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 group font-bold"
              title="Developed by abijith.k | Click to visit abijith.org"
            >
              <span className="text-[10px] text-slate-400 hidden md:inline">DEV:</span>
              <span>abijith.k</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Platform Switcher */}
            <button
              onClick={() => setPlatformMode(platformMode === 'pc' ? 'mobile' : 'pc')}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white rounded-lg px-2.5 py-2 text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Toggle PC / Mobile Crossplay HUD"
            >
              {platformMode === 'mobile' ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline text-xs font-bold">MOBILE MODE</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-xs font-bold">PC MODE</span>
                </>
              )}
            </button>

            {/* Audio Mute */}
            <button
              onClick={toggleMute}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white rounded-lg p-2 text-xs transition-all shadow-md active:scale-95"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Quick Respawn */}
            <button
              onClick={() => triggerRespawn()}
              className="bg-slate-900/80 hover:bg-red-950/80 border border-red-500/40 text-red-300 rounded-lg px-2.5 py-2 text-xs flex items-center gap-1 transition-all shadow-md active:scale-95"
              title="Respawn at latest Checkpoint"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-bold">RESPAWN</span>
            </button>
          </div>

          {/* Live Multiplayer Standings Widget */}
          {gameMode === 'multiplayer' && standings.length > 0 && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2.5 shadow-xl w-48 text-left animate-in fade-in">
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> STANDINGS
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">
                  POS #{playerRank}
                </span>
              </div>
              <div className="space-y-1">
                {standings.map((racer) => (
                  <div
                    key={racer.id}
                    className={`flex items-center justify-between text-[11px] px-2 py-0.5 rounded-lg ${
                      racer.isSelf
                        ? 'bg-cyan-500/20 border border-cyan-400/60 font-black text-white'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[10px] text-slate-400">#{racer.rank}</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: racer.color }} />
                      <span className="truncate">{racer.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">
                      {racer.finished ? '🏆 FIN' : `S${racer.stage}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* STAGE SELECTOR DRAWER (OPTIONAL PRACTICE/TELEPORT)   */}
      {/* ==================================================== */}
      {showStageSelector && (
        <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 mt-2 max-w-2xl mx-auto w-full shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 10-Stage Course Progression
            </h3>
            <span className="text-[11px] text-slate-400">Click any stage to teleport</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {COURSE_CHECKPOINTS.map((cp) => (
              <button
                key={cp.id}
                onClick={() => {
                  teleportToStage(cp.stage);
                  setShowStageSelector(false);
                }}
                className={`p-2 rounded-lg text-left border transition-all text-xs ${
                  currentStage === cp.stage
                    ? 'border-cyan-400 bg-cyan-950/60 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] text-cyan-400 font-bold">STAGE {cp.stage}</div>
                <div className="font-semibold truncate">{cp.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* NOTIFICATION TOAST                                   */}
      {/* ==================================================== */}
      {activeNotification && (
        <div className="self-center my-2 pointer-events-none transition-all">
          <div className="bg-slate-950/90 border border-cyan-400/80 px-4 py-2 rounded-xl text-xs md:text-sm font-black tracking-wider text-cyan-200 shadow-xl shadow-cyan-950/80 flex items-center gap-2 animate-bounce">
            <Zap className="w-4 h-4 text-cyan-400" />
            {activeNotification}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* BOTTOM AREA: CROSSPLAY CONTROLS                     */}
      {/* ==================================================== */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* MOBILE: VIRTUAL JOYSTICK (LEFT THUMB) */}
        {platformMode === 'mobile' ? (
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            className="w-32 h-32 rounded-full border-2 border-cyan-500/40 bg-slate-950/50 backdrop-blur-md relative flex items-center justify-center touch-none select-none shadow-xl shadow-cyan-950/40"
          >
            {/* Guide Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-0.5 bg-cyan-400" />
              <div className="h-full w-0.5 bg-cyan-400 absolute" />
            </div>
            {/* Draggable Knob */}
            <div
              ref={joystickKnobRef}
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
              className="w-14 h-14 rounded-full bg-cyan-500/80 border-2 border-white/90 shadow-lg shadow-cyan-500/50 pointer-events-none transition-transform duration-75 flex items-center justify-center"
            >
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </div>
        ) : (
          /* PC: KEYBOARD CONTROL LEGEND */
          <div className="hidden md:flex flex-col gap-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
            <div className="text-white font-bold text-xs flex items-center gap-1.5 mb-0.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" /> PC CONTROLS
            </div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">W A S D</kbd> Move Runner</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">SPACE</kbd> Jump & Double Jump</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">SHIFT / Q / E</kbd> Air Dash Thrusters</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">MOUSE DRAG</kbd> Orbit Camera 360°</div>
          </div>
        )}

        {/* 10-STAGE PROGRESS BAR (CENTER BOTTOM) */}
        <div className="hidden lg:flex flex-col items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2">
          <span className="text-[10px] tracking-wider text-slate-400 uppercase font-bold">COURSE ELEVATION PROGRESS</span>
          <div className="flex items-center gap-1.5">
            {COURSE_CHECKPOINTS.map((cp) => (
              <div
                key={cp.id}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border transition-all ${
                  currentStage >= cp.stage
                    ? 'border-cyan-400 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/50'
                    : 'border-slate-800 bg-slate-900/60 text-slate-600'
                }`}
                title={`Stage ${cp.stage}: ${cp.name}`}
              >
                {cp.stage}
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE ACTION BUTTONS (RIGHT THUMB) */}
        {platformMode === 'mobile' ? (
          <div className="flex items-center gap-3 touch-none">
            {/* Air Dash Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setDashHeld(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setDashHeld(false);
              }}
              disabled={dashCooldown > 0.05}
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 shadow-xl ${
                dashCooldown <= 0.05
                  ? 'border-fuchsia-500 bg-fuchsia-950/70 text-fuchsia-300 shadow-fuchsia-900/50'
                  : 'border-slate-800 bg-slate-900/50 text-slate-600 opacity-60'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className="text-[9px] font-black mt-0.5">DASH</span>
            </button>

            {/* Jump Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setJumpHeld(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setJumpHeld(false);
              }}
              className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-xl shadow-cyan-900/50 active:scale-95 active:bg-cyan-500 active:text-slate-950 transition-all"
            >
              <Flame className="w-7 h-7" />
              <span className="text-[10px] font-black mt-0.5">JUMP 2X</span>
            </button>
          </div>
        ) : (
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              AIM: MOUSE DRAG / TOUCH LOOK
            </span>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* STAGE 10 VICTORY MODAL (COMPLETED THE 15-MIN CHALLENGE)*/}
      {/* ==================================================== */}
      {showVictoryModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-cyan-400/80 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center shadow-2xl shadow-cyan-500/30 animate-in zoom-in-95 duration-300">
            {/* Header Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50 animate-bounce">
              <Trophy className="w-10 h-10 text-cyan-300" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide uppercase">
              {gameMode === 'multiplayer'
                ? (playerRank === 1 ? '🥇 1ST PLACE WINNER!' : `🏁 FINISHED IN #${playerRank} PLACE!`)
                : '✦ COURSE COMPLETED! ✦'}
            </h2>
            <p className="text-sm text-cyan-300 mt-1 font-semibold">
              {gameMode === 'multiplayer'
                ? `You competed against ${playerCount} players and finished at the Neon Core Summit!`
                : 'You conquered all 10 stages and reached the Neon Core Summit!'}
            </p>

            {/* Multiplayer Race Results Table */}
            {gameMode === 'multiplayer' && standings.length > 0 && (
              <div className="my-4 p-3.5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/40 text-left">
                <div className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>FINAL RACE STANDINGS ({roomCode})</span>
                  <span>{playerCount} RACERS</span>
                </div>
                <div className="space-y-1.5">
                  {standings.map((racer) => (
                    <div
                      key={racer.id}
                      className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl ${
                        racer.isSelf
                          ? 'bg-cyan-500/20 border border-cyan-400/80 font-black text-white'
                          : 'bg-slate-950/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">#{racer.rank}</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: racer.color }} />
                        <span className={racer.isSelf ? 'font-black text-white' : ''}>{racer.name}</span>
                        {racer.isSelf && <span className="text-[9px] bg-cyan-400 text-slate-950 px-1 py-0.2 rounded font-black">YOU</span>}
                      </div>
                      <span className="font-mono text-cyan-300 text-[11px]">
                        {racer.finishTime ? formatTime(racer.finishTime) : (racer.finished ? 'COMPLETED' : `STAGE ${racer.stage}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rank Badge */}
            {finishTime !== null && (
              <div className="my-4 p-4 rounded-2xl border bg-slate-900/80">
                {(() => {
                  const rankInfo = calculateRank(finishTime);
                  return (
                    <>
                      <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">PARKOUR PERFORMANCE RANK</div>
                      <div className={`text-3xl font-black mt-1 ${rankInfo.color}`}>
                        {rankInfo.rank}
                      </div>
                      <div className="text-xs font-semibold text-slate-300 mt-0.5">
                        {rankInfo.title}
                      </div>
                    </>
                  );
                })()}

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">YOUR TIME</span>
                    <span className="text-base font-black text-cyan-300">{formatTime(finishTime)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">PAR TARGET</span>
                    <span className="text-base font-black text-white">15:00.00</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">FALLS</span>
                    <span className="text-base font-black text-red-400">{deaths}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={restartGame}
                className="flex-1 py-3.5 px-6 rounded-xl font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-400/40 active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> PLAY AGAIN / SPEEDRUN
              </button>
            </div>

            {/* Developer Credit */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span>Game Developed by:</span>
              <a
                href="https://abijith.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 font-bold hover:text-white underline inline-flex items-center gap-1 group"
              >
                <span>abijith.k</span>
                <ExternalLink className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <span className="text-slate-600">|</span>
              <a
                href="https://abijith.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-300 underline"
              >
                abijith.org
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
