/**
 * Water Simulation Web Worker
 *
 * Runs the pipe-model shallow water solver off the main thread
 * to keep rendering at 60fps. Communicates via Transferable
 * ArrayBuffers for zero-copy data transfer.
 *
 * Protocol:
 *   Main → Worker: { type: 'init', grid, config }
 *                   { type: 'step', steps, raining }
 *   Worker → Main: { type: 'result', depth, velX, velY }
 *                   { type: 'ready' }
 *
 * Usage with Vite:
 *   const worker = new Worker(
 *     new URL('./simulation/WaterWorker.ts', import.meta.url),
 *     { type: 'module' }
 *   );
 */

/// <reference lib="webworker" />

import { simulateStep, computeStableDt, applyFriction, addRainfall, applyEvaporation } from './ShallowWater';
import { createWaterGrid } from './types';
import type { WaterGrid, WaterConfig } from './types';

// ─── Worker State ────────────────────────────────────────────

let grid: WaterGrid | null = null;
let config: WaterConfig | null = null;

// ─── Message Types ───────────────────────────────────────────

export interface InitMessage {
  type: 'init';
  width: number;
  height: number;
  terrain: Float32Array;
  terrainType: Uint8Array;
  depth: Float32Array;
  config: WaterConfig;
}

export interface StepMessage {
  type: 'step';
  steps: number;
  raining: boolean;
}

export interface ResultMessage {
  type: 'result';
  depth: Float32Array;
  velX: Float32Array;
  velY: Float32Array;
}

export interface ReadyMessage {
  type: 'ready';
}

export type WorkerInMessage = InitMessage | StepMessage;
export type WorkerOutMessage = ResultMessage | ReadyMessage;

// ─── Message Handler ─────────────────────────────────────────

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  if (msg.type === 'init') {
    // Initialize grid from transferred buffers
    grid = createWaterGrid(msg.width, msg.height);
    grid.terrain.set(msg.terrain);
    grid.terrainType.set(msg.terrainType);
    grid.depth.set(msg.depth);
    config = msg.config;

    const ready: ReadyMessage = { type: 'ready' };
    self.postMessage(ready);
    return;
  }

  if (msg.type === 'step') {
    if (!grid || !config) return;

    const { steps, raining } = msg;

    for (let s = 0; s < steps; s++) {
      const dt = Math.min(0.05, computeStableDt(grid, config));

      if (raining) {
        addRainfall(grid, config.rainRate, dt);
      }

      simulateStep(grid, config, dt);
      applyFriction(grid, config, dt);
      applyEvaporation(grid, config.evapRate, dt);
    }

    // Copy buffers for transfer (originals stay with worker)
    const depthCopy = new Float32Array(grid.depth);
    const velXCopy = new Float32Array(grid.velX);
    const velYCopy = new Float32Array(grid.velY);

    const result: ResultMessage = {
      type: 'result',
      depth: depthCopy,
      velX: velXCopy,
      velY: velYCopy,
    };

    self.postMessage(result, {
      transfer: [depthCopy.buffer, velXCopy.buffer, velYCopy.buffer],
    } as unknown as StructuredSerializeOptions);
  }
};
