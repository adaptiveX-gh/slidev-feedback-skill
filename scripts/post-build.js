#!/usr/bin/env node

/**
 * Post-build script for Slidev Feedback Skill
 * Ensures proper build structure and copies necessary files
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

console.log('📦 Running post-build tasks...');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
  console.log('✓ Created dist directory');
}

// Copy package.json to dist for proper module resolution
try {
  const packageJsonPath = join(rootDir, 'package.json');
  const distPackageJsonPath = join(distDir, 'package.json');

  if (existsSync(packageJsonPath)) {
    copyFileSync(packageJsonPath, distPackageJsonPath);
    console.log('✓ Copied package.json to dist');
  }
} catch (error) {
  console.warn('⚠ Could not copy package.json:', error.message);
}

// Copy README if exists
try {
  const readmePath = join(rootDir, 'README.md');
  const distReadmePath = join(distDir, 'README.md');

  if (existsSync(readmePath)) {
    copyFileSync(readmePath, distReadmePath);
    console.log('✓ Copied README.md to dist');
  }
} catch (error) {
  console.warn('⚠ Could not copy README.md:', error.message);
}

console.log('✅ Post-build tasks completed successfully');
