'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CoursePlatform, CourseRing, CourseCheckpoint, CourseItem } from '@/lib/parkourCourse';
import { useParkourStore } from '@/lib/parkourStore';
import { parkourAudio } from '@/lib/parkourAudio';
import { DIFFICULTY_CONFIGS } from '@/lib/parkourDifficulties';

// ==========================================
// 1. CYBER RUNNER CHARACTER MODEL
// ==========================================
interface PlayerMeshProps {
  isDashing: boolean;
  isGrounded: boolean;
  isDoubleJumping: boolean;
  speed: number;
  hasShield?: boolean;
  hasAntiGrav?: boolean;
  primaryColor?: string;
  glowColor?: string;
}

function CyberRunnerModel({
  isDashing,
  isGrounded,
  isDoubleJumping,
  speed,
  hasShield,
  hasAntiGrav,
  primaryColor = '#00ffff',
  glowColor = '#00e5ff',
}: PlayerMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const jetpackGlowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 14;
    // Running leg/arm swing when moving on ground
    if (isGrounded && speed > 0.5) {
      const swing = Math.sin(t) * 0.45;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.8;
    } else {
      // Jump pose
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.3;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -0.3;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.5;
    }

    // Jetpack flare intensity
    if (jetpackGlowRef.current) {
      jetpackGlowRef.current.intensity = isDashing ? 8 : (isDoubleJumping ? 5 : 1.2);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.55, 0.65, 0.35]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glowing Chest Reactor */}
      <mesh position={[0, 1.15, 0.19]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color={hasAntiGrav ? '#a3e635' : primaryColor} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.38]} />
        <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Cyber Visor */}
      <mesh position={[0, 1.63, 0.19]}>
        <boxGeometry args={[0.32, 0.12, 0.05]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Jetpack Thrusters on Back */}
      <group position={[0, 1.15, -0.22]}>
        <mesh>
          <boxGeometry args={[0.38, 0.45, 0.15]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        {/* Left Nozzle */}
        <mesh position={[-0.12, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
          <meshBasicMaterial color={isDashing ? '#ff007f' : primaryColor} />
        </mesh>
        {/* Right Nozzle */}
        <mesh position={[0.12, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
          <meshBasicMaterial color={isDashing ? '#ff007f' : primaryColor} />
        </mesh>
        <pointLight
          ref={jetpackGlowRef}
          color={isDashing ? '#ff007f' : primaryColor}
          distance={4}
          intensity={2}
        />
      </group>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.38, 1.05, 0]}>
        <boxGeometry args={[0.14, 0.55, 0.14]} />
        <meshStandardMaterial color={primaryColor} roughness={0.4} />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.38, 1.05, 0]}>
        <boxGeometry args={[0.14, 0.55, 0.14]} />
        <meshStandardMaterial color={primaryColor} roughness={0.4} />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.16, 0.45, 0]}>
        <boxGeometry args={[0.16, 0.65, 0.18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.16, 0.45, 0]}>
        <boxGeometry args={[0.16, 0.65, 0.18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Active Aegis Shield Sphere */}
      {hasShield && (
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.45} />
        </mesh>
      )}

      {/* Dash / Thruster Trail Particle Halo */}
      {isDashing && (
        <mesh position={[0, 1.1, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.08, 8, 24]} />
          <meshBasicMaterial color="#ff007f" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// Competitor Runner 3D Model with Overhead Callsign
function CompetitorRunnerItem({ racer }: { racer: import('@/lib/parkourStore').RemotePlayer }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const dt = Math.min(delta, 0.1);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, racer.x, dt * 15);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, racer.y, dt * 15);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, racer.z, dt * 15);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, racer.rotY || 0, dt * 12);
    }
  });

  return (
    <group ref={groupRef} position={[racer.x, racer.y, racer.z]}>
      <Text
        position={[0, 2.35, 0]}
        fontSize={0.32}
        color={racer.color || '#00ffff'}
        anchorX="center"
        anchorY="bottom"
      >
        {`${racer.name} [STG ${racer.stage}]`}
      </Text>
      <CyberRunnerModel
        isDashing={racer.isDashing}
        isGrounded={racer.isGrounded}
        isDoubleJumping={false}
        speed={racer.speed}
        primaryColor={racer.color}
        glowColor={racer.glowColor}
      />
    </group>
  );
}

// ==========================================
// 2. ENHANCED COURSE PLATFORM RENDERER
// ==========================================
interface PlatformMeshProps {
  platform: CoursePlatform;
}

const CoursePlatformItem = React.memo(function CoursePlatformItem({ platform }: PlatformMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const decayingStates = useParkourStore((s) => s.decayingPlatformStates);
  const decayingState = decayingStates[platform.id];

  const isJumpPad = platform.type === 'jump_pad';
  const isMoving = platform.type === 'moving';
  const isDecaying = platform.type === 'decaying';
  const isIce = platform.type === 'ice';
  const isBouncy = platform.type === 'bouncy';
  const isLaser = platform.type === 'laser_hazard';
  const isPhase = platform.type === 'phase';
  const isConveyor = platform.type === 'conveyor';

  const [phaseSolid, setPhaseSolid] = useState(true);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Moving Platform oscillation
    if (groupRef.current && isMoving && platform.moveRange) {
      const offset = Math.sin(t * platform.moveRange.speed) * platform.moveRange.dist;
      if (platform.moveRange.axis === 'x') groupRef.current.position.x = platform.x + offset;
      if (platform.moveRange.axis === 'y') groupRef.current.position.y = platform.y + offset;
      if (platform.moveRange.axis === 'z') groupRef.current.position.z = platform.z + offset;
    }

    // Decaying Platform shaking animation
    if (groupRef.current && isDecaying) {
      if (decayingState?.state === 'shaking') {
        const shakeX = (Math.random() - 0.5) * 0.12;
        const shakeZ = (Math.random() - 0.5) * 0.12;
        groupRef.current.position.x = platform.x + shakeX;
        groupRef.current.position.z = platform.z + shakeZ;
      } else {
        groupRef.current.position.x = platform.x;
        groupRef.current.position.z = platform.z;
      }
    }

    // Phase Platform blinking cycle
    if (isPhase) {
      const isSolidNow = (t % 4.5) < 2.5;
      if (isSolidNow !== phaseSolid) {
        setPhaseSolid(isSolidNow);
      }
    }
  });

  // If decaying platform has collapsed, hide it so player falls through!
  if (isDecaying && decayingState?.state === 'collapsed') {
    return null;
  }

  const glow = platform.glowColor || '#00ffff';

  return (
    <group ref={groupRef} position={[platform.x, platform.y, platform.z]}>
      {/* Main Solid Metallic Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[platform.sx, platform.sy, platform.sz]} />
        <meshStandardMaterial
          color={
            isLaser
              ? '#500707'
              : isIce
              ? '#0c4a6e'
              : isDecaying
              ? (decayingState?.state === 'shaking' ? '#7c2d12' : '#451a03')
              : isBouncy
              ? '#064e3b'
              : isConveyor
              ? '#042f2e'
              : platform.color || '#0d1527'
          }
          roughness={isIce ? 0.05 : 0.25}
          metalness={isIce ? 0.1 : 0.8}
          transparent={isPhase && !phaseSolid}
          opacity={isPhase && !phaseSolid ? 0.2 : 1.0}
        />
      </mesh>

      {/* Top Surface Tech Plate */}
      <mesh position={[0, platform.sy / 2 + 0.01, 0]}>
        <boxGeometry args={[platform.sx - 0.2, 0.02, platform.sz - 0.2]} />
        <meshStandardMaterial
          color={
            isIce
              ? '#38bdf8'
              : isLaser
              ? '#b91c1c'
              : isBouncy
              ? '#10b981'
              : isConveyor
              ? '#14b8a6'
              : '#152238'
          }
          roughness={isIce ? 0.05 : 0.3}
          metalness={0.6}
          transparent={isPhase && !phaseSolid}
          opacity={isPhase && !phaseSolid ? 0.15 : 1.0}
        />
      </mesh>

      {/* Radiant Glowing Neon Edge Frame */}
      <mesh position={[0, platform.sy / 2 + 0.02, 0]}>
        <boxGeometry args={[platform.sx, 0.04, platform.sz]} />
        <meshBasicMaterial
          color={
            isDecaying && decayingState?.state === 'shaking'
              ? '#ea580c'
              : isLaser
              ? '#ef4444'
              : glow
          }
          wireframe
          transparent
          opacity={isPhase && !phaseSolid ? 0.3 : 0.75}
        />
      </mesh>

      {/* Kinetic Jump Pad Pulsing Aura */}
      {isJumpPad && (
        <group position={[0, platform.sy / 2 + 0.06, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[Math.min(platform.sx, platform.sz) * 0.38, 24]} />
            <meshBasicMaterial color={glow} transparent opacity={0.7} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                Math.min(platform.sx, platform.sz) * 0.4,
                Math.min(platform.sx, platform.sz) * 0.45,
                24,
              ]}
            />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight color={glow} distance={7} intensity={3.5} />
        </group>
      )}

      {/* Bouncy Trampoline Core Ring */}
      {isBouncy && (
        <group position={[0, platform.sy / 2 + 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[Math.min(platform.sx, platform.sz) * 0.35, 16]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.65} />
          </mesh>
          <pointLight color="#10b981" distance={6} intensity={2.5} />
        </group>
      )}

      {/* Laser Hazard Pulsing Emitter Beam */}
      {isLaser && (
        <group position={[0, platform.sy / 2 + 0.4, 0]}>
          <mesh>
            <boxGeometry args={[platform.sx - 0.4, 0.2, platform.sz - 0.4]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
          </mesh>
          <pointLight color="#ef4444" distance={5} intensity={4} />
        </group>
      )}

      {/* Conveyor Speed Arrows Strip */}
      {isConveyor && (
        <group position={[0, platform.sy / 2 + 0.04, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[platform.sx * 0.7, platform.sz * 0.8]} />
            <meshBasicMaterial color="#14b8a6" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
});

// ==========================================
// 3. GOLDEN SPEED RINGS
// ==========================================
function GoldenRing({ x, y, z, radius, color }: { x: number; y: number; z: number; radius: number; color: string }) {
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 1.5;
    }
  });

  return (
    <group ref={ringRef} position={[x, y, z]}>
      <mesh>
        <torusGeometry args={[radius, 0.22, 12, 36]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[radius * 0.95, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={color} distance={10} intensity={2} />
    </group>
  );
}

// ==========================================
// 4. COLLECTIBLE ITEM RENDERER
// ==========================================
function CollectibleItemMesh({ item }: { item: CourseItem }) {
  const groupRef = useRef<THREE.Group>(null);
  const collected = useParkourStore((s) => s.collectedItems[item.id]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 2;
      groupRef.current.rotation.y = t;
      groupRef.current.position.y = item.y + Math.sin(t * 1.5) * 0.2;
    }
  });

  if (collected) return null;

  return (
    <group ref={groupRef} position={[item.x, item.y, item.z]}>
      {item.type === 'data_core' && (
        <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
          <mesh>
            <octahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00e5ff"
              emissiveIntensity={1.8}
              wireframe={false}
            />
          </mesh>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.5, 0.04, 8, 24]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <pointLight color="#00ffff" distance={4} intensity={2} />
        </Float>
      )}

      {item.type === 'dash_refill' && (
        <Float speed={4} rotationIntensity={1.5} floatIntensity={0.5}>
          <mesh>
            <dodecahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} />
          </mesh>
          <pointLight color="#fbbf24" distance={5} intensity={2.5} />
        </Float>
      )}

      {item.type === 'anti_gravity' && (
        <Float speed={2} rotationIntensity={1} floatIntensity={0.8}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#a3e635" emissive="#84cc16" emissiveIntensity={2} />
          </mesh>
          <pointLight color="#a3e635" distance={5} intensity={2.5} />
        </Float>
      )}

      {item.type === 'chrono_freeze' && (
        <Float speed={3} rotationIntensity={1} floatIntensity={0.4}>
          <mesh>
            <icosahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={2} />
          </mesh>
          <pointLight color="#c084fc" distance={5} intensity={2.5} />
        </Float>
      )}

      {item.type === 'shield' && (
        <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.4}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.35, 0.1, 6]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2} />
          </mesh>
          <pointLight color="#38bdf8" distance={5} intensity={2.5} />
        </Float>
      )}
    </group>
  );
}

