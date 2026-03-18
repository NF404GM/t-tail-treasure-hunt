import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Trail } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAudioAnalyzer, AudioControls } from '../hooks/useAudioAnalyzer';
import { Play, RotateCcw, Shield, Zap } from 'lucide-react';

const GRAVITY = -35;
const JUMP_FORCE = 16;
const BASE_SPEED = 15;
const BOOST_SPEED = 45;
const MAX_OBSTACLES = 15;
const MAX_PARTICLES = 200;

type ObstacleType = 'hurdle' | 'wall';

interface Obstacle {
  type: ObstacleType;
  x: number;
  z: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface GameState {
  status: 'idle' | 'playing' | 'gameover';
  score: number;
  speed: number;
  multiplier: number;
  isShielded: boolean;
  isBoosting: boolean;
  obstacles: Obstacle[];
  particles: Particle[];
}

function createInitialGameState(): GameState {
  return {
    status: 'idle',
    score: 0,
    speed: BASE_SPEED,
    multiplier: 1,
    isShielded: false,
    isBoosting: false,
    obstacles: [],
    particles: [],
  };
}

function spawnParticles(gs: GameState, x: number, y: number, z: number) {
  for (let i = 0; i < 20; i++) {
    if (gs.particles.length >= MAX_PARTICLES) break;
    gs.particles.push({
      x, y, z,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * 15,
      vz: (Math.random() - 0.5) * 15 + gs.speed * 0.8,
      life: 1.0,
    });
  }
}

interface HudState {
  shield: boolean;
  boost: boolean;
  multiplier: number;
}

const Particles = ({ gsRef }: { gsRef: React.RefObject<GameState> }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;

  useFrame((_, delta) => {
    const gs = gsRef.current;
    if (!meshRef.current || !gs || gs.status !== 'playing') return;

    let count = 0;
    for (let i = gs.particles.length - 1; i >= 0; i--) {
      const p = gs.particles[i];
      p.life -= delta * 1.5;
      if (p.life <= 0) {
        gs.particles.splice(i, 1);
        continue;
      }

      p.vy += GRAVITY * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      dummy.position.set(p.x, p.y, p.z);
      const scale = p.life;
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.x += delta * 10;
      dummy.rotation.y += delta * 10;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(count, dummy.matrix);
      count++;
    }
    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]} castShadow>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={2} toneMapped={false} />
    </instancedMesh>
  );
};

