# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript boilerplate using Vite as the build tool. The project is set up with modern development tools including TailwindCSS for styling, Vitest for testing, and comprehensive linting/formatting.

## Package Manager

This project uses `pnpm` as the package manager.

## Development Commands

```bash
# Start development server (runs on localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Run tests with UI
pnpm run test:ui

# Lint code
pnpm run lint

# Type checking
pnpm run typecheck

# Preview production build
pnpm run serve
```

## Architecture

- **Entry Point**: `src/index.tsx` - React app entry point
- **Main App**: `src/components/App.tsx` - Main application component
- **Components**: Located in `src/components/` with co-located test files
- **Assets**: Static assets in `src/assets/`
- **Utils**: Utility functions in `src/utils/`

## Testing

- Tests are co-located with components using the pattern `*.test.{ts,tsx}`
- Vitest configuration includes:
  - Happy DOM environment
  - Global test functions
  - Setup file at `.vitest/setup.ts`
- Snapshot testing is used (see `__snapshots__` directories)

## Import Paths

The project uses TypeScript path mapping for clean imports:
- Components can be imported as `'components/ComponentName'`
- Assets as `'assets/filename'`
- No relative paths needed for src/ directory imports

## Code Quality

- ESLint with TypeScript, React, and TailwindCSS plugins
- Prettier for code formatting
- TypeScript with strict type checking
- TailwindCSS for styling with utility classes