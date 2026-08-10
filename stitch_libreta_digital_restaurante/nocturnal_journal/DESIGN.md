---
name: Nocturnal Journal
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#e5bdbe'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#ac8889'
  outline-variant: '#5c3f40'
  surface-tint: '#ffb3b6'
  primary: '#ffb3b6'
  on-primary: '#68001a'
  primary-container: '#e11d48'
  on-primary-container: '#fffaf9'
  inverse-primary: '#be0037'
  secondary: '#b9c7e0'
  on-secondary: '#233144'
  secondary-container: '#3c4a5e'
  on-secondary-container: '#abb9d2'
  tertiary: '#c4c7c9'
  on-tertiary: '#2d3133'
  tertiary-container: '#717476'
  on-tertiary-container: '#f9fbfd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b6'
  on-primary-fixed: '#40000c'
  on-primary-fixed-variant: '#920028'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: workSans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: workSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system adopts a **Modern Tactile** aesthetic, specifically optimized for deep-focus environments. It targets knowledge workers, writers, and students who require a distraction-free, premium digital environment. 

The style blends **Minimalism** with subtle **Tactile** cues. It uses deep surface tones to reduce eye strain while employing crisp, high-contrast typography and intentional pops of color to denote action and hierarchy. The emotional response is one of calm, professional reliability and focused creativity.

## Colors

The palette is anchored by a deep navy/gray base to provide a stable, low-glare workspace.

- **Primary (#e11d48):** Used exclusively for high-priority actions, brand identity, and critical status indicators.
- **Surface / Background (#0f172a):** The foundation layer for the entire interface.
- **Containers (#1e293b):** Lighter navy/gray for cards, sidebars, and elevated sections to create clear visual containment.
- **On-Surface High (#f8fafc):** Pure off-white for primary body text and headlines.
- **On-Surface Medium (#94a3b8):** Muted slate for secondary information and metadata.

## Typography

This design system uses a triple-font approach to balance modernity, readability, and a touch of technical precision.

- **Manrope** is used for headlines to provide a warm, geometric, and professional appearance.
- **Work Sans** is utilized for body text, chosen for its exceptional legibility on dark backgrounds and its neutral, reliable character.
- **JetBrains Mono** is employed for labels, metadata, and UI controls (chips, tags) to reinforce the "notebook" and organizational nature of the product.

Keep line lengths for body text between 60-75 characters to ensure maximum reading comfort.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Navigation and sidebars are fixed-width to provide a grounded workspace, while the primary content area (the "page") is fluid with a maximum readable width of 840px.

- **Desktop:** 12-column grid with 24px gutters. Use wide 64px margins to create a focused, "editorial" feel.
- **Tablet:** 8-column grid with 24px gutters and 32px margins.
- **Mobile:** 4-column grid with 16px gutters and 16px margins.

Spacing should follow a strict 8px linear scale to maintain a rhythmic, structured appearance across all components.

## Elevation & Depth

Depth is achieved through **Tonal Layering** rather than heavy shadows. In this dark mode environment, shadows are used sparingly and should be deeply saturated.

- **Level 0 (Base):** #0f172a. Used for the main background.
- **Level 1 (Surface):** #1e293b. Used for cards and secondary sidebars.
- **Level 2 (Overlay):** #334155. Used for tooltips, menus, and modals.

For elevated elements (Level 2), apply a subtle 1px border using #475569 at 30% opacity to define the edge against the dark background. If shadows are required, use a high-spread, low-opacity (#000000 at 40%) shadow to ground the element.

## Shapes

The design system utilizes **Soft** roundedness. This provides a approachable feel without appearing overly "bubbly" or juvenile, maintaining the professional narrative of a high-end digital tool.

- **Standard Buttons & Inputs:** 0.25rem (4px)
- **Cards & Containers:** 0.5rem (8px)
- **Modals & Large Sheets:** 0.75rem (12px)

Interactive elements should maintain these crisp radii to reinforce the structured, "notebook" feel. Avoid pill shapes except for status indicators (chips).

## Components

### Buttons
- **Primary:** Background #e11d48, Text #f8fafc. Use a slight inner glow (top white 10% opacity) to provide a tactile, pressed-ink quality.
- **Secondary:** Background #1e293b, Border #334155, Text #f8fafc.
- **Ghost:** No background, Text #94a3b8. On hover, background transitions to #1e293b.

### Input Fields
- **Default:** Background #1e293b, Border #334155, Text #f8fafc.
- **Focus:** Border #e11d48, subtle outer glow of the primary color at 15% opacity.
- **Label:** Use JetBrains Mono (Label-sm) in #94a3b8 positioned above the field.

### Cards
- Background #1e293b with a 1px solid border #334155.
- On hover, the border color shifts to #475569 to indicate interactivity.

### Chips & Tags
- Background #334155, Text #f8fafc, Font JetBrains Mono.
- Use for categories, tags, or status metadata.

### Lists
- Separated by 1px dividers #1e293b.
- Active items should use a vertical 4px "accent bar" on the left edge in Primary #e11d48.