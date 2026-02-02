# Galaxy Ascendancy Design Guidelines

## 1. Brand Identity

**Purpose**: A persistent MMO strategy game where players command planets, manage resources, and compete for galactic supremacy without ever losing progress.

**Aesthetic Direction**: **Refined Military Command** - Clean, authoritative interface with subtle sci-fi elements. Inspired by Clash of Clans' polish but with a space warfare edge. Think strategic war room meets sleek command center. Dark backgrounds with luminous accents create depth and focus attention on game elements.

**Memorable Element**: The three-layer planet visualization (Orbit/Surface/Core) that players can rotate and zoom through, making their planet feel tangible and alive.

## 2. Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs + floating action button)
- Tab 1: Planet (player's home base)
- Tab 2: Galaxy (map view, other players)
- Tab 3: Fleet (ships and combat)
- Tab 4: Alliance (social features)
- Floating Action Button: Build (primary action, positioned above tab bar center)

**Screen List**:
- **Planet Screen** (Tab 1): Manage buildings, view resources, upgrade structures
- **Galaxy Map** (Tab 2): Navigate shared universe, view other players
- **Fleet Management** (Tab 3): Build ships, view combat history
- **Alliance Hub** (Tab 4): Diplomacy, shared tech, coordinated warfare
- **Building Detail Modal**: Upgrade/info for selected structure
- **Construction Queue Modal**: Active builds and timers
- **Profile/Settings**: Player stats, preferences, logout

## 3. Screen Specifications

### Planet Screen (Home Base)
**Purpose**: Primary gameplay hub where players manage their planet.

**Layout**:
- Header: Transparent with player avatar (left), resource ticker (center), settings icon (right)
- Main content: 3D-style isometric planet view with three switchable layers (Orbit/Surface/Core)
- Layer switcher: Segmented control below header
- Floating elements: Resource production summary card (top), build queue indicator (bottom-left)
- Safe area insets: top (headerHeight + Spacing.xl), bottom (tabBarHeight + Spacing.xl)

**Components**:
- Isometric grid with building slots (expandable)
- Tappable building sprites with level indicators
- Real-time resource counters with +X/hour animations
- Layer toggle (Orbit/Surface/Core tabs)
- Empty building slots with + icon

### Galaxy Map Screen
**Purpose**: View shared universe, locate other players, navigate to targets.

**Layout**:
- Header: Search bar for player lookup, filter icon (right)
- Main content: Scrollable/zoomable star map
- Floating zoom controls (bottom-right)
- Safe area insets: top (Spacing.xl), bottom (tabBarHeight + Spacing.xl)

**Components**:
- Star clusters with player-owned planets (colored by alliance)
- Neutral zones and anomalies
- Minimap overlay (top-right corner)
- Distance/coordinates display

### Building Detail Modal
**Purpose**: Upgrade or view detailed info for selected structure.

**Layout**:
- Native modal presentation (slides up from bottom)
- Header: Building name, close button (right)
- Main content: Scrollable form
  - Building illustration
  - Current level & stats
  - Upgrade cost breakdown (Metal/Crystal/Oxygen)
  - Upgrade duration with timer
  - "Upgrade" button (primary, full width)
  - Cancel/back button below form
- Safe area insets: top (insets.top + Spacing.xl), bottom (insets.bottom + Spacing.xl)

### Construction Queue Modal
**Purpose**: Track active building/upgrade timers.

**Layout**:
- Native modal (slides up)
- Header: "Construction Queue" title, close button
- Main content: List of active builds
  - Each item shows building icon, name, completion timer, cancel option
- Empty state: "No active construction" with illustration
- Safe area insets: top (insets.top + Spacing.xl), bottom (insets.bottom + Spacing.xl)

## 4. Color Palette

**Primary**: `#0A84FF` (Electric Blue) - Strategic, trustworthy, high-tech
**Primary Dark**: `#0066CC` (pressed state)

**Background**: `#0D0D0D` (Near Black)
**Surface**: `#1C1C1E` (Dark Gray) - cards, panels
**Surface Elevated**: `#2C2C2E` (Lighter Gray) - modals, overlays

**Accent**: `#FF9F0A` (Amber) - Uranium currency, premium features
**Success**: `#34C759` (Green) - resource generation, completed builds
**Warning**: `#FF9500` (Orange) - low resources, alerts
**Danger**: `#FF3B30` (Red) - attacks, shield destruction

**Text Primary**: `#FFFFFF` (White)
**Text Secondary**: `#EBEBF5` (60% opacity)
**Text Tertiary**: `#EBEBF5` (30% opacity)

**Resource Colors** (for UI consistency):
- Metal: `#8E8E93` (Gray-silver)
- Crystal: `#64D2FF` (Cyan)
- Oxygen: `#30D158` (Green)
- Energy: `#FFD60A` (Yellow)

## 5. Typography

**Primary Font**: **Orbitron** (Google Font) - geometric, futuristic, perfect for sci-fi military aesthetic
**Body Font**: **Inter** (Google Font) - legible sans-serif for all body text and UI labels

**Type Scale**:
- H1: Orbitron Bold, 28px - Screen titles
- H2: Orbitron SemiBold, 22px - Section headers
- H3: Orbitron Medium, 18px - Card titles
- Body: Inter Regular, 16px - Main content
- Caption: Inter Regular, 14px - Metadata, timestamps
- Label: Inter Medium, 12px - Input labels, button text

## 6. Visual Design

**Icons**: Feather icons from @expo/vector-icons for all UI actions. Use system SF Symbols on iOS, Material icons on Android for platform-specific elements.

**Touchable Feedback**: All buttons scale to 0.95 on press with 100ms duration. Cards have subtle opacity change (0.7).

**Shadows for Floating Elements**:
- Floating action button (Build): shadowOffset `{width: 0, height: 2}`, shadowOpacity `0.10`, shadowRadius `2`
- Resource summary card: same subtle shadow
- Modals: no additional shadow (native presentation handles elevation)

**Grid System**: 8px base unit. All spacing multiples of 8 (8, 16, 24, 32).

## 7. Assets to Generate

**App Icon** (`icon.png`): Planet with glowing orbital ring, dark space background. Used on device home screen.

**Splash Icon** (`splash-icon.png`): Simplified version of app icon for launch screen.

**Planet Illustrations**:
- `planet-orbit-layer.png`: Orbital structures, docks, defense platforms. Used in Planet Screen when Orbit layer selected.
- `planet-surface-layer.png`: Cities, resource fields, infrastructure. Used in Planet Screen when Surface layer selected.
- `planet-core-layer.png`: Energy reactors, advanced tech, glowing core. Used in Planet Screen when Core layer selected.

**Building Sprites** (isometric style):
- `building-metal-mine.png`: Metal resource generator. Used on Surface layer grid.
- `building-crystal-refinery.png`: Crystal generator. Used on Surface layer.
- `building-oxygen-processor.png`: Oxygen generator. Used on Surface layer.
- `building-energy-plant.png`: Energy generator. Used on Core layer.
- `building-fleet-dock.png`: Ship construction facility. Used on Orbit layer.

**Empty States**:
- `empty-construction-queue.png`: Idle construction bot illustration. Used in Construction Queue Modal when no active builds.
- `empty-galaxy-search.png`: Telescope searching stars. Used in Galaxy Map when search returns no results.

**UI Elements**:
- `resource-icon-metal.png`: Metallic ingot icon
- `resource-icon-crystal.png`: Glowing crystal shard
- `resource-icon-oxygen.png`: Oxygen tank/atmosphere
- `resource-icon-energy.png`: Lightning bolt/reactor symbol
- `currency-uranium.png`: Uranium atom/premium currency indicator

All illustrations should match the refined military command aesthetic: clean lines, subtle gradients, dark backgrounds with luminous accents. Avoid overly detailed textures - favor clear, readable iconography at mobile scale.