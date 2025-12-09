'use client';

import { useEffect, useRef, useState } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type PowerUp = { x: number; y: number; type: 'speed' | 'freeze' | 'power' };
type GhostMode = 'chase' | 'scatter' | 'frightened';
type Ghost = { 
  x: number; 
  y: number; 
  color: string; 
  mode: GhostMode;
  personality: 'aggressive' | 'ambush' | 'random' | 'patrol';
};

const GRID_SIZE = 25;
const CELL_SIZE = 20;
const BASE_SPEED = 200;

export default function PacManGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [speedBoost, setSpeedBoost] = useState(false);
  const [ghostsFrozen, setGhostsFrozen] = useState(false);
  
  const pacmanRef = useRef<Position>({ x: 12, y: 12 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const dotsRef = useRef<boolean[][]>([]);
  const powerPelletsRef = useRef<Position[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const ghostsRef = useRef<Ghost[]>([
    { x: 10, y: 10, color: '#ff0000', mode: 'chase', personality: 'aggressive' },
    { x: 14, y: 10, color: '#ffb8ff', mode: 'chase', personality: 'ambush' },
    { x: 10, y: 14, color: '#00ffff', mode: 'scatter', personality: 'random' },
    { x: 14, y: 14, color: '#ffb852', mode: 'scatter', personality: 'patrol' }
  ]);
  const animationFrameRef = useRef(0);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pacman-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize level
  const initializeLevel = () => {
    const dots: boolean[][] = [];
    const powerPellets: Position[] = [];
    const powerUps: PowerUp[] = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      dots[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        dots[y][x] = true;
      }
    }
    
    // Add power pellets in corners
    powerPellets.push(
      { x: 2, y: 2 },
      { x: GRID_SIZE - 3, y: 2 },
      { x: 2, y: GRID_SIZE - 3 },
      { x: GRID_SIZE - 3, y: GRID_SIZE - 3 }
    );
    
    // Add random power-ups based on level
    const powerUpCount = Math.min(level, 5);
    for (let i = 0; i < powerUpCount; i++) {
      const types: ('speed' | 'freeze' | 'power')[] = ['speed', 'freeze', 'power'];
      powerUps.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    
    dotsRef.current = dots;
    powerPelletsRef.current = powerPellets;
    powerUpsRef.current = powerUps;
  };

  useEffect(() => {
    initializeLevel();
  }, [level]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted && !gameOver) {
        setGameStarted(true);
      }
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
          nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
          nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
          nextDirectionRef.current = 'RIGHT';
          break;
        case 'r':
          if (gameOver) {
            resetGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  const resetGame = () => {
    pacmanRef.current = { x: 12, y: 12 };
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    ghostsRef.current = [
      { x: 10, y: 10, color: '#ff0000', mode: 'chase', personality: 'aggressive' },
      { x: 14, y: 10, color: '#ffb8ff', mode: 'chase', personality: 'ambush' },
      { x: 10, y: 14, color: '#00ffff', mode: 'scatter', personality: 'random' },
      { x: 14, y: 14, color: '#ffb852', mode: 'scatter', personality: 'patrol' }
    ];
    
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameStarted(false);
    setPowerMode(false);
    setSpeedBoost(false);
    setGhostsFrozen(false);
    initializeLevel();
  };

  const loseLife = () => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('pacman-highscore', score.toString());
      }
    } else {
      // Reset positions
      pacmanRef.current = { x: 12, y: 12 };
      ghostsRef.current = [
        { x: 10, y: 10, color: '#ff0000', mode: 'chase', personality: 'aggressive' },
        { x: 14, y: 10, color: '#ffb8ff', mode: 'chase', personality: 'ambush' },
        { x: 10, y: 14, color: '#00ffff', mode: 'scatter', personality: 'random' },
        { x: 14, y: 14, color: '#ffb852', mode: 'scatter', personality: 'patrol' }
      ];
      setPowerMode(false);
      setSpeedBoost(false);
      setGhostsFrozen(false);
    }
  };

  const checkLevelComplete = () => {
    let dotsRemaining = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (dotsRef.current[y]?.[x]) dotsRemaining++;
      }
    }
    
    if (dotsRemaining === 0 && powerPelletsRef.current.length === 0) {
      setLevel(l => l + 1);
      setScore(s => s + 1000 * level);
      pacmanRef.current = { x: 12, y: 12 };
      ghostsRef.current = [
        { x: 10, y: 10, color: '#ff0000', mode: 'chase', personality: 'aggressive' },
        { x: 14, y: 10, color: '#ffb8ff', mode: 'chase', personality: 'ambush' },
        { x: 10, y: 14, color: '#00ffff', mode: 'scatter', personality: 'random' },
        { x: 14, y: 14, color: '#ffb852', mode: 'scatter', personality: 'patrol' }
      ];
    }
  };

  // Advanced ghost AI
  const moveGhost = (ghost: Ghost): Ghost => {
    if (ghostsFrozen) return ghost;
    
    const newGhost = { ...ghost };
    const pacman = pacmanRef.current;
    
    if (ghost.mode === 'frightened') {
      // Run away from Pac-Man
      const dx = ghost.x - pacman.x;
      const dy = ghost.y - pacman.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        newGhost.x += dx > 0 ? 1 : -1;
      } else {
        newGhost.y += dy > 0 ? 1 : -1;
      }
    } else {
      switch (ghost.personality) {
        case 'aggressive':
          // Direct chase
          const dx = pacman.x - ghost.x;
          const dy = pacman.y - ghost.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            newGhost.x += dx > 0 ? 1 : -1;
          } else {
            newGhost.y += dy > 0 ? 1 : -1;
          }
          break;
          
        case 'ambush':
          // Try to get ahead of Pac-Man
          const targetX = pacman.x + (directionRef.current === 'LEFT' ? -4 : directionRef.current === 'RIGHT' ? 4 : 0);
          const targetY = pacman.y + (directionRef.current === 'UP' ? -4 : directionRef.current === 'DOWN' ? 4 : 0);
          const adx = targetX - ghost.x;
          const ady = targetY - ghost.y;
          if (Math.abs(adx) > Math.abs(ady)) {
            newGhost.x += adx > 0 ? 1 : -1;
          } else {
            newGhost.y += ady > 0 ? 1 : -1;
          }
          break;
          
        case 'random':
          // Random movement
          const moves = [
            { x: ghost.x + 1, y: ghost.y },
            { x: ghost.x - 1, y: ghost.y },
            { x: ghost.x, y: ghost.y + 1 },
            { x: ghost.x, y: ghost.y - 1 }
          ];
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          newGhost.x = randomMove.x;
          newGhost.y = randomMove.y;
          break;
          
        case 'patrol':
          // Patrol in a pattern
          if (ghost.mode === 'scatter') {
            newGhost.x += Math.sin(Date.now() / 1000) > 0 ? 1 : -1;
          } else {
            newGhost.y += Math.cos(Date.now() / 1000) > 0 ? 1 : -1;
          }
          break;
      }
    }
    
    newGhost.x = (newGhost.x + GRID_SIZE) % GRID_SIZE;
    newGhost.y = (newGhost.y + GRID_SIZE) % GRID_SIZE;
    
    return newGhost;
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const speed = speedBoost ? BASE_SPEED / 2 : BASE_SPEED - (level - 1) * 10;
    
    const gameLoop = setInterval(() => {
      // Update direction
      directionRef.current = nextDirectionRef.current;

      // Move Pac-Man
      const newPos = { ...pacmanRef.current };
      switch (directionRef.current) {
        case 'UP':
          newPos.y = (newPos.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'DOWN':
          newPos.y = (newPos.y + 1) % GRID_SIZE;
          break;
        case 'LEFT':
          newPos.x = (newPos.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'RIGHT':
          newPos.x = (newPos.x + 1) % GRID_SIZE;
          break;
      }
      pacmanRef.current = newPos;

      // Check dot collision
      if (dotsRef.current[newPos.y]?.[newPos.x]) {
        dotsRef.current[newPos.y][newPos.x] = false;
        setScore(s => s + 10);
      }

      // Check power pellet collision
      const pelletIndex = powerPelletsRef.current.findIndex(
        p => p.x === newPos.x && p.y === newPos.y
      );
      if (pelletIndex !== -1) {
        powerPelletsRef.current.splice(pelletIndex, 1);
        setScore(s => s + 50);
        setPowerMode(true);
        ghostsRef.current = ghostsRef.current.map(g => ({ ...g, mode: 'frightened' }));
        setTimeout(() => {
          setPowerMode(false);
          ghostsRef.current = ghostsRef.current.map(g => ({ ...g, mode: 'chase' }));
        }, 8000);
      }

      // Check power-up collision
      const powerUpIndex = powerUpsRef.current.findIndex(
        p => p.x === newPos.x && p.y === newPos.y
      );
      if (powerUpIndex !== -1) {
        const powerUp = powerUpsRef.current[powerUpIndex];
        powerUpsRef.current.splice(powerUpIndex, 1);
        setScore(s => s + 100);
        
        switch (powerUp.type) {
          case 'speed':
            setSpeedBoost(true);
            setTimeout(() => setSpeedBoost(false), 5000);
            break;
          case 'freeze':
            setGhostsFrozen(true);
            setTimeout(() => setGhostsFrozen(false), 4000);
            break;
          case 'power':
            setLives(l => l + 1);
            break;
        }
      }

      // Move ghosts
      ghostsRef.current = ghostsRef.current.map(moveGhost);

      // Check ghost collision
      for (let i = 0; i < ghostsRef.current.length; i++) {
        const ghost = ghostsRef.current[i];
        if (ghost.x === pacmanRef.current.x && ghost.y === pacmanRef.current.y) {
          if (powerMode) {
            // Eat ghost
            setScore(s => s + 200);
            ghostsRef.current[i] = {
              ...ghost,
              x: 12,
              y: 12,
              mode: 'chase'
            };
          } else {
            loseLife();
            break;
          }
        }
      }

      // Check level complete
      checkLevelComplete();

      // Draw
      draw();
    }, speed);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, level, powerMode, speedBoost, ghostsFrozen, lives]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw dots
    ctx.fillStyle = '#fff';
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (dotsRef.current[y]?.[x]) {
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Draw power pellets with glow
    for (const pellet of powerPelletsRef.current) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(
        pellet.x * CELL_SIZE + CELL_SIZE / 2,
        pellet.y * CELL_SIZE + CELL_SIZE / 2,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    // Draw power-ups
    for (const powerUp of powerUpsRef.current) {
      ctx.save();
      const colors = {
        speed: '#00ff00',
        freeze: '#00ffff',
        power: '#ff00ff'
      };
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors[powerUp.type];
      ctx.fillStyle = colors[powerUp.type];
      ctx.fillRect(
        powerUp.x * CELL_SIZE + CELL_SIZE / 4,
        powerUp.y * CELL_SIZE + CELL_SIZE / 4,
        CELL_SIZE / 2,
        CELL_SIZE / 2
      );
      ctx.restore();
    }

    // Draw Pac-Man with animation
    const mouthAngle = Math.abs(Math.sin(Date.now() / 100)) * 0.3;
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffff00';
    ctx.fillStyle = speedBoost ? '#00ff00' : '#ffff00';
    ctx.beginPath();
    
    // Rotate based on direction
    const centerX = pacmanRef.current.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pacmanRef.current.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.translate(centerX, centerY);
    
    const rotations = { RIGHT: 0, DOWN: Math.PI / 2, LEFT: Math.PI, UP: -Math.PI / 2 };
    ctx.rotate(rotations[directionRef.current]);
    
    ctx.arc(0, 0, CELL_SIZE / 2 - 2, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    // Draw ghosts with personality colors
    for (const ghost of ghostsRef.current) {
      ctx.save();
      
      if (ghost.mode === 'frightened') {
        ctx.fillStyle = '#0000ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0000ff';
      } else if (ghostsFrozen) {
        ctx.fillStyle = '#88ccff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#88ccff';
      } else {
        ctx.fillStyle = ghost.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ghost.color;
      }
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        Math.PI,
        0
      );
      ctx.lineTo(ghost.x * CELL_SIZE + CELL_SIZE - 2, ghost.y * CELL_SIZE + CELL_SIZE - 2);
      
      // Ghost skirt
      for (let i = 0; i < 3; i++) {
        ctx.lineTo(
          ghost.x * CELL_SIZE + CELL_SIZE - 2 - (i * CELL_SIZE / 3),
          ghost.y * CELL_SIZE + CELL_SIZE - 2 - (i % 2 === 0 ? 3 : 0)
        );
      }
      ctx.lineTo(ghost.x * CELL_SIZE + 2, ghost.y * CELL_SIZE + CELL_SIZE - 2);
      ctx.closePath();
      ctx.fill();
      
      // Ghost eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ghost.x * CELL_SIZE + CELL_SIZE / 2 - 4, ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2, 3, 0, Math.PI * 2);
      ctx.arc(ghost.x * CELL_SIZE + CELL_SIZE / 2 + 4, ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ghost.x * CELL_SIZE + CELL_SIZE / 2 - 3, ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2, 2, 0, Math.PI * 2);
      ctx.arc(ghost.x * CELL_SIZE + CELL_SIZE / 2 + 5, ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  };

  // Initial draw
  useEffect(() => {
    draw();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="mb-4 text-center">
        <h1 className="text-5xl font-bold mb-2 text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]">
          PAC-MAN
        </h1>
        <div className="text-sm text-gray-400">Advanced Edition</div>
      </div>
      
      <div className="flex gap-8 mb-4 text-lg">
        <div className="flex flex-col items-center">
          <div className="text-gray-400 text-sm">Score</div>
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-400 text-sm">High Score</div>
          <div className="text-2xl font-bold text-green-400">{highScore}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-400 text-sm">Level</div>
          <div className="text-2xl font-bold text-blue-400">{level}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-400 text-sm">Lives</div>
          <div className="text-2xl font-bold text-red-400">{'❤️'.repeat(lives)}</div>
        </div>
      </div>

      {(powerMode || speedBoost || ghostsFrozen) && (
        <div className="flex gap-4 mb-2 text-sm">
          {powerMode && <div className="px-3 py-1 bg-blue-600 rounded-full animate-pulse">POWER MODE</div>}
          {speedBoost && <div className="px-3 py-1 bg-green-600 rounded-full animate-pulse">SPEED BOOST</div>}
          {ghostsFrozen && <div className="px-3 py-1 bg-cyan-600 rounded-full animate-pulse">GHOSTS FROZEN</div>}
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="border-4 border-blue-500 mb-4 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)]"
      />
      
      <div className="text-center mb-4">
        <div className="flex gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Speed Boost</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
            <span>Freeze Ghosts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Extra Life</span>
          </div>
        </div>
      </div>
      
      {!gameStarted && !gameOver && (
        <div className="text-center bg-gray-800 p-6 rounded-lg border-2 border-blue-500">
          <p className="text-xl mb-3 font-bold">Press any arrow key to start</p>
          <p className="text-sm text-gray-400 mb-2">Use arrow keys or WASD to move</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>🔴 Red Ghost - Aggressive Chaser</p>
            <p>🩷 Pink Ghost - Ambush Expert</p>
            <p>🔵 Cyan Ghost - Random Patrol</p>
            <p>🟠 Orange Ghost - Pattern Patrol</p>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="text-center bg-gray-800 p-6 rounded-lg border-2 border-red-500">
          <p className="text-3xl text-red-500 mb-3 font-bold animate-pulse">GAME OVER!</p>
          <p className="text-xl mb-2">Final Score: <span className="text-yellow-400 font-bold">{score}</span></p>
          <p className="text-lg mb-2">Level Reached: <span className="text-blue-400 font-bold">{level}</span></p>
          {score > highScore && (
            <p className="text-lg text-green-400 mb-3 animate-pulse">🎉 NEW HIGH SCORE! 🎉</p>
          )}
          <p className="text-sm text-gray-400">Press R to restart</p>
        </div>
      )}
    </div>
  );
}










