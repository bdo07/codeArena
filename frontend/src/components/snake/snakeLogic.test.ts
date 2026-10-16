import {
  isOppositeDirection,
  getNextHead,
  checkWallCollision,
  checkSelfCollision,
  calculateSpeed,
  spawnFood,
  calculateScore,
  Position,
} from './snakeLogic';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('🧪 Running Snake Game logic unit tests...');

// 1. Opposite Direction Prevention
assert(isOppositeDirection('UP', 'DOWN'), 'UP and DOWN must be opposite');
assert(isOppositeDirection('DOWN', 'UP'), 'DOWN and UP must be opposite');
assert(isOppositeDirection('LEFT', 'RIGHT'), 'LEFT and RIGHT must be opposite');
assert(isOppositeDirection('RIGHT', 'LEFT'), 'RIGHT and LEFT must be opposite');
assert(!isOppositeDirection('UP', 'LEFT'), 'UP and LEFT must NOT be opposite');
assert(!isOppositeDirection('UP', 'RIGHT'), 'UP and RIGHT must NOT be opposite');
assert(!isOppositeDirection('DOWN', 'LEFT'), 'DOWN and LEFT must NOT be opposite');
console.log('  ✓ Opposite direction logic passes');

// 2. Next Head Position
const head: Position = { x: 5, y: 5 };
assert(getNextHead(head, 'UP').y === 4 && getNextHead(head, 'UP').x === 5, 'Moving UP decrements Y');
assert(getNextHead(head, 'DOWN').y === 6 && getNextHead(head, 'DOWN').x === 5, 'Moving DOWN increments Y');
assert(getNextHead(head, 'LEFT').x === 4 && getNextHead(head, 'LEFT').y === 5, 'Moving LEFT decrements X');
assert(getNextHead(head, 'RIGHT').x === 6 && getNextHead(head, 'RIGHT').y === 5, 'Moving RIGHT increments X');
console.log('  ✓ Head calculation passes');

// 3. Wall Collision
assert(checkWallCollision({ x: -1, y: 5 }, 20), 'Left wall collision detected');
assert(checkWallCollision({ x: 20, y: 5 }, 20), 'Right wall collision detected');
assert(checkWallCollision({ x: 5, y: -1 }, 20), 'Top wall collision detected');
assert(checkWallCollision({ x: 5, y: 20 }, 20), 'Bottom wall collision detected');
assert(!checkWallCollision({ x: 0, y: 0 }, 20), 'Top-left corner is inside bounds');
assert(!checkWallCollision({ x: 19, y: 19 }, 20), 'Bottom-right corner is inside bounds');
console.log('  ✓ Wall collision detection passes');

// 4. Self Collision
const snake: Position[] = [
  { x: 5, y: 5 }, // head
  { x: 5, y: 6 },
  { x: 6, y: 6 },
  { x: 6, y: 5 },
  { x: 6, y: 4 }, // tail
];
// Next head into body segment (5,6)
assert(checkSelfCollision({ x: 5, y: 6 }, snake), 'Collision with body detected');
// Next head into free cell
assert(!checkSelfCollision({ x: 4, y: 5 }, snake), 'Free cell is not self collision');
// Next head into tail segment (6,4): allowed because tail moves away when not eating
assert(!checkSelfCollision({ x: 6, y: 4 }, snake), 'Moving into departing tail segment is safe');
console.log('  ✓ Self collision detection passes');

// 5. Food Placement
const crowdedSnake: Position[] = [];
for (let x = 0; x < 20; x++) {
  for (let y = 0; y < 20; y++) {
    if (x === 10 && y === 10) continue; // leave only (10, 10) open
    crowdedSnake.push({ x, y });
  }
}
const spawned = spawnFood(crowdedSnake, 20);
assert(spawned.x === 10 && spawned.y === 10, 'Spawned food must only pick the available cell');
console.log('  ✓ Food spawning safety passes');

// 6. Speed & Score Calculation
assert(calculateScore(0) === 0, '0 apples = 0 score');
assert(calculateScore(5) === 50, '5 apples = 50 score');
assert(calculateScore(12) === 120, '12 apples = 120 score');

assert(calculateSpeed(0) === 130, 'Base speed is 130ms');
assert(calculateSpeed(3) === 125, 'Speed accelerates after 3 apples');
assert(calculateSpeed(30) === 80, 'Speed accelerates progressively');
assert(calculateSpeed(100) === 75, 'Speed does not go below min speed of 75ms');
console.log('  ✓ Speed and score scaling passes');

console.log('🎉 All Snake Game logic tests passed successfully!');
