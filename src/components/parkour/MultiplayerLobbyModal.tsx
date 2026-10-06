'use client';

import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  ArrowRight,
  LogOut,
  Share2,
} from 'lucide-react';
import { useParkourStore } from '@/lib/parkourStore';

export function MultiplayerLobbyModal() {
  const {
    inLobby,
    isHost,
    roomCode,
    maxPlayers,
    lobbyPlayers,
    playerName,
    startMatchFromLobby,
    leaveLobby,
  } = useParkourStore();

  const [copied, setCopied] = useState(false);

  if (!inLobby) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const inviteUrl = `${window.location.origin}?room=${roomCode}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalConnected = Math.max(1, lobbyPlayers.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl select-none font-mono">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 scanline-bg pointer-events-none opacity-40" />

      {/* Main Glassmorphic Lobby Terminal */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950/95 border-2 border-fuchsia-500/60 rounded-3xl p-6 md:p-8 shadow-2xl shadow-fuchsia-950/80 text-center animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-fuchsia-500/10 border-2 border-fuchsia-400 flex items-center justify-center mb-3 shadow-lg shadow-fuchsia-500/40">
          <Users className="w-8 h-8 text-fuchsia-400 animate-pulse" />
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase">
          MULTIPLAYER LOBBY
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Share your room code with friends. When everyone joins, start the race!
        </p>

        {/* Room Code Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-fuchsia-500/50 shadow-inner">
          <span className="text-[10px] text-fuchsia-300 uppercase font-black tracking-widest block mb-1">
            ROOM CODE (SHARE WITH FRIENDS)
          </span>
          <div className="text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-300 to-cyan-300">
            {roomCode}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-white font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-fuchsia-400" />}
              <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/50 text-xs text-fuchsia-300 font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>COPY INVITE LINK</span>
            </button>
          </div>
        </div>

        {/* Connected Players List */}
        <div className="text-left mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>CONNECTED RACERS:</span>
            <span className="text-fuchsia-300 font-black">{totalConnected}/{maxPlayers} PLAYERS</span>
          </div>

          <div className="space-y-2">
            {/* Slot 1: Host */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-cyan-400/50 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                <span className="font-black text-sm">{playerName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  {isHost ? 'HOST' : 'YOU'}
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-bold">READY</span>
            </div>

            {/* Other Remote Connected Players */}
            {lobbyPlayers.filter((p) => p.name !== playerName).map((player, idx) => (
              <div
                key={player.id || idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-fuchsia-500/40 text-white animate-in fade-in"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color || '#ff007f' }} />
                  <span className="font-bold text-sm">{player.name}</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold">CONNECTED</span>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, maxPlayers - totalConnected) }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-600 text-xs border-dashed"
              >
                <span>Waiting for player {totalConnected + i + 1} to enter code...</span>
                <span className="animate-pulse text-[10px] uppercase">OPEN SLOT</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {isHost ? (
            <button
              onClick={startMatchFromLobby}
              className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400 hover:from-fuchsia-400 hover:to-cyan-300 text-slate-950 font-black text-base md:text-lg tracking-wider uppercase shadow-xl shadow-fuchsia-500/40 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              <span>START RACE ({totalConnected} PLAYERS READY)</span>
            </button>
          ) : (
            <div className="py-4 px-6 rounded-2xl bg-slate-900/80 border border-fuchsia-500/40 text-fuchsia-300 font-bold text-sm flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-ping" />
              <span>WAITING FOR HOST TO START THE RACE...</span>
            </div>
          )}

          <button
            onClick={leaveLobby}
            className="w-full py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LEAVE ROOM</span>
          </button>
        </div>

      </div>
    </div>
  );
}