// ==========================================
// 5. CHECKPOINT BEACONS
// ==========================================
function CheckpointBeacon({
  cp,
  isReached,
}: {
  cp: CourseCheckpoint;
  isReached: boolean;
}) {
  return (
    <group position={[cp.x, cp.y, cp.z]}>
      {/* Sleek Base Pedestal */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.5, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Floating Hologram Diamond */}
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.3}>
        <mesh position={[0, 1.8, 0]}>
          <octahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial
            color={isReached ? '#00ff88' : cp.color}
            emissive={isReached ? '#00ff88' : cp.color}
            emissiveIntensity={1.4}
            wireframe
          />
        </mesh>
      </Float>

      {/* Subtle Vertical Holographic Light Column */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[0.08, 0.2, 30, 8, 1, true]} />
        <meshBasicMaterial
          color={isReached ? '#00ff88' : cp.color}
          transparent
          opacity={isReached ? 0.2 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Stage Name Label */}
      <Text
        position={[0, 2.7, 0]}
        fontSize={0.4}
        color={isReached ? '#00ff88' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {`STAGE ${cp.stage}`}
      </Text>
    </group>
  );
}

// ==========================================
// 6. DYNAMIC SUMMIT MONOLITH
// ==========================================
function SummitCoreMonolith({
  x,
  y,
  z,
  color = '#818cf8',
  title = '✦ NEON CORE SUMMIT ✦',
}: {
  x: number;
  y: number;
  z: number;
  color?: string;
  title?: string;
}) {
  const coreRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = clock.getElapsedTime() * 0.8;
    }
  });

  return (
    <group position={[x, y, z]}>
      <group ref={coreRef}>
        <mesh rotation={[0.4, 0.4, 0]}>
          <torusGeometry args={[5, 0.25, 16, 48]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
        <mesh rotation={[-0.4, 0.6, 0]}>
          <torusGeometry args={[6.2, 0.25, 16, 48]} />
          <meshStandardMaterial color="#38bdf8" emissive="#00ffff" emissiveIntensity={1.5} />
        </mesh>
      </group>

      <Float speed={3} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[0, 3, 0]}>
          <icosahedronGeometry args={[2.2, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={2}
            roughness={0.1}
          />
        </mesh>
      </Float>

      <pointLight color={color} distance={40} intensity={8} />

      <Text
        position={[0, 8, 0]}
        fontSize={1.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
    </group>
  );
}

// ==========================================
// 7. MAIN PARKOUR GAME CONTROLLER
// ==========================================
function ParkourController() {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);

  // Zustand State & Actions
  const {
    courseData,
    currentCheckpointId,
    reachCheckpoint,
    triggerRespawn,
    triggerHazardHit,
    triggerDash,
    setDoubleJumpAvailable,
    tickTimer,
    platformMode,
    joystickVector,
    isJumpHeld,
    isDashHeld,
    broadcastMyPosition,
    currentStage,
    gameMode,
    hasShield,
    antiGravityTimer,
    collectItem,
    stepOnDecayingPlatform,
    updateDecayingPlatforms,
    decayingPlatformStates,
  } = useParkourStore();

  // Internal Physics State
  const playerPos = useRef(new THREE.Vector3(0, 2, 0));
  const playerVel = useRef(new THREE.Vector3(0, 0, 0));
  const isGrounded = useRef(true);
  const doubleJumpUsed = useRef(false);
  const isDashing = useRef(false);
  const dashTimer = useRef(0);
  const dashDirection = useRef(new THREE.Vector3(0, 0, -1));
  const [renderDashing, setRenderDashing] = useState(false);
  const [renderGrounded, setRenderGrounded] = useState(true);
  const [renderDoubleJump, setRenderDoubleJump] = useState(false);
  const [playerSpeed, setPlayerSpeed] = useState(0);

  // Camera Orbit State
  const camYaw = useRef(0);
  const camPitch = useRef(0.25);
  const isDraggingCam = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Keyboard State
  const keys = useRef<{ [key: string]: boolean }>({});

  // Slide sound throttle
  const lastSlideSound = useRef(0);

  // Keyboard and Touch events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        handleJumpAction();
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyQ' || e.code === 'KeyE') {
        e.preventDefault();
        handleDashAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingCam.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingCam.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      camYaw.current -= dx * 0.005;
      camPitch.current += dy * 0.004;
      camPitch.current = Math.max(-0.4, Math.min(1.1, camPitch.current));
    };

    const handleMouseUp = () => {
      isDraggingCam.current = false;
    };

    let touchId: number | null = null;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.45 && touchId === null) {
          touchId = touch.identifier;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - touchStartX;
          const dy = touch.clientY - touchStartY;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;

          camYaw.current -= dx * 0.007;
          camPitch.current += dy * 0.006;
          camPitch.current = Math.max(-0.4, Math.min(1.1, camPitch.current));
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Jump Action
  const handleJumpAction = () => {
    const jumpBoost = antiGravityTimer > 0 ? 19.5 : 15.5;

    if (isGrounded.current) {
      playerVel.current.y = jumpBoost;
      isGrounded.current = false;
      doubleJumpUsed.current = false;
      setDoubleJumpAvailable(true);
      parkourAudio.playJump();
    } else if (!doubleJumpUsed.current) {
      playerVel.current.y = jumpBoost - 0.5;
      doubleJumpUsed.current = true;
      setDoubleJumpAvailable(false);
      setRenderDoubleJump(true);
      setTimeout(() => setRenderDoubleJump(false), 300);
      parkourAudio.playDoubleJump();
    }
  };

  // Dash Action
  const handleDashAction = () => {
    const success = triggerDash();
    if (!success) return;

    isDashing.current = true;
    dashTimer.current = 0.28;
    setRenderDashing(true);

    const forward = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current)).normalize();
    dashDirection.current.copy(forward);

    playerVel.current.x = forward.x * 24;
    playerVel.current.z = forward.z * 24;
    playerVel.current.y = 4;
  };

  // Mobile Jump / Dash state triggers
  const prevJumpHeld = useRef(false);
  const prevDashHeld = useRef(false);

  useEffect(() => {
    if (isJumpHeld && !prevJumpHeld.current) {
      handleJumpAction();
    }
    prevJumpHeld.current = isJumpHeld;
  }, [isJumpHeld]);

  useEffect(() => {
    if (isDashHeld && !prevDashHeld.current) {
      handleDashAction();
    }
    prevDashHeld.current = isDashHeld;
  }, [isDashHeld]);

  // Teleport/Respawn listener from store
  useEffect(() => {
    const unsub = useParkourStore.subscribe((state, prevState) => {
      if (
        state.respawnPosition !== prevState.respawnPosition ||
        state.selectedDifficulty !== prevState.selectedDifficulty
      ) {
        playerPos.current.set(state.respawnPosition[0], state.respawnPosition[1] + 1, state.respawnPosition[2]);
        playerVel.current.set(0, 0, 0);
        isGrounded.current = true;
      }
    });
    return unsub;
  }, []);

  // Frame Loop
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const clockTime = clock.getElapsedTime();

    tickTimer(dt);
    updateDecayingPlatforms(dt);

    // 1. INPUT MOVEMENT CALCULATION
    const input = new THREE.Vector2(0, 0);

    if (keys.current['KeyW'] || keys.current['ArrowUp']) input.y += 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) input.y -= 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) input.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) input.x += 1;

    if (platformMode === 'mobile' || joystickVector.x !== 0 || joystickVector.y !== 0) {
      input.x += joystickVector.x;
      input.y += joystickVector.y;
    }

    if (input.length() > 1) input.normalize();

    const forwardVec = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current));
    const rightVec = new THREE.Vector3(Math.cos(camYaw.current), 0, -Math.sin(camYaw.current));
    const moveDir = new THREE.Vector3()
      .addScaledVector(forwardVec, input.y)
      .addScaledVector(rightVec, input.x);

    let targetSpeed = 13.5;

    // 2. HORIZONTAL VELOCITY UPDATE
    if (isDashing.current) {
      dashTimer.current -= dt;
      if (dashTimer.current <= 0) {
        isDashing.current = false;
        setRenderDashing(false);
      }
    } else {
      if (moveDir.length() > 0.05) {
        const accel = isGrounded.current ? 45 : 24;
        playerVel.current.x = THREE.MathUtils.lerp(playerVel.current.x, moveDir.x * targetSpeed, dt * 10);
        playerVel.current.z = THREE.MathUtils.lerp(playerVel.current.z, moveDir.z * targetSpeed, dt * 10);
      } else {
        const friction = isGrounded.current ? 0.82 : 0.94;
        playerVel.current.x *= Math.pow(friction, dt * 60);
        playerVel.current.z *= Math.pow(friction, dt * 60);
      }
    }

    // 3. GRAVITY & VERTICAL PHYSICS (Adjusted for Anti-Gravity power-up)
    const gravity = antiGravityTimer > 0 ? -20 : -38;
    if (!isGrounded.current) {
      playerVel.current.y += gravity * dt;
    }

    // 4. PREDICT NEXT POSITION
    const nextX = playerPos.current.x + playerVel.current.x * dt;
    const nextY = playerPos.current.y + playerVel.current.y * dt;
    const nextZ = playerPos.current.z + playerVel.current.z * dt;

    // 5. DETERMINISTIC PLATFORM COLLISION
    let landedOnPlatform: CoursePlatform | null = null;
    let standingTopY = -999;
    const playerRadius = 0.55;

    const platforms = courseData.platforms;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];

      // Check if decaying platform is collapsed
      if (p.type === 'decaying' && decayingPlatformStates[p.id]?.state === 'collapsed') {
        continue;
      }

      // Check if phase platform is intangible/ghost
      if (p.type === 'phase') {
        const isSolidNow = (clockTime % 4.5) < 2.5;
        if (!isSolidNow) continue;
      }

      // Calculate dynamic position if moving platform
      let px = p.x;
      let py = p.y;
      let pz = p.z;
      if (p.type === 'moving' && p.moveRange) {
        const offset = Math.sin(clockTime * p.moveRange.speed) * p.moveRange.dist;
        if (p.moveRange.axis === 'x') px += offset;
        if (p.moveRange.axis === 'y') py += offset;
        if (p.moveRange.axis === 'z') pz += offset;
      }

      const minX = px - p.sx / 2 - playerRadius;
      const maxX = px + p.sx / 2 + playerRadius;
      const minZ = pz - p.sz / 2 - playerRadius;
      const maxZ = pz + p.sz / 2 + playerRadius;
      const topY = py + p.sy / 2;

      // Check horizontal footprint
      if (nextX >= minX && nextX <= maxX && nextZ >= minZ && nextZ <= maxZ) {
        // Laser hazard detection: If player touches the top of a laser hazard block
        if (p.type === 'laser_hazard') {
          if (Math.abs(playerPos.current.y - topY) < 1.0) {
            const respawnPoint = triggerHazardHit();
            playerPos.current.set(respawnPoint[0], respawnPoint[1] + 1.2, respawnPoint[2]);
            playerVel.current.set(0, 0, 0);
            return;
          }
        }

        // Falling down and feet cross platform top
        if (playerPos.current.y >= topY - 0.25 && nextY <= topY + 0.35 && playerVel.current.y <= 0) {
          landedOnPlatform = p;
          standingTopY = topY;
          break;
        }
        // Already standing on top
        if (isGrounded.current && Math.abs(playerPos.current.y - topY) < 0.45) {
          landedOnPlatform = p;
          standingTopY = topY;
          break;
        }
      }
    }

    if (landedOnPlatform) {
      playerPos.current.x = nextX;
      playerPos.current.z = nextZ;
      playerPos.current.y = standingTopY;

      // Specific Block Behaviors
      if (landedOnPlatform.type === 'jump_pad') {
        const bounce = landedOnPlatform.bounceStrength || 24;
        playerVel.current.y = bounce;
        isGrounded.current = false;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
        parkourAudio.playJumpPad();
      } else if (landedOnPlatform.type === 'bouncy') {
        const bounce = Math.max(24, Math.abs(playerVel.current.y) * 1.2);
        playerVel.current.y = bounce;
        isGrounded.current = false;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
        parkourAudio.playBouncy();
      } else if (landedOnPlatform.type === 'decaying') {
        stepOnDecayingPlatform(landedOnPlatform.id);
        playerVel.current.y = 0;
        isGrounded.current = true;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
      } else if (landedOnPlatform.type === 'ice') {
        // Ice low friction
        playerVel.current.x *= Math.pow(0.985, dt * 60);
        playerVel.current.z *= Math.pow(0.985, dt * 60);
        playerVel.current.y = 0;
        isGrounded.current = true;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);

        // Slide sound
        if (clockTime - lastSlideSound.current > 0.4 && Math.hypot(playerVel.current.x, playerVel.current.z) > 4) {
          lastSlideSound.current = clockTime;
          parkourAudio.playIceSlide();
        }
      } else if (landedOnPlatform.type === 'conveyor') {
        const cSpeed = landedOnPlatform.conveyorSpeed || 12;
        playerVel.current.z -= cSpeed * dt * 25; // Boost in negative Z
        playerVel.current.y = 0;
        isGrounded.current = true;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
        parkourAudio.playConveyorBoost();
      } else {
        playerVel.current.y = 0;
        isGrounded.current = true;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
      }
    } else {
      playerPos.current.x = nextX;
      playerPos.current.y = nextY;
      playerPos.current.z = nextZ;
      isGrounded.current = false;
    }

    // 6. GOLDEN SPEED RINGS DETECTION
    for (let r = 0; r < courseData.rings.length; r++) {
      const ring = courseData.rings[r];
      const dist = Math.hypot(
        playerPos.current.x - ring.x,
        playerPos.current.y - ring.y,
        playerPos.current.z - ring.z
      );
      if (dist < ring.radius + 0.8) {
        playerVel.current.x = ring.boostVelocity.x;
        playerVel.current.y = ring.boostVelocity.y;
        playerVel.current.z = ring.boostVelocity.z;
        isGrounded.current = false;
        doubleJumpUsed.current = false;
        parkourAudio.playRingBoost();
        break;
      }
    }

    // 7. COLLECTIBLE ITEMS PICKUP
    for (let it = 0; it < courseData.items.length; it++) {
      const item = courseData.items[it];
      const dist = Math.hypot(
        playerPos.current.x - item.x,
        playerPos.current.y - item.y,
        playerPos.current.z - item.z
      );
      if (dist < 1.8) {
        collectItem(item.id, item.type);
      }
    }

    // 8. CHECKPOINT TRIGGER DETECTION
    for (let c = 0; c < courseData.checkpoints.length; c++) {
      const cp = courseData.checkpoints[c];
      const dist = Math.hypot(
        playerPos.current.x - cp.spawnX,
        playerPos.current.y - cp.spawnY,
        playerPos.current.z - cp.spawnZ
      );
      if (dist < 7.0 && isGrounded.current) {
        reachCheckpoint(cp.id);
      }
    }

    // 9. VOID DETECTION & INSTANT RESPAWN
    const currentCp = courseData.checkpoints.find((c) => c.id === currentCheckpointId) || courseData.checkpoints[0];
    if (playerPos.current.y < currentCp.spawnY - 14 || playerPos.current.y < -12) {
      const respawnPoint = triggerRespawn();
      playerPos.current.set(respawnPoint[0], respawnPoint[1] + 1.2, respawnPoint[2]);
      playerVel.current.set(0, 0, 0);
      isGrounded.current = true;
    }

    // 10. UPDATE PLAYER MESH
    if (playerRef.current) {
      playerRef.current.position.copy(playerPos.current);

      if (moveDir.length() > 0.1) {
        const targetRotY = Math.atan2(moveDir.x, moveDir.z) + Math.PI;
        playerRef.current.rotation.y = THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          targetRotY,
          dt * 12
        );
      } else {
        playerRef.current.rotation.y = THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          camYaw.current + Math.PI,
          dt * 8
        );
      }
    }

    // 11. SMOOTH CHASE CAMERA
    const camDist = 6.8;
    const camHeight = 2.4;
    const targetCamX = playerPos.current.x + Math.sin(camYaw.current) * camDist * Math.cos(camPitch.current);
    const targetCamY = playerPos.current.y + camHeight + Math.sin(camPitch.current) * camDist;
    const targetCamZ = playerPos.current.z + Math.cos(camYaw.current) * camDist * Math.cos(camPitch.current);

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), dt * 10);
    camera.lookAt(playerPos.current.x, playerPos.current.y + 1.4, playerPos.current.z);

    // Sync state for render
    setRenderGrounded(isGrounded.current);
    const hSpeed = Math.hypot(playerVel.current.x, playerVel.current.z);
    setPlayerSpeed(hSpeed);

    // Broadcast position to all connected room peers
    if (gameMode === 'multiplayer') {
      broadcastMyPosition({
        x: playerPos.current.x,
        y: playerPos.current.y,
        z: playerPos.current.z,
        rotY: playerRef.current ? playerRef.current.rotation.y : 0,
        vy: playerVel.current.y,
        stage: currentStage,
        isDashing: renderDashing,
        isGrounded: isGrounded.current,
        speed: hSpeed,
      });
    }
  });

  return (
    <group ref={playerRef}>
      <CyberRunnerModel
        isDashing={renderDashing}
        isGrounded={renderGrounded}
        isDoubleJumping={renderDoubleJump}
        speed={playerSpeed}
        hasShield={hasShield}
        hasAntiGrav={antiGravityTimer > 0}
      />
    </group>
  );
}

// ==========================================
// 8. MAIN EXPORTED CANVAS COMPONENT
// ==========================================
export function ParkourCanvas() {
  const { courseData, currentCheckpointId, remotePlayers, selectedDifficulty } = useParkourStore();
  const config = DIFFICULTY_CONFIGS[selectedDifficulty];

  // Final summit checkpoint position
  const summitCheckpoint = courseData.checkpoints[courseData.checkpoints.length - 1];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#05060d]">
      <Canvas
        shadows
        camera={{ position: [0, 4, 10], fov: 65, near: 0.1, far: 1500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Dynamic Atmosphere & Sky Lighting per Difficulty */}
        <color attach="background" args={[config.bgAtmosphere]} />
        <fog attach="fog" args={[config.bgAtmosphere, 30, 480]} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.55} color={config.glowColor} />
        <directionalLight
          position={[40, 90, -100]}
          intensity={1.8}
          color="#c7d2fe"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={10}
          shadow-camera-far={250}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-camera-left={-50}
          shadow-camera-right={50}
        />
        <directionalLight position={[-30, 40, 50]} intensity={0.8} color={config.color} />

        {/* Space Cosmos Stars */}
        <Stars radius={300} depth={80} count={3800} factor={4} saturation={1} fade speed={1.5} />

        {/* Dynamic Floating Cyber Platforms for Active Course */}
        {courseData.platforms.map((p) => (
          <CoursePlatformItem key={p.id} platform={p} />
        ))}

        {/* Golden Speed Boost Rings */}
        {courseData.rings.map((ring) => (
          <GoldenRing
            key={ring.id}
            x={ring.x}
            y={ring.y}
            z={ring.z}
            radius={ring.radius}
            color={ring.color}
          />
        ))}

        {/* Collectible Items (Data Cores & Power-ups) */}
        {courseData.items.map((item) => (
          <CollectibleItemMesh key={item.id} item={item} />
        ))}

        {/* Course Checkpoint Beacons */}
        {courseData.checkpoints.map((cp) => (
          <CheckpointBeacon
            key={cp.id}
            cp={cp}
            isReached={currentCheckpointId >= cp.id}
          />
        ))}

        {/* Dynamic Summit Core Monolith */}
        {summitCheckpoint && (
          <SummitCoreMonolith
            x={summitCheckpoint.spawnX}
            y={summitCheckpoint.spawnY + 3}
            z={summitCheckpoint.spawnZ - 8}
            color={config.glowColor}
            title={`✦ ${config.name} SUMMIT ✦`}
          />
        )}

        {/* Multiplayer Connected Runners (1 to 4 Real Players) */}
        {remotePlayers.map((racer) => (
          <CompetitorRunnerItem key={racer.id} racer={racer} />
        ))}

        {/* Player & Physics Simulation */}
        <ParkourController />
      </Canvas>
    </div>
  );
}
