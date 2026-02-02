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
- **Planet Overview (zoomed-out)**: Shows the planet with all resource fields (Metal Mines, Crystal Refineries, Oxygen Processors, Energy Plants) arranged around it. Each field is tappable to build or upgrade. Resource production rates are displayed at the top. A "CITY CENTER" button in the center provides access to core facilities.
- **City Center**: Shows only core facilities (Research Lab, Fleet Dock) as large cards. An info box reminds players that resource fields are on the planet view. A "Back to Planet" button returns to the planet overview.

### Multi-Building Slot System
Players can build multiple instances of resource buildings:
- **Metal Mine**: 4 slots (displayed as Metal Mine #1, #2, #3, #4)
- **Crystal Refinery**: 4 slots
- **Oxygen Processor**: 6 slots
- **Energy Plant**: 4 slots
- **Research Lab**: 1 slot (unique)
- **Fleet Dock**: 1 slot (unique)

The `slotIndex` field in the buildings table tracks which slot a building occupies. Configuration is defined in `client/constants/gameData.ts` with `BUILDING_MAX_SLOTS` and `PLANET_BUILDING_SLOTS`.

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