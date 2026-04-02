#!/usr/bin/env pnpm dlx tsx

/**
 * Anvara Take-Home Project Reset Script
 *
 * This script resets the project to a clean state by removing:
 * - node_modules and pnpm cache
 * - Build outputs (.next, dist, build)
 * - Setup fingerprint
 * - Optionally: environment and database
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
} as const;

type ColorKey = keyof typeof colors;

function log(message: string, color: ColorKey = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function logError(message: string): void {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function removeDir(path: string, name: string): void {
  if (existsSync(path)) {
    try {
      rmSync(path, { recursive: true, force: true });
      logSuccess(`Removed ${name}`);
    } catch (error) {
      logWarning(`Failed to remove ${name}: ${error}`);
    }
  }
}

async function main(): Promise<void> {
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════╗
║             Anvara Take-Home Project Reset               ║
╚══════════════════════════════════════════════════════════╝${colors.reset}

This will clean the project and remove build artifacts.
`);

  // Remove node_modules
  log('\nCleaning dependencies...');
  removeDir(join(ROOT_DIR, 'node_modules'), 'root node_modules');
  removeDir(join(ROOT_DIR, 'apps/frontend/node_modules'), 'frontend node_modules');
  removeDir(join(ROOT_DIR, 'apps/backend/node_modules'), 'backend node_modules');
  removeDir(join(ROOT_DIR, 'packages/config/node_modules'), 'config node_modules');
  removeDir(join(ROOT_DIR, 'packages/eslint-config/node_modules'), 'eslint-config node_modules');
  removeDir(
    join(ROOT_DIR, 'packages/prettier-config/node_modules'),
    'prettier-config node_modules'
  );

  // Remove pnpm store
  removeDir(join(ROOT_DIR, '.pnpm-store'), '.pnpm-store');

  // Remove build outputs
  log('\nCleaning build outputs...');
  removeDir(join(ROOT_DIR, 'apps/frontend/.next'), '.next (frontend)');
  removeDir(join(ROOT_DIR, 'apps/frontend/dist'), 'dist (frontend)');
  removeDir(join(ROOT_DIR, 'apps/backend/dist'), 'dist (backend)');
  removeDir(join(ROOT_DIR, 'apps/backend/build'), 'build (backend)');

  // Remove generated files
  log('\nCleaning generated files...');
  removeDir(join(ROOT_DIR, 'apps/backend/src/generated'), 'Prisma client (generated)');

  // Remove setup fingerprint
  log('\nCleaning setup artifacts...');
  removeDir(join(ROOT_DIR, '.setup-fingerprint'), 'setup fingerprint');

  // Backup .env file if it exists
  const envPath = join(ROOT_DIR, '.env');
  if (existsSync(envPath)) {
    try {
      const timestamp = Date.now().toString().slice(-6);
      const backupPath = join(ROOT_DIR, `.env.old.${timestamp}`);
      renameSync(envPath, backupPath);
      logSuccess(`Backed up .env to .env.old.${timestamp}`);
    } catch (error) {
      logWarning(`Failed to backup .env: ${error}`);
    }
  }

  // Optional: Docker cleanup
  log('\nCleaning Docker containers and volumes...');
  try {
    // Use stdio: 'ignore' instead of shell redirection for cross-platform compatibility
    execSync('docker compose down -v', {
      cwd: ROOT_DIR,
      stdio: 'ignore',
    });
    logSuccess('Docker containers and volumes removed');
  } catch {
    logWarning('Docker cleanup skipped (Docker not running or compose not found)');
  }

  console.log(`
${colors.green}✓${colors.reset} Project reset complete!

To set up again, run:
  ${colors.cyan}pnpm setup-project${colors.reset}
`);
}

main().catch((error: Error) => {
  logError(`Reset failed: ${error.message}`);
  process.exit(1);
});
