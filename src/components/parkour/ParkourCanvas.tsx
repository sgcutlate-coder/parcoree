'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { COURSE_PLATFORMS, COURSE_RINGS, COURSE_CHECKPOINTS, CoursePlatform } from '@/lib/parkourCourse';
import { useParkourStore } from '@/lib/parkourStore';
import { parkourAudio } from '@/lib/parkourAudio';

// ==========================================
// 1. CYBER RUNNER CHARACTER MODEL
// ==========================================
interface PlayerMeshProps {
  isDashing: boolean;
  isGrounded: boolean;
  isDoubleJumping: boolean;
  speed: number;
  primaryColor?: string;
  glowColor?: string;
}

function CyberRunnerModel({ isDashing, isGrounded, isDoubleJumping, speed, primaryColor = '#00ffff', glowColor = '#00e5ff' }: PlayerMeshProps) {
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
        <meshBasicMaterial color={primaryColor} />
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
function CompetitorRunnerItem({ racer }: { racer: import('@/lib/parkourStore').CompetitorRacer }) {
  return (
    <group position={[racer.x, racer.y, racer.z]}>
      {/* 3D Overhead Callsign Nametag */}
      <Text
        position={[0, 2.25, 0]}
        fontSize={0.3}
        color={racer.color}
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
// 2. COURSE PLATFORM RENDERER
// ==========================================
interface PlatformMeshProps {
  platform: CoursePlatform;
}

const CoursePlatformItem = React.memo(function CoursePlatformItem({ platform }: PlatformMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isJumpPad = platform.type === 'jump_pad';
  const glow = platform.glowColor || '#00ffff';

  useFrame(({ clock }) => {
    if (groupRef.current && platform.type === 'moving' && platform.moveRange) {
      const t = clock.getElapsedTime();
      const offset = Math.sin(t * platform.moveRange.speed) * platform.moveRange.dist;
      if (platform.moveRange.axis === 'x') groupRef.current.position.x = platform.x + offset;
      if (platform.moveRange.axis === 'y') groupRef.current.position.y = platform.y + offset;
      if (platform.moveRange.axis === 'z') groupRef.current.position.z = platform.z + offset;
    }
  });

  return (
    <group ref={groupRef} position={[platform.x, platform.y, platform.z]}>
      {/* Main Solid Metallic Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[platform.sx, platform.sy, platform.sz]} />
        <meshStandardMaterial
          color={platform.color || '#0d1527'}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Top Surface Cyber Tech Plate */}
      <mesh position={[0, platform.sy / 2 + 0.01, 0]}>
        <boxGeometry args={[platform.sx - 0.2, 0.02, platform.sz - 0.2]} />
        <meshStandardMaterial
          color="#152238"
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Radiant Glowing Neon Edge Frame */}
      <mesh position={[0, platform.sy / 2 + 0.02, 0]}>
        <boxGeometry args={[platform.sx, 0.04, platform.sz]} />
        <meshBasicMaterial
          color={glow}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Corner Neon Light Accent Dots */}
      <mesh position={[platform.sx / 2 - 0.2, platform.sy / 2 + 0.03, platform.sz / 2 - 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh position={[-platform.sx / 2 + 0.2, platform.sy / 2 + 0.03, platform.sz / 2 - 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh position={[platform.sx / 2 - 0.2, platform.sy / 2 + 0.03, -platform.sz / 2 + 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh position={[-platform.sx / 2 + 0.2, platform.sy / 2 + 0.03, -platform.sz / 2 + 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={glow} />
      </mesh>

      {/* Kinetic Jump Pad Pulsing Aura */}
      {isJumpPad && (
        <group position={[0, platform.sy / 2 + 0.06, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[Math.min(platform.sx, platform.sz) * 0.38, 24]} />
            <meshBasicMaterial color={glow} transparent opacity={0.7} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.min(platform.sx, platform.sz) * 0.4, Math.min(platform.sx, platform.sz) * 0.45, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight color={glow} distance={7} intensity={3.5} />
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
      {/* Outer Torus */}
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
      {/* Inner Energy Field */}
      <mesh>
        <circleGeometry args={[radius * 0.95, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={color} distance={10} intensity={2} />
    </group>
  );
}

// ==========================================
// 4. CHECKPOINT BEACONS
// ==========================================
function CheckpointBeacon({
  cp,
  isReached,
}: {
  cp: typeof COURSE_CHECKPOINTS[0];
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
// 5. STAGE 10 SUMMIT CORE MONOLITH
// ==========================================
function SummitCoreMonolith() {
  const coreRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = clock.getElapsedTime() * 0.8;
    }
  });

  return (
    <group position={[0, 186, -658]}>
      {/* Grand Orbiting Core Rings */}
      <group ref={coreRef}>
        <mesh rotation={[0.4, 0.4, 0]}>
          <torusGeometry args={[5, 0.25, 16, 48]} />
          <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.5} />
        </mesh>
        <mesh rotation={[-0.4, 0.6, 0]}>
          <torusGeometry args={[6.2, 0.25, 16, 48]} />
          <meshStandardMaterial color="#38bdf8" emissive="#00ffff" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* Floating Summit Energy Crystal */}
      <Float speed={3} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[0, 3, 0]}>
          <icosahedronGeometry args={[2.2, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#818cf8"
            emissiveIntensity={2}
            roughness={0.1}
          />
        </mesh>
      </Float>

      {/* Beacon Light */}
      <pointLight color="#818cf8" distance={40} intensity={8} />

      {/* Floating Victory Text */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        ✦ NEON CORE SUMMIT ✦
      </Text>
    </group>
  );
}

// ==========================================
// 6. MAIN PARKOUR GAME CONTROLLER
// ==========================================
function ParkourController() {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);

  // Zustand State & Actions
  const {
    currentCheckpointId,
    reachCheckpoint,
    triggerRespawn,
    triggerDash,
    setDoubleJumpAvailable,
    tickTimer,
    platformMode,
    joystickVector,
    isJumpHeld,
    isDashHeld,
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
  const camYaw = useRef(0); // Facing forward into negative Z towards Summit
  const camPitch = useRef(0.25);
  const isDraggingCam = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Keyboard State
  const keys = useRef<{ [key: string]: boolean }>({});

  // Touch look rotation handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      // Space Jump & Double Jump
      if (e.code === 'Space') {
        e.preventDefault();
        handleJumpAction();
      }

      // Shift Air Dash
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyQ' || e.code === 'KeyE') {
        e.preventDefault();
        handleDashAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    // Mouse Camera Drag
    const handleMouseDown = (e: MouseEvent) => {
      // Right click or drag
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
      // Clamp pitch
      camPitch.current = Math.max(-0.4, Math.min(1.1, camPitch.current));
    };

    const handleMouseUp = () => {
      isDraggingCam.current = false;
    };

    // Touch Cam Look (for mobile touch swipe on the right side of the screen)
    let touchId: number | null = null;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // If touch is on right half of screen, use it for camera orbit
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

  // Jump logic
  const handleJumpAction = () => {
    if (isGrounded.current) {
      playerVel.current.y = 15.5;
      isGrounded.current = false;
      doubleJumpUsed.current = false;
      setDoubleJumpAvailable(true);
      parkourAudio.playJump();
    } else if (!doubleJumpUsed.current) {
      playerVel.current.y = 15.0;
      doubleJumpUsed.current = true;
      setDoubleJumpAvailable(false);
      setRenderDoubleJump(true);
      setTimeout(() => setRenderDoubleJump(false), 300);
      parkourAudio.playDoubleJump();
    }
  };

  // Dash logic
  const handleDashAction = () => {
    const success = triggerDash();
    if (!success) return;

    isDashing.current = true;
    dashTimer.current = 0.28; // Duration of dash
    setRenderDashing(true);

    // Forward direction based on current camera yaw
    const forward = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current)).normalize();
    dashDirection.current.copy(forward);

    playerVel.current.x = forward.x * 24;
    playerVel.current.z = forward.z * 24;
    playerVel.current.y = 4; // slight upward lift
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

  // Teleport listener from store
  useEffect(() => {
    const unsub = useParkourStore.subscribe((state, prevState) => {
      if (state.respawnPosition !== prevState.respawnPosition) {
        playerPos.current.set(state.respawnPosition[0], state.respawnPosition[1] + 1, state.respawnPosition[2]);
        playerVel.current.set(0, 0, 0);
        isGrounded.current = true;
      }
    });
    return unsub;
  }, []);

  const updateCompetitors = useParkourStore((s) => s.updateCompetitors);

  // Frame Loop
  useFrame(({ clock }, delta) => {
    // Clamp delta to prevent physics explosion on lag spikes
    const dt = Math.min(delta, 0.05);
    const clockTime = clock.getElapsedTime();

    tickTimer(dt);
    updateCompetitors(dt, playerPos.current.x, playerPos.current.y, playerPos.current.z);

    // 1. INPUT MOVEMENT CALCULATION
    const input = new THREE.Vector2(0, 0);

    // PC Keyboard Input
    if (keys.current['KeyW'] || keys.current['ArrowUp']) input.y += 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) input.y -= 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) input.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) input.x += 1;

    // Mobile Virtual Joystick Input (blended)
    if (platformMode === 'mobile' || joystickVector.x !== 0 || joystickVector.y !== 0) {
      input.x += joystickVector.x;
      input.y += joystickVector.y;
    }

    if (input.length() > 1) input.normalize();

    // Direction relative to camera yaw
    const forwardVec = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current));
    const rightVec = new THREE.Vector3(Math.cos(camYaw.current), 0, -Math.sin(camYaw.current));
    const moveDir = new THREE.Vector3()
      .addScaledVector(forwardVec, input.y)
      .addScaledVector(rightVec, input.x);

    const targetSpeed = 13.5;

    // 2. HORIZONTAL VELOCITY UPDATE
    if (isDashing.current) {
      dashTimer.current -= dt;
      if (dashTimer.current <= 0) {
        isDashing.current = false;
        setRenderDashing(false);
      }
    } else {
      if (moveDir.length() > 0.05) {
        // Accelerate
        const accel = isGrounded.current ? 45 : 24;
        playerVel.current.x = THREE.MathUtils.lerp(playerVel.current.x, moveDir.x * targetSpeed, dt * 10);
        playerVel.current.z = THREE.MathUtils.lerp(playerVel.current.z, moveDir.z * targetSpeed, dt * 10);
      } else {
        // Decelerate / Friction
        const friction = isGrounded.current ? 0.82 : 0.94;
        playerVel.current.x *= Math.pow(friction, dt * 60);
        playerVel.current.z *= Math.pow(friction, dt * 60);
      }
    }

    // 3. GRAVITY & VERTICAL PHYSICS
    const gravity = -38;
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

    for (let i = 0; i < COURSE_PLATFORMS.length; i++) {
      const p = COURSE_PLATFORMS[i];

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
        // If falling down and feet cross the platform top
        if (playerPos.current.y >= topY - 0.25 && nextY <= topY + 0.35 && playerVel.current.y <= 0) {
          landedOnPlatform = p;
          standingTopY = topY;
          break;
        }
        // If already standing on top
        if (isGrounded.current && Math.abs(playerPos.current.y - topY) < 0.45) {
          landedOnPlatform = p;
          standingTopY = topY;
          break;
        }
      }
    }

    if (landedOnPlatform) {
      // Landed
      playerPos.current.x = nextX;
      playerPos.current.z = nextZ;
      playerPos.current.y = standingTopY;

      // Check if it's a Jump Pad!
      if (landedOnPlatform.type === 'jump_pad') {
        const bounce = landedOnPlatform.bounceStrength || 24;
        playerVel.current.y = bounce;
        isGrounded.current = false;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
        parkourAudio.playJumpPad();
      } else {
        playerVel.current.y = 0;
        isGrounded.current = true;
        doubleJumpUsed.current = false;
        setDoubleJumpAvailable(true);
      }
    } else {
      // In air
      playerPos.current.x = nextX;
      playerPos.current.y = nextY;
      playerPos.current.z = nextZ;
      isGrounded.current = false;
    }

    // 6. GOLDEN SPEED RINGS DETECTION
    for (let r = 0; r < COURSE_RINGS.length; r++) {
      const ring = COURSE_RINGS[r];
      const dist = Math.hypot(
        playerPos.current.x - ring.x,
        playerPos.current.y - ring.y,
        playerPos.current.z - ring.z
      );
      if (dist < ring.radius + 0.8) {
        // Apply ring launch boost
        playerVel.current.x = ring.boostVelocity.x;
        playerVel.current.y = ring.boostVelocity.y;
        playerVel.current.z = ring.boostVelocity.z;
        isGrounded.current = false;
        doubleJumpUsed.current = false;
        parkourAudio.playRingBoost();
        break;
      }
    }

    // 7. CHECKPOINT TRIGGER DETECTION
    for (let c = 0; c < COURSE_CHECKPOINTS.length; c++) {
      const cp = COURSE_CHECKPOINTS[c];
      const dist = Math.hypot(
        playerPos.current.x - cp.spawnX,
        playerPos.current.y - cp.spawnY,
        playerPos.current.z - cp.spawnZ
      );
      if (dist < 7.0 && isGrounded.current) {
        reachCheckpoint(cp.id);
      }
    }

    // 8. VOID DETECTION & INSTANT RESPAWN
    // If player falls below checkpoint ground by 14 units
    const currentCp = COURSE_CHECKPOINTS.find((c) => c.id === currentCheckpointId) || COURSE_CHECKPOINTS[0];
    if (playerPos.current.y < currentCp.spawnY - 14 || playerPos.current.y < -12) {
      const respawnPoint = triggerRespawn();
      playerPos.current.set(respawnPoint[0], respawnPoint[1] + 1.2, respawnPoint[2]);
      playerVel.current.set(0, 0, 0);
      isGrounded.current = true;
    }

    // 9. UPDATE PLAYER MESH
    if (playerRef.current) {
      playerRef.current.position.copy(playerPos.current);

      // Facing orientation: Rotate runner to face movement direction or camera yaw
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

    // 10. SMOOTH CHASE CAMERA
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
  });

  return (
    <>
      {/* Player Group */}
      <group ref={playerRef}>
        <CyberRunnerModel
          isDashing={renderDashing}
          isGrounded={renderGrounded}
          isDoubleJumping={renderDoubleJump}
          speed={playerSpeed}
        />
      </group>
    </>
  );
}

// ==========================================
// 7. MAIN EXPORTED CANVAS COMPONENT
// ==========================================
export function ParkourCanvas() {
  const currentCheckpointId = useParkourStore((s) => s.currentCheckpointId);
  const competitors = useParkourStore((s) => s.competitors);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#05060d]">
      <Canvas
        shadows
        camera={{ position: [0, 4, 10], fov: 65, near: 0.1, far: 1200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Atmosphere & Sky Lighting */}
        <color attach="background" args={['#04060f']} />
        <fog attach="fog" args={['#070a1a', 30, 400]} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.55} color="#88a0e0" />
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
        <directionalLight position={[-30, 40, 50]} intensity={0.8} color="#00e5ff" />

        {/* Space Cosmos Stars */}
        <Stars radius={250} depth={70} count={3500} factor={4} saturation={1} fade speed={1.5} />

        {/* Floating Cyber Platforms */}
        {COURSE_PLATFORMS.map((p) => (
          <CoursePlatformItem key={p.id} platform={p} />
        ))}

        {/* Golden Speed Boost Rings */}
        {COURSE_RINGS.map((ring) => (
          <GoldenRing
            key={ring.id}
            x={ring.x}
            y={ring.y}
            z={ring.z}
            radius={ring.radius}
            color={ring.color}
          />
        ))}

        {/* Course Checkpoint Beacons */}
        {COURSE_CHECKPOINTS.map((cp) => (
          <CheckpointBeacon
            key={cp.id}
            cp={cp}
            isReached={currentCheckpointId >= cp.id}
          />
        ))}

        {/* Stage 10 Summit Monolith */}
        <SummitCoreMonolith />

        {/* Multiplayer Competitor Runners (1 to 4 Players) */}
        {competitors.map((racer) => (
          <CompetitorRunnerItem key={racer.id} racer={racer} />
        ))}

        {/* Player & Physics Simulation */}
        <ParkourController />
      </Canvas>
    </div>
  );
}
