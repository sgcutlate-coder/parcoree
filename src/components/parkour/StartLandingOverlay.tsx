'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  LogIn,
  PlusCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { useParkourStore } from '@/lib/parkourStore';
import { CourseDifficulty, DIFFICULTY_CONFIGS } from '@/lib/parkourDifficulties';

const DIFFICULTIES: CourseDifficulty[] = ['easy', 'medium', 'hard', 'ultra_hard'];

export function StartLandingOverlay() {
  const {
    gameStarted,
    inLobby,
    startSoloGame,
    createMultiplayerRoom,
    joinMultiplayerRoom,
    platformMode,
    setPlatformMode,
    selectedDifficulty,
    setDifficulty,
  } = useParkourStore();

  const [activeTab, setActiveTab] = useState<'solo' | 'multiplayer'>('solo');
  const [mpSubTab, setMpSubTab] = useState<'create' | 'join'>('create');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(4);
  const [playerNameInput, setPlayerNameInput] = useState<string>('CyberRunner');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');

  // Check if room param exists in URL to auto-fill code & select join mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setJoinCodeInput(roomParam.toUpperCase());
        setActiveTab('multiplayer');
        setMpSubTab('join');
      }
    }
  }, []);

  if (gameStarted || inLobby) return null;

  const currentConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

  const handleStartSolo = () => {
    startSoloGame(selectedDifficulty);
  };

  const handleCreateMultiplayerRoom = () => {
    createMultiplayerRoom(selectedPlayerCount, playerNameInput, selectedDifficulty);
  };

  const handleJoinMultiplayerRoom = () => {
    const trimmed = joinCodeInput.trim();
    if (!trimmed) return;
    joinMultiplayerRoom(trimmed, playerNameInput);
  };

  const handleKeyDownJoin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoinMultiplayerRoom();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md select-none font-mono">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 scanline-bg pointer-events-none opacity-40" />

      {/* Main Glassmorphic Terminal */}
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950/95 border-2 border-cyan-500/50 rounded-3xl p-5 md:p-7 shadow-2xl shadow-cyan-950/90 text-center animate-in zoom-in-95 duration-300 max-h-[94vh] overflow-y-auto">
        
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-widest uppercase mb-2 shadow-sm shadow-cyan-500/30">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          MULTI-TIERED HIGH-ALTITUDE CYBER GAUNTLET
        </div>

        {/* Game Title */}
        <h1 className="text-3xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 uppercase drop-shadow-[0_0_25px_rgba(0,255,255,0.4)]">
          NEON CORE: PARKOUR
        </h1>

        <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
          High-altitude cyber parkour speedrun. Conquer varied structures, master kinetic blocks, collect data cores, and race to the summit!
        </p>

        {/* ========================================================= */}
        {/* DIFFICULTY SELECTOR GRID                                 */}
        {/* ========================================================= */}
        <div className="my-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> SELECT DIFFICULTY & LEVEL SECTION:
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {currentConfig.levelCount} LEVELS • PAR {Math.floor(currentConfig.parTimeSeconds / 60)}:00
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTIES.map((diff) => {
              const cfg = DIFFICULTY_CONFIGS[diff];
              const isSelected = selectedDifficulty === diff;

              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/70 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/80 scale-[1.02]'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  {/* Top Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded-full uppercase"
                        style={{
                          backgroundColor: `${cfg.color}25`,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}50`,
                        }}
                      >
                        {cfg.badge}
                      </span>
                      <span className="text-[10px] font-black font-mono text-white">
                        {cfg.levelCount} LVLS
                      </span>
                    </div>

                    <div className="text-xs font-black tracking-wide text-white truncate mt-1">
                      {cfg.name}
                    </div>
                  </div>

                  {/* Subtitle / Key Mechanics */}
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-2">
                    {cfg.mechanics.slice(0, 2).join(' • ')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Active Difficulty Preview Banner */}
          <div className="mt-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentConfig.color }} />
                <span>{currentConfig.name}:</span>
                <span className="text-slate-400 text-[11px] font-normal">{currentConfig.description}</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {currentConfig.mechanics.map((mech) => (
                  <span
                    key={mech}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 text-slate-300 font-bold"
                  >
                    ✦ {mech}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right sm:border-l sm:border-slate-800 sm:pl-3">
              <span className="text-[10px] text-slate-500 uppercase block">TARGET PAR TIME</span>
              <span className="text-xs font-black text-cyan-300 font-mono">
                {Math.floor(currentConfig.parTimeSeconds / 60)}:00.00
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-2xl bg-slate-900/90 border border-slate-800 p-1.5 my-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('solo')}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'solo'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>SOLO SPEEDRUN</span>
          </button>
          <button
            type="button"
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
        </div>

        {/* Player Name Input */}
        <div className="mb-3 max-w-md mx-auto text-left">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            YOUR RUNNER CALLSIGN:
          </label>
          <input
            type="text"
            value={playerNameInput}
            onChange={(e) => setPlayerNameInput(e.target.value.slice(0, 16))}
            placeholder="Enter callsign..."
            className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm text-white font-bold tracking-wider outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        {/* ========================================================= */}
        {/* TAB 1: SOLO SPEEDRUN                                     */}
        {/* ========================================================= */}
        {activeTab === 'solo' && (
          <div className="space-y-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleStartSolo}
              className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-base md:text-lg tracking-wider uppercase shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              <span>START {currentConfig.name} ({currentConfig.levelCount} LEVELS)</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MULTIPLAYER RACE                                  */}
        {/* ========================================================= */}
        {activeTab === 'multiplayer' && (
          <div className="space-y-3 max-w-md mx-auto text-left">
            <div className="flex rounded-xl bg-slate-900/95 border border-slate-700/80 p-1">
              <button
                type="button"
                onClick={() => setMpSubTab('create')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  mpSubTab === 'create'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>CREATE ROOM</span>
              </button>
              <button
                type="button"
                onClick={() => setMpSubTab('join')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  mpSubTab === 'join'
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30 border border-fuchsia-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>JOIN CUSTOM ROOM</span>
              </button>
            </div>

            {/* CREATE SUBTAB */}
            {mpSubTab === 'create' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-400" /> RACERS (1 TO 4):
                    </span>
                    <span className="text-xs font-bold text-cyan-300">
                      {selectedPlayerCount} {selectedPlayerCount === 1 ? 'Solo' : 'Players'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSelectedPlayerCount(count)}
                        className={`py-2.5 rounded-xl border font-black text-sm transition-all flex flex-col items-center justify-center ${
                          selectedPlayerCount === count
                            ? 'border-cyan-400 bg-cyan-950/80 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{count}P</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateMultiplayerRoom}
                  className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-base md:text-lg tracking-wider uppercase shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5 fill-current" />
                  <span>CREATE {currentConfig.name} ROOM ({currentConfig.levelCount}L)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* JOIN SUBTAB */}
            {mpSubTab === 'join' && (
              <div className="bg-slate-900/90 border border-fuchsia-500/50 rounded-2xl p-4 space-y-3 shadow-lg shadow-fuchsia-950/40 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-black text-fuchsia-300 uppercase tracking-wider block mb-1">
                    ENTER ROOM CODE TO JOIN:
                  </label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDownJoin}
                    placeholder="ENTER ROOM CODE (e.g. NEON-8821)"
                    autoFocus
                    className="w-full bg-slate-950/90 border-2 border-fuchsia-500/70 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-black tracking-widest outline-none transition-all placeholder:text-slate-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoinMultiplayerRoom}
                  disabled={!joinCodeInput.trim()}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400 hover:from-fuchsia-400 hover:to-cyan-300 disabled:opacity-40 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-fuchsia-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4 fill-current" />
                  <span>JOIN CUSTOM ROOM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Crossplay Mode Selector */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs">
          <span className="text-slate-400 text-[11px]">CONTROLS:</span>
          <button
            type="button"
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
            type="button"
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

        {/* Developer Credit */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>DEVELOPED BY:</span>
            <a
              href="https://abijith.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold text-xs tracking-wide transition-all"
            >
              <span>abijith.k</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </div>

          <a
            href="https://abijith.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/50"
          >
            Portfolio: abijith.org ↗
          </a>
        </div>

      </div>
    </div>
  );
}
