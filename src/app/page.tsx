'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParkourStore } from '@/lib/parkourStore';
import { ParkourHUD } from '@/components/parkour/ParkourHUD';
import { StartLandingOverlay } from '@/components/parkour/StartLandingOverlay';
import { parkourAudio } from '@/lib/parkourAudio';

const ParkourCanvas = dynamic(
  () => import('@/components/parkour/ParkourCanvas').then((m) => m.ParkourCanvas),
  { ssr: false }
);

export default function ParkourApp() {
  const init = useParkourStore((s) => s.init);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        parkourAudio.playJump();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasInteracted]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#04060f] text-white select-none font-mono">
      {/* 3D Parkour R3F Canvas */}
      <ParkourCanvas />

      {/* Cyber Speedrun HUD & Mobile Touch Controls */}
      <ParkourHUD />

      {/* Initial Landing Start Screen with Play Button & Developer abijith.k link */}
      <StartLandingOverlay />
    </main>
  );
}