const Player = ({
  gsRef,
  getAudioControls,
  onGameOver,
  onHudUpdate,
}: {
  gsRef: React.RefObject<GameState>;
  getAudioControls: () => AudioControls;
  onGameOver: () => void;
  onHudUpdate: (hud: HudState) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const playerBox = useRef(new THREE.Box3());
  const obsBox = useRef(new THREE.Box3());
  const minVec = useRef(new THREE.Vector3());
  const maxVec = useRef(new THREE.Vector3());
  const trailColor = useRef(new THREE.Color('#00ffff')).current;
  const boostColor = useRef(new THREE.Color('#ffaa00')).current;
  const normalColor = useRef(new THREE.Color('#00ffff')).current;
  const hudThrottle = useRef(0);
  const lastHud = useRef({ shield: false, boost: false, multiplier: 1 });

  useFrame((_, delta) => {
    const gs = gsRef.current;
    if (!gs || gs.status !== 'playing' || !meshRef.current) return;

    const { jump, shield, boost } = getAudioControls();

    gs.isShielded = shield;
    gs.isBoosting = boost;

    if (jump && isGrounded.current) {
      velocityY.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    gs.speed = THREE.MathUtils.lerp(gs.speed, boost ? BOOST_SPEED : BASE_SPEED, delta * (boost ? 4 : 2));
    gs.multiplier = boost ? 2 : 1;

    if (shieldRef.current) {
      shieldRef.current.visible = shield;
      shieldRef.current.rotation.y += delta * 8;
      shieldRef.current.rotation.x += delta * 4;
      const scale = 1.2 + Math.sin(Date.now() / 100) * 0.1;
      shieldRef.current.scale.set(scale, scale, scale);
    }

    velocityY.current += GRAVITY * delta;
    meshRef.current.position.y += velocityY.current * delta;

    if (meshRef.current.position.y <= 0.5) {
      meshRef.current.position.y = 0.5;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    meshRef.current.rotation.x += delta * (gs.speed / 3);
    meshRef.current.rotation.y += delta * (gs.speed / 5);

    const targetColor = boost ? boostColor : normalColor;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.color.lerp(targetColor, delta * 8);
    mat.emissive.lerp(targetColor, delta * 8);
    trailColor.lerp(targetColor, delta * 8);

    playerBox.current.setFromObject(meshRef.current);
    playerBox.current.expandByScalar(-0.1);

    for (const obs of gs.obstacles) {
      if (!obs.active) continue;

      const height = obs.type === 'wall' ? 3 : 1;
      minVec.current.set(obs.x - 0.5, 0, obs.z - 0.5);
      maxVec.current.set(obs.x + 0.5, height, obs.z + 0.5);
      obsBox.current.set(minVec.current, maxVec.current);

      if (playerBox.current.intersectsBox(obsBox.current)) {
        if (shield) {
          obs.active = false;
          gs.score += 20 * gs.multiplier;
          spawnParticles(gs, obs.x, height / 2, obs.z);
        } else {
          gs.status = 'gameover';
          onGameOver();
        }
      }
    }

    // Push HUD updates at ~10fps instead of polling
    hudThrottle.current += delta;
    if (hudThrottle.current > 0.1) {
      hudThrottle.current = 0;
      const next = { shield, boost, multiplier: gs.multiplier };
      if (next.shield !== lastHud.current.shield || next.boost !== lastHud.current.boost || next.multiplier !== lastHud.current.multiplier) {
        lastHud.current = next;
        onHudUpdate(next);
      }
    }
  });

  return (
    <Trail width={1.5} length={8} color={trailColor} attenuation={(t) => t * t}>
      <group position={[0, 0.5, 0]}>
        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh ref={shieldRef} visible={false}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} wireframe toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>
    </Trail>
  );
};

const ObstaclesManager = ({ gsRef, onScoreUpdate }: { gsRef: React.RefObject<GameState>; onScoreUpdate: (score: number) => void }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const gs = gsRef.current;
    if (!gs || gs.status !== 'playing') return;

    for (const obs of gs.obstacles) {
      if (!obs.active) continue;

      obs.z += gs.speed * delta;

      if (obs.z > 5) {
        obs.active = false;
        gs.score += 10 * gs.multiplier;
        onScoreUpdate(gs.score);
      }
    }

    const activeObs = gs.obstacles.filter(o => o.active);
    const lastObs = activeObs[activeObs.length - 1];

    if (!lastObs || lastObs.z > -25) {
      const inactive = gs.obstacles.find(o => !o.active);
      const type = Math.random() > 0.5 ? 'wall' : 'hurdle';
      const zPos = -50 - Math.random() * 20;

      if (inactive) {
        inactive.active = true;
        inactive.type = type;
        inactive.z = zPos;
      } else if (gs.obstacles.length < MAX_OBSTACLES) {
        gs.obstacles.push({
          type,
          x: 0,
          z: zPos,
          active: true,
        });
      }
    }

    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        const obs = gs.obstacles[index];
        if (obs && obs.active) {
          const height = obs.type === 'wall' ? 3 : 1;
          child.scale.y = height;
          child.position.set(obs.x, height / 2, obs.z);
          child.visible = true;

          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (obs.type === 'wall') {
            mat.color.setHex(0xff0055);
            mat.emissive.setHex(0xff0055);
          } else {
            mat.color.setHex(0xffaa00);
            mat.emissive.setHex(0xffaa00);
          }
        } else {
          child.visible = false;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: MAX_OBSTACLES }).map((_, i) => (
        <mesh key={i} visible={false} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const MovingGrid = ({ gsRef }: { gsRef: React.RefObject<GameState> }) => {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((_, delta) => {
    const gs = gsRef.current;
    if (gridRef.current && gs && gs.status === 'playing') {
      gridRef.current.position.z += gs.speed * delta;
      if (gridRef.current.position.z > 10) {
        gridRef.current.position.z = 0;
      }
    }
  });

  return <gridHelper ref={gridRef} args={[60, 60, '#00ffff', '#0a192f']} position={[0, 0, 0]} />;
};

const CameraController = ({ gsRef }: { gsRef: React.RefObject<GameState> }) => {
  useFrame((state, delta) => {
    const gs = gsRef.current;
    if (gs && gs.status === 'playing') {
      const cam = state.camera as THREE.PerspectiveCamera;
      const targetFov = gs.isBoosting ? 90 : 50;
      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, delta * 4);

      if (gs.isBoosting) {
        cam.position.x = (Math.random() - 0.5) * 0.2;
        cam.position.y = 3 + (Math.random() - 0.5) * 0.2;
      } else {
        cam.position.x = THREE.MathUtils.lerp(cam.position.x, 0, delta * 5);
        cam.position.y = THREE.MathUtils.lerp(cam.position.y, 3, delta * 5);
      }
      cam.updateProjectionMatrix();
    }
  });
  return null;
};

export const EchoRushCanvas = () => {
  const { isListening, error: micError, startListening, stopListening, getAudioControls } = useAudioAnalyzer();
  const [uiState, setUiState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [hud, setHud] = useState<HudState>({ shield: false, boost: false, multiplier: 1 });
  const gsRef = useRef<GameState>(createInitialGameState());

  useEffect(() => {
    gsRef.current = createInitialGameState();
    return () => { stopListening(); };
  }, [stopListening]);

  const handleHudUpdate = useCallback((next: HudState) => {
    setHud(next);
  }, []);

  const startGame = async () => {
    if (!isListening) {
      await startListening();
    }
    const gs = gsRef.current;
    gs.status = 'playing';
    gs.score = 0;
    gs.speed = BASE_SPEED;
    gs.obstacles = [];
    gs.particles = [];
    setScore(0);
    setUiState('playing');
  };

  const handleGameOver = useCallback(() => {
    setScore(gsRef.current.score);
    setUiState('gameover');
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden bg-[#020617] shadow-2xl border-4 border-cyan-900/50">

      {/* Mic Error Banner */}
      {micError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-red-500/90 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl">
          {micError}
        </div>
      )}

      {/* HUD */}
      {uiState === 'playing' && (
        <>
          <div className="absolute top-6 right-6 z-10 flex flex-col items-end">
            <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
              {score}
            </div>
            {hud.multiplier > 1 && (
              <div className="text-2xl font-bold text-orange-400 animate-pulse drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]">
                {hud.multiplier}x MULTIPLIER
              </div>
            )}
          </div>

          <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${hud.shield ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800/50 text-slate-500'}`}>
              <Shield size={20} aria-hidden="true" /> SHIELD {hud.shield ? 'ACTIVE' : 'STANDBY'}
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${hud.boost ? 'bg-orange-500/20 text-orange-400 border border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-slate-800/50 text-slate-500'}`}>
              <Zap size={20} aria-hidden="true" /> BOOST {hud.boost ? 'ACTIVE' : 'STANDBY'}
            </div>
          </div>
        </>
      )}

      {/* Start Screen */}
      {uiState === 'idle' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
          <h2 className="text-6xl font-black text-cyan-400 mb-2 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
            EchoRush
          </h2>
          <div className="bg-slate-900/90 border-2 border-cyan-500/30 rounded-3xl p-8 max-w-xl text-center mb-8 shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Voice Controls</h3>
            <div className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                <div className="bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/50">
                  <span className="text-2xl font-black text-cyan-400">&quot;T!&quot;</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">JUMP (Hurdles)</h4>
                  <p className="text-slate-400">Say a sharp, loud &quot;T!&quot; to jump over orange hurdles.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/50">
                  <Shield className="text-emerald-400" size={32} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">SHIELD (Walls)</h4>
                  <p className="text-slate-400">Hum softly (mmmm) to activate your shield and smash red walls.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/50">
                  <Zap className="text-orange-400" size={32} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">BOOST (Speed)</h4>
                  <p className="text-slate-400">Yell loudly (AAAAH!) to boost speed and get 2x points!</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={startGame}
            className="flex items-center gap-3 px-10 py-5 bg-cyan-500 text-slate-950 text-3xl font-black rounded-full shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:bg-cyan-400 hover:scale-105 transition-all uppercase tracking-widest"
          >
            <Play fill="currentColor" size={32} aria-hidden="true" /> Play Now
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md p-6">
          <h2 className="text-7xl font-black text-red-500 mb-4 tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,0,0,0.8)]">
            CRASH!
          </h2>
          <div className="bg-black/50 px-12 py-6 rounded-3xl border border-red-500/30 mb-8 text-center">
            <p className="text-slate-400 text-xl font-bold uppercase tracking-widest mb-2">Final Score</p>
            <p className="text-6xl text-white font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{score}</p>
          </div>
          <button
            onClick={startGame}
            className="flex items-center gap-3 px-10 py-5 bg-red-500 text-white text-3xl font-black rounded-full shadow-[0_0_30px_rgba(255,0,0,0.6)] hover:bg-red-400 hover:scale-105 transition-all uppercase tracking-widest"
          >
            <RotateCcw size={32} aria-hidden="true" /> Try Again
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ powerPreference: "high-performance", antialias: false }}
      >
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 5, 25]} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

        <Stars radius={50} depth={50} count={1500} factor={4} saturation={0} fade speed={2} />

        <MovingGrid gsRef={gsRef} />
        <CameraController gsRef={gsRef} />

        {/* Floor Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[60, 150]} />
          <meshStandardMaterial color="#020617" />
        </mesh>

        <Player gsRef={gsRef} getAudioControls={getAudioControls} onGameOver={handleGameOver} onHudUpdate={handleHudUpdate} />
        <ObstaclesManager gsRef={gsRef} onScoreUpdate={setScore} />
        <Particles gsRef={gsRef} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.0} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
