# Meridian Brand Guidelines

## Color Palette

### Primary Colors (by usage proportion)

| Color Name | Hex Code | Usage | Proportion |
|------------|----------|-------|------------|
| **Cloud** | `#E8F1F5` | Backgrounds, large areas, light mode base | ~50% |
| **Deep Ocean** | `#1A4A6B` | Primary buttons, selected states, key UI elements | ~25% |
| **Seafoam** | `#3A9A85` | Accent color, success states, secondary CTAs | ~10% |
| **Steel Blue** | `#5B8DAB` | Secondary elements, hover states, links | ~8% |
| **Sky** | `#8FC1DA` | Tertiary accents, badges, subtle highlights | ~5% |
| **Midnight** | `#1A1A1A` | Text, dark mode elements | ~2% |

### CSS Variables

```css
:root {
  /* Brand Colors */
  --brand-cloud: #E8F1F5;
  --brand-deep-ocean: #1A4A6B;
  --brand-seafoam: #3A9A85;
  --brand-steel-blue: #5B8DAB;
  --brand-sky: #8FC1DA;
  --brand-midnight: #1A1A1A;
}
```

### Tailwind Classes

Use these custom classes throughout the app:

- `bg-brand-cloud` - Light backgrounds
- `bg-brand-deep-ocean` - Primary buttons, selected sidebar items
- `bg-brand-seafoam` - Success states, accent buttons
- `bg-brand-steel-blue` - Secondary buttons, links
- `bg-brand-sky` - Badges, subtle highlights
- `text-brand-midnight` - Primary text
- `text-brand-deep-ocean` - Headings, emphasized text
- `border-brand-deep-ocean` - Active borders

## Typography

### Font Families

| Font | Usage | Weights |
|------|-------|---------|
| **Space Mono** | Display text, code, monospace elements | 400, 700 |
| **Inter** | Body text, UI elements | 400, 500, 600, 700 |

### CSS Font Stack

```css
:root {
  --font-display: 'Space Mono', monospace;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

### Usage Guidelines

- **Display text**: Space Mono (use `.font-display` class)
- **Body text**: Inter Regular (400)
- **UI labels**: Inter Medium (500)
- **Buttons**: Inter SemiBold (600)
- **Code/mono**: Space Mono

## Logo

### Assets

| File | Usage |
|------|-------|
| `/public/logo.svg` | Full logo with text (header, marketing) |
| `/public/logo-icon.svg` | Icon only (favicon size, small spaces) |
| `/src/app/icon.png` | Favicon |

### Clear Space

Maintain minimum clear space around logo equal to the height of the compass icon.

### Minimum Sizes

- Full logo: 120px width minimum
- Icon only: 24px minimum

## UI Components

### Buttons

**Primary Button**
- Background: `--brand-deep-ocean` (#1A4A6B)
- Text: White
- Hover: Darken 10%
- Use for: Main actions (New Project, Save, Submit)

**Secondary Button**
- Background: Transparent
- Border: `--brand-deep-ocean`
- Text: `--brand-deep-ocean`
- Hover: `--brand-cloud` background
- Use for: Secondary actions (Cancel, Export)

**Accent Button**
- Background: `--brand-seafoam` (#3A9A85)
- Text: White
- Use for: Success actions, AI features

### Cards

- Background: White (light mode) / Dark gray (dark mode)
- Border: 1px solid with subtle gray
- Hover border: `--brand-deep-ocean`
- Border radius: 12px

### Badges

- Pro badge: `--brand-deep-ocean` background
- Status badges: Use appropriate brand colors

### Avatars

- Background: `--brand-deep-ocean`
- Text: White
- Border radius: Full (rounded)

## Dark Mode

In dark mode, invert the usage:

| Light Mode | Dark Mode |
|------------|-----------|
| Cloud background | Midnight background |
| Midnight text | Cloud text |
| Deep Ocean buttons | Deep Ocean buttons (unchanged) |
| Seafoam accents | Seafoam accents (unchanged) |

## Do's and Don'ts

### Do's
- Use Deep Ocean for primary actions
- Use Cloud for backgrounds
- Maintain color proportions
- Use Space Mono for display/code elements
- Keep sufficient contrast

### Don'ts
- Don't use gradients (solid colors only)
- Don't use colors outside the palette
- Don't use Deep Ocean for large background areas
- Don't mix font families within the same text block
