'use client';

import React, { useState } from 'react';
import {
  Play,
  Users,
  User,
  ExternalLink,
  Flame,
  Zap,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Trophy,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useParkourStore } from '@/lib/parkourStore';

export function StartLandingOverlay() {
  const {
    gameStarted,
    startGame,
    createRoom,
    joinRoom,
    platformMode,
    setPlatformMode,
  } = useParkourStore();

  const [activeTab, setActiveTab] = useState<'solo' | 'multiplayer'>('multiplayer');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(4);
  const [playerNameInput, setPlayerNameInput] = useState<string>('CyberRunner');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  if (gameStarted) return null;

  const handleStartSolo = () => {
    startGame('solo', 1, playerNameInput);
  };

  const handleCreateMultiplayerRoom = () => {
    createRoom(selectedPlayerCount, playerNameInput);
  };

  const handleJoinMultiplayerRoom = () => {
    if (!joinCodeInput.trim()) return;
    joinRoom(joinCodeInput, playerNameInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md select-none font-mono">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 scanline-bg pointer-events-none opacity-40" />

      {/* Main Glassmorphic Terminal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950/95 border-2 border-cyan-500/50 rounded-3xl p-5 md:p-8 shadow-2xl shadow-cyan-950/90 text-center animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-widest uppercase mb-3 shadow-sm shadow-cyan-500/30">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          15-MINUTE SUMMIT CHALLENGE
        </div>

        {/* Game Title */}
        <h1 className="text-3xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 uppercase drop-shadow-[0_0_25px_rgba(0,255,255,0.4)]">
          NEON CORE: PARKOUR
        </h1>

        <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
          10-Stage high-altitude cyber speedrun. Race against up to 4 players simultaneously to conquer the Neon Core Summit!
        </p>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-2xl bg-slate-900/90 border border-slate-800 p-1.5 my-5 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('multiplayer')}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'multiplayer'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>MULTIPLAYER (1-4P)</span>
          </button>
          <button
            onClick={() => setActiveTab('solo')}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'solo'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>SOLO TIME ATTACK</span>
          </button>
        </div>

        {/* Player Name Input */}
        <div className="mb-4 max-w-md mx-auto text-left">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            YOUR RUNNER CALLSIGN:
          </label>
          <input
            type="text"
            value={playerNameInput}
            onChange={(e) => setPlayerNameInput(e.target.value.slice(0, 16))}
            placeholder="Enter callsign..."
            className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-bold tracking-wider outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        {/* ========================================================= */}
        {/* TAB 1: MULTIPLAYER RACE (1 TO 4 PLAYERS)                 */}
        {/* ========================================================= */}
        {activeTab === 'multiplayer' && (
          <div className="space-y-4 max-w-md mx-auto text-left">
            {/* Player Count Selection (1 to 4 Players) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" /> SELECT PLAYERS (1 TO 4):
                </span>
                <span className="text-xs font-bold text-cyan-300">
                  {selectedPlayerCount} {selectedPlayerCount === 1 ? 'Player' : 'Players Race'}
                </span>
              </div>

              {/* 1 to 4 Player Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSelectedPlayerCount(count)}
                    className={`py-3 rounded-xl border font-black text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedPlayerCount === count
                        ? 'border-cyan-400 bg-cyan-950/80 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{count}P</span>
                    <span className="text-[9px] text-slate-400">
                      {count === 1 ? 'Solo' : `${count} Racers`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Room Button */}
            <button
              onClick={handleCreateMultiplayerRoom}
              className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-base md:text-lg tracking-wider uppercase shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5 fill-current" />
              <span>CREATE ROOM & START RACE ({selectedPlayerCount}P)</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Join Room Box */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER ROOM CODE (e.g. NEON-8821)"
                className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white font-bold tracking-wider outline-none placeholder:text-slate-600"
              />
              <button
                onClick={handleJoinMultiplayerRoom}
                disabled={!joinCodeInput.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all border border-slate-600"
              >
                JOIN
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SOLO TIME ATTACK                                  */}
        {/* ========================================================= */}
        {activeTab === 'solo' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-2 text-left">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">PAR TIME</div>
                  <div className="text-xs font-black text-white">15:00.00</div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">STAGES</div>
                  <div className="text-xs font-black text-white">10 LEVELS</div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">RANKING</div>
                  <div className="text-xs font-black text-white">S, A, B RANK</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartSolo}
              className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-base md:text-lg tracking-wider uppercase shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              <span>START SOLO SPEEDRUN</span>
            </button>
          </div>
        )}

        {/* Crossplay Mode Selector */}
        <div className="flex items-center justify-center gap-2 mt-5 text-xs">
          <span className="text-slate-400 text-[11px]">CONTROLS:</span>
          <button
            onClick={() => setPlatformMode('pc')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
              platformMode === 'pc'
                ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3 h-3" /> PC KEYBOARD
          </button>
          <button
            onClick={() => setPlatformMode('mobile')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
              platformMode === 'mobile'
                ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3 h-3" /> MOBILE TOUCH
          </button>
        </div>

        {/* ========================================================= */}
        {/* DEVELOPER CREDIT & PORTFOLIO REDIRECT LINK (abijith.k)   */}
        {/* ========================================================= */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User className="w-4 h-4 text-cyan-400" />
            <span>DEVELOPED BY:</span>
            <a
              href="https://abijith.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-black text-sm tracking-wide transition-all shadow-sm hover:shadow-cyan-500/40 group"
              title="Click to visit abijith.org portfolio"
            >
              <span>abijith.k</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <a
            href="https://abijith.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors font-medium underline underline-offset-4 decoration-cyan-500/50"
          >
            Portfolio: abijith.org ↗
          </a>
        </div>

      </div>
    </div>
  );
}
