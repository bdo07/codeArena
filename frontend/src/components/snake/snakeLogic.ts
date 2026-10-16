export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };

export const DIR_OFFSETS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE_DIRS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

/**
 * Returns true if newDir is directly opposite to currentDir.
 * Used to prevent 180° instant reverse collisions into the snake's own neck.
 */
export function isOppositeDirection(currentDir: Direction, newDir: Direction): boolean {
  return OPPOSITE_DIRS[newDir] === currentDir;
}

/**
 * Computes the next head position based on current head and direction.
 */
export function getNextHead(head: Position, dir: Direction): Position {
  const offset = DIR_OFFSETS[dir];
  return { x: head.x + offset.x, y: head.y + offset.y };
}

/**
 * Checks whether a given position collides with the grid walls.
 */
export function checkWallCollision(pos: Position, gridSize: number): boolean {
  return pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize;
}

/**
 * Checks whether the next head collides with any body segments of the snake.
 * Note: The tail segment moves forward, so the very last segment is excluded.
 */
export function checkSelfCollision(nextHead: Position, snake: Position[]): boolean {
  return snake.some((segment, idx) => {
    if (idx === snake.length - 1) return false;
    return segment.x === nextHead.x && segment.y === nextHead.y;
  });
}

/**
 * Computes progressive game tick speed in milliseconds.
 */
export function calculateSpeed(
  applesEaten: number,
  baseSpeed: number = 130,
  minSpeed: number = 75
): number {
  return Math.max(minSpeed, baseSpeed - Math.floor(applesEaten / 3) * 5);
}

/**
 * Spawns food on a free cell that is not currently occupied by any snake segment.
 */
export function spawnFood(
  snake: Position[],
  gridSize: number,
  randomFn: () => number = Math.random
): Position {
  const occupied = new Set<string>();
  snake.forEach((s) => occupied.add(`${s.x},${s.y}`));

  const emptyCells: Position[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) {
    return { x: 0, y: 0 };
  }

  const index = Math.floor(randomFn() * emptyCells.length);
  return emptyCells[index];
}

/**
 * Calculates score from apples eaten. Each apple provides 10 points.
 */
export function calculateScore(applesEaten: number, pointsPerApple: number = 10): number {
  return Math.max(0, applesEaten * pointsPerApple);
}
