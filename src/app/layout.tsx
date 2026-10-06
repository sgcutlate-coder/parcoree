import type { Metadata, Viewport } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NEON CORE: PARKOUR | 3D Cyber Parkour Speedrun & Multiplayer Race',
  description: 'Conquer 10 high-altitude cyber stages in NEON CORE: PARKOUR. Developed by abijith.k (abijith.org). Featuring double-jumps, air-dashes, kinetic jump pads, and 1 to 4 players multiplayer race mode.',
  keywords: ['parkour', '3d game', 'speedrun', 'cyberpunk', 'threejs', 'react-three-fiber', 'nextjs', 'multiplayer', 'crossplay'],
  authors: [{ name: 'abijith.k', url: 'https://abijith.org' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00f0ff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="bg-[#05060b] text-[#e6f1ff] antialiased h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
