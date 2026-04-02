#!/usr/bin/env pnpm dlx tsx

/**
 * Anvara Take-Home Project Setup Script
 *
 * This script handles the complete project setup:
 * 1. Checks prerequisites (Node.js, pnpm, Docker)
 * 2. Creates .env with unique database credentials
 * 3. Installs all dependencies
 * 4. Starts Docker containers (PostgreSQL)
 * 5. Creates database with unique credentials
 * 6. Runs Prisma migrations and seeds the database
 * 7. Verifies the setup
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const FINGERPRINT_FILE = join(ROOT_DIR, '.setup-fingerprint');

// Load .env file into process.env
function loadEnv(): void {
  const envPath = join(ROOT_DIR, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
} as const;

type ColorKey = keyof typeof colors;

function log(message: string, color: ColorKey = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: string, message: string): void {
  console.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
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

interface RunOptions {
  silent?: boolean;
  ignoreError?: boolean;
  cwd?: string;
  encoding?: BufferEncoding;
  stdio?: 'inherit' | 'pipe';
}

function run(command: string, options: RunOptions = {}): string | null {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      ...options,
    });
  } catch (error) {
    if (options.ignoreError) return null;
    throw error;
  }
}

function checkCommand(command: string, versionFlag = '--version'): boolean {
  try {
    execSync(`${command} ${versionFlag}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function generateRandomString(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres(maxAttempts = 30): Promise<boolean> {
  logStep('5b', 'Waiting for PostgreSQL to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = run('docker exec anvara_postgres pg_isready -U postgres', {
        silent: true,
        ignoreError: true,
      });
      if (result && result.includes('accepting connections')) {
        logSuccess('PostgreSQL is ready');
        return true;
      }
    } catch {
      // Ignore errors, keep waiting
    }
    process.stdout.write('.');
    await sleep(1000);
  }

  console.log('');
  logError('PostgreSQL failed to start within the timeout period');
  return false;
}

async function main(): Promise<void> {
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════╗
║          Anvara Take-Home Project Setup                  ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);

  // Check if setup has already run
  if (existsSync(FINGERPRINT_FILE)) {
    const timestamp = readFileSync(FINGERPRINT_FILE, 'utf-8');
    logSuccess(`Setup previously completed at: ${timestamp}`);
    console.log('');
  }

  // Step 1: Check prerequisites
  logStep('1', 'Checking prerequisites...');

  if (!checkCommand('node')) {
    logError('Node.js is not installed. Please install Node.js 20+ from https://nodejs.org');
    process.exit(1);
  }
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  logSuccess(`Node.js ${nodeVersion}`);

  if (!checkCommand('pnpm')) {
    logError('pnpm is not installed.');
    console.log(`\n${colors.cyan}Install pnpm with:${colors.reset}\n  npm install -g pnpm\n`);
    process.exit(1);
  }
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
  logSuccess(`pnpm ${pnpmVersion}`);

  if (!checkCommand('docker')) {
    logError('Docker is not installed. Please install Docker from https://docker.com');
    process.exit(1);
  }
  const dockerVersion = execSync('docker --version', { encoding: 'utf-8' }).trim();
  logSuccess(dockerVersion);

  try {
    execSync('docker info', { stdio: 'pipe' });
    logSuccess('Docker daemon is running');
  } catch {
    logError('Docker is not running. Please start Docker Desktop and try again.');
    process.exit(1);
  }

  // Step 2: Verify pnpm version
  logStep('2', 'Verifying pnpm version...');
  const pkgJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
  const requiredPnpm = pkgJson.packageManager?.split('@')[1] || pnpmVersion;
  logSuccess(`pnpm ${requiredPnpm} (required)`);

  // Step 3: Setup environment file
  logStep('3', 'Setting up environment...');

  const envPath = join(ROOT_DIR, '.env');
  const envExamplePath = join(ROOT_DIR, '.env.example');

  let databaseUrl: string;
  let dbName: string;

  if (!existsSync(envPath)) {
    dbName = `anvara_${generateRandomString(8)}`;
    const dbPassword = 'postgres'; // Must match docker-compose.yml POSTGRES_PASSWORD
    const betterAuthSecret = generateRandomString(32);
    databaseUrl = `postgresql://postgres:${dbPassword}@localhost:5498/${dbName}`;

    // Create fingerprint file EARLY with database info
    const timestamp = new Date().toISOString();
    const fingerprintData = JSON.stringify(
      {
        timestamp,
        databaseUrl,
        dbName,
        setupInProgress: true,
      },
      null,
      2
    );
    writeFileSync(FINGERPRINT_FILE, fingerprintData);
    logSuccess(`Setup fingerprint created with database: ${dbName}`);

    if (existsSync(envExamplePath)) {
      let envContent = readFileSync(envExamplePath, 'utf-8');
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${databaseUrl}`);
      envContent = envContent.replace(
        /BETTER_AUTH_SECRET=.*/,
        `BETTER_AUTH_SECRET=${betterAuthSecret}`
      );
      writeFileSync(envPath, envContent);
      logSuccess('Created .env with unique credentials');
      logSuccess('Authentication is ready - use demo accounts to login');
    } else {
      logError('.env.example not found');
      process.exit(1);
    }
  } else {
    // Read from existing .env
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    databaseUrl = match
      ? match[1]
      : 'postgresql://postgres:postgres@localhost:5498/anvara_sponsorships';

    // Extract database name from URL
    const dbNameMatch = databaseUrl.match(/\/([^/?]+)(\?|$)/);
    dbName = dbNameMatch ? dbNameMatch[1] : 'anvara_sponsorships';

    // Check if DATABASE_URL has the correct port
    const portMatch = databaseUrl.match(/:(\d+)\//);
    const currentPort = portMatch ? portMatch[1] : null;
    if (currentPort && currentPort !== '5498') {
      logWarning(`.env file exists but uses old port ${currentPort}`);
      logWarning('Run "pnpm reset && pnpm setup-project" to regenerate with correct ports');
      logWarning(`Expected port: 5498, Found: ${currentPort}`);
    }

    logSuccess('.env file already exists');
  }

  loadEnv();

  // Step 4: Install dependencies
  logStep('4', 'Installing dependencies...');
  run('pnpm install');
  logSuccess('Dependencies installed');

  // Step 5a: Start Docker containers
  logStep('5a', 'Starting Docker containers...');
  run('docker compose down', { ignoreError: true, silent: true });
  run('docker compose up -d');
  logSuccess('Docker containers started');

  // Step 5b: Wait for PostgreSQL
  const dbReady = await waitForPostgres();
  if (!dbReady) {
    process.exit(1);
  }

  // Step 5c: Create database
  logStep('5c', 'Creating application database...');

  // Create database (ignore error if it already exists)
  const createDatabaseCommand = `docker exec anvara_postgres psql -U postgres -c "CREATE DATABASE ${dbName};"`;
  const createResult = run(createDatabaseCommand, { silent: true, ignoreError: true });

  if (createResult && createResult.includes('CREATE DATABASE')) {
    logSuccess(`Database '${dbName}' created`);
  } else if (createResult && createResult.includes('already exists')) {
    logSuccess(`Database '${dbName}' already exists`);
  } else {
    logSuccess(`Database '${dbName}' ready`);
  }

  // Verify database is accessible with a simple query
  try {
    const verifyResult = execSync(
      `docker exec anvara_postgres psql -U postgres -d ${dbName} -c "SELECT 1;"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    if (verifyResult && verifyResult.includes('1 row')) {
      logSuccess(`Database '${dbName}' is accessible`);
    }
  } catch (error) {
    logWarning(`Database verification returned non-zero, but this may be OK`);
    logSuccess(`Proceeding with setup...`);
  }

  // Step 6: Setup database schema
  logStep('6', 'Setting up database schema...');

  // 6a: Better Auth tables (user, session, account, verification)
  // Use dotenv-cli to load .env from root directory
  try {
    execSync(`npx dotenv-cli -e ${join(ROOT_DIR, '.env')} -- npx @better-auth/cli migrate --yes`, {
      cwd: join(ROOT_DIR, 'apps', 'frontend'),
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    logSuccess('Better Auth tables created');
  } catch (error: any) {
    logError('Failed to create Better Auth tables');
    logError(`Database: ${dbName}`);
    logError(`DATABASE_URL: ${databaseUrl}`);
    console.error(error.message);
    process.exit(1);
  }

  // 6b: Prisma schema
  run('pnpm --filter @anvara/backend db:generate');
  logSuccess('Prisma client generated');

  run('pnpm --filter @anvara/backend db:push');
  logSuccess('Prisma database schema applied');

  run('pnpm --filter @anvara/backend seed');
  logSuccess('Database seeded with sample data');

  // Step 7: Verify setup
  logStep('7', 'Verifying setup...');

  try {
    run('pnpm --filter @anvara/backend build', { silent: true });
    logSuccess('Backend builds successfully');
  } catch {
    logWarning('Backend has TypeScript errors');
    logSuccess('Setup is complete');
  }

  const timestamp = new Date().toISOString();
  const fingerprintData = JSON.stringify(
    {
      timestamp,
      databaseUrl,
      dbName,
      setupComplete: true,
    },
    null,
    2
  );
  writeFileSync(FINGERPRINT_FILE, fingerprintData);
  logSuccess(`Setup completed: ${timestamp}`);

  console.log(`
${colors.green}╔══════════════════════════════════════════════════════════╗
║                    Setup Complete!                       ║
╚══════════════════════════════════════════════════════════╝${colors.reset}

${colors.cyan}Quick Start:${colors.reset}
  ${colors.dim}$${colors.reset} pnpm dev          ${colors.dim}# Start all services${colors.reset}

${colors.cyan}Services:${colors.reset}
  Frontend:  ${colors.green}http://localhost:3847${colors.reset}
  Backend:   ${colors.green}http://localhost:4291${colors.reset}
  Database:  ${colors.green}postgresql://localhost:5498${colors.reset}

${colors.cyan}Useful Commands:${colors.reset}
  ${colors.dim}$${colors.reset} pnpm dev         ${colors.dim}# Run all services${colors.reset}
  ${colors.dim}$${colors.reset} pnpm test         ${colors.dim}# Run tests${colors.reset}
  ${colors.dim}$${colors.reset} pnpm lint         ${colors.dim}# Lint code${colors.reset}
  ${colors.dim}$${colors.reset} pnpm --filter @anvara/backend db:studio  ${colors.dim}# Prisma Studio${colors.reset}

${colors.yellow}Note:${colors.reset} Better Auth is configured with demo credentials.
  Login at http://localhost:3847/login with: sponsor@example.com / password
`);
}

main().catch((error: Error) => {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
});
