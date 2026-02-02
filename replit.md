# Galaxy Ascendancy

## Overview

Galaxy Ascendancy is a persistent MMO strategy game built with Expo/React Native for the client and Express.js for the backend. Players command planets, manage resources (metal, crystal, oxygen, energy), and compete for galactic supremacy. The core gameplay loop involves building structures across three planetary layers (Orbit, Surface, Core), upgrading buildings, and managing construction queues. The game is designed as a persistent world where player progress is never wiped.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation with native-stack navigators and bottom tabs
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: StyleSheet with a custom theme system (GameColors, Spacing, BorderRadius)
- **Animations**: React Native Reanimated for smooth UI transitions
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`

The client follows a screen-based architecture with:
- Tab navigation (Planet, Galaxy, Fleet, Alliance)
- Stack navigators per tab for nested screens
- Modal screens for building details and construction queue
- Shared components in `client/components/`

### Planet View Navigation
The Planet screen uses a zoom-based navigation system:
- **Zoomed-out view**: Shows planet with animated resource bubbles (Metal, Crystal, Oxygen) orbiting, displaying production rates. A clickable "ENTER CITY" button in the center allows access to buildings.
- **City view**: Shows all buildings organized into "Resource Buildings" and "Facilities & Fleet" sections. Players can build new structures or upgrade existing ones. A "Back to Planet" button returns to the zoomed-out view.

### Backend Architecture
- **Framework**: Express.js 5.x running on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **API Pattern**: RESTful endpoints under `/api/`
- **Game Logic**: Server-authoritative model in `server/gameLogic.ts`

Key backend patterns:
- Resource calculations happen server-side with periodic updates
- Construction queue processing runs on a 5-second interval
- Demo user auto-initialization for development/testing

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Users, Planets, Buildings, ConstructionQueue tables
- **Validation**: Zod schemas via drizzle-zod
- **Storage Interface**: `IStorage` interface in `server/storage.ts` for database operations

### Build System
- **Client Build**: Expo bundler with custom build script (`scripts/build.js`)
- **Server Build**: esbuild for production server bundle
- **Development**: Concurrent Expo dev server and Express server

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle Kit for migrations (`drizzle-kit push`)

### Third-Party Services
- None currently integrated (game is self-contained)

### Key NPM Packages
- `expo` - React Native framework
- `drizzle-orm` / `pg` - Database layer
- `@tanstack/react-query` - Data fetching and caching
- `react-native-reanimated` - Animation library
- `expo-haptics` - Haptic feedback
- `expo-linear-gradient` - UI gradients

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `EXPO_PUBLIC_DOMAIN` - API server domain for client requests
- `REPLIT_DEV_DOMAIN` - Development domain (Replit-specific)