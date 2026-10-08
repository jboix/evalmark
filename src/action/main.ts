/**
 * The action's entry point, bundled into `dist/index.js`.
 */
import { run } from './run.ts';

process.exitCode = await run();
