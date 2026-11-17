/**
 * Automated Verification for SeededRandom and SimplexNoise (Step 2.1)
 */
import { SeededRandom } from './SeededRandom.ts';
import { SimplexNoise } from './SimplexNoise.ts';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`[Assertion Failed] ${msg}`);
}

export function runNoiseVerification(): boolean {
  console.log('[Test] Running TerraForge SeededRandom & SimplexNoise Verification...');

  // 1. SeededRandom Determinism & Uniformity
  const rng1 = new SeededRandom(12345);
  const rng2 = new SeededRandom(12345);

  for (let i = 0; i < 50; i++) {
    const val1 = rng1.next();
    const val2 = rng2.next();
    assert(val1 === val2, `SeededRandom output mismatch at iteration ${i}: ${val1} !== ${val2}`);
  }

  // Statistical average test (1 to 6 die roll)
  let sum = 0;
  const rollCount = 10000;
  for (let i = 0; i < rollCount; i++) {
    sum += rng1.nextInt(1, 6);
  }
  const avg = sum / rollCount;
  assert(Math.abs(avg - 3.5) < 0.1, `Dice roll average out of uniform bounds: ${avg}`);

  // 2. SimplexNoise Determinism Test (Identical Seeds)
  const noiseA = new SimplexNoise(987654321);
  const noiseB = new SimplexNoise(987654321);

  const sampleCoords = [
    [0.0, 0.0],
    [12.34, 56.78],
    [-45.12, 89.23],
    [100.5, -200.7],
    [0.123, 0.456]
  ];

  for (const [x, y] of sampleCoords) {
    const valA = noiseA.noise2D(x, y);
    const valB = noiseB.noise2D(x, y);
    assert(
      Math.abs(valA - valB) < 1e-12,
      `SimplexNoise determinism mismatch at (${x}, ${y}): ${valA} !== ${valB}`
    );

    const fbmA = noiseA.fbm2D(x, y, 4);
    const fbmB = noiseB.fbm2D(x, y, 4);
    assert(
      Math.abs(fbmA - fbmB) < 1e-12,
      `SimplexNoise FBM determinism mismatch at (${x}, ${y}): ${fbmA} !== ${fbmB}`
    );
  }

  // 3. Different Seeds Produce Distinct Output
  const noiseDiff = new SimplexNoise(1111);
  let differentCount = 0;
  for (const [x, y] of sampleCoords) {
    if (Math.abs(noiseA.noise2D(x, y) - noiseDiff.noise2D(x, y)) > 0.01) {
      differentCount++;
    }
  }
  assert(differentCount >= sampleCoords.length - 1, 'Different seeds should produce different noise outputs');

  // 4. Output Range Clamping [-1.0, 1.0] across 2000 points
  for (let i = 0; i < 2000; i++) {
    const rx = (rng1.next() - 0.5) * 1000;
    const ry = (rng1.next() - 0.5) * 1000;

    const val = noiseA.noise2D(rx, ry);
    assert(val >= -1.0 && val <= 1.0, `noise2D out of bounds [-1, 1]: ${val} at (${rx}, ${ry})`);

    const fbmVal = noiseA.fbm2D(rx, ry, 5);
    assert(fbmVal >= -1.0 && fbmVal <= 1.0, `fbm2D out of bounds [-1, 1]: ${fbmVal} at (${rx}, ${ry})`);
  }

  // 5. Mathematical Continuity (Smoothness)
  for (let i = 0; i < 50; i++) {
    const bx = rng1.next() * 100;
    const by = rng1.next() * 100;
    const v1 = noiseA.noise2D(bx, by);
    const v2 = noiseA.noise2D(bx + 0.005, by);
    const delta = Math.abs(v2 - v1);
    assert(delta < 0.08, `Noise has discontinuous sharp jump: delta=${delta} at (${bx}, ${by})`);
  }

  console.log('[Test] SeededRandom & SimplexNoise tests PASSED successfully!');
  return true;
}

if (typeof window === 'undefined') {
  runNoiseVerification();
}
