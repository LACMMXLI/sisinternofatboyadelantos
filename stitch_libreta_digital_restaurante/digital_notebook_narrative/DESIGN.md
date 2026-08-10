---
name: Digital Notebook Narrative
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#5c3f40'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#906f70'
  outline-variant: '#e5bdbe'
  surface-tint: '#be0037'
  primary: '#b80035'
  on-primary: '#ffffff'
  primary-container: '#e11d48'
  on-primary-container: '#fffaf9'
  inverse-primary: '#ffb3b6'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc329'
  on-secondary-container: '#6f5100'
  tertiary: '#006847'
  on-tertiary: '#ffffff'
  tertiary-container: '#00845a'
  on-tertiary-container: '#eefff3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b6'
  on-primary-fixed: '#40000c'
  on-primary-fixed-variant: '#920028'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 24px
  touch-target-min: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built on the metaphor of a physical kitchen notebook translated into a high-performance digital interface. The brand personality is energetic, reliable, and approachable, designed to reduce the stress of high-volume restaurant environments. 

The aesthetic style is **Modern Tactile**. It avoids the sterility of typical enterprise software by using oversized interactive elements, generous whitespace, and intentional depth. It prioritizes "Information Density through Clarity"—meaning complexity is hidden behind a clean, layered interface that emphasizes touch targets for tablet users. Every interaction should feel stable and certain, mimicking the permanence of ink on paper but with the fluid speed of modern hardware.

## Colors

The palette is anchored by a high-energy **Primary Red**, used for core identity and critical actions that require immediate attention. **Secondary Yellow** serves as a functional highlight for status warnings or temporary "waiting" states.

- **Primary (#E11D48):** Used for "Commit" actions, active navigation states, and branding.
- **Secondary (#FBBF24):** Used for highlights, pending items, and call-outs.
- **Surface:** Pure White (#FFFFFF) is the mandatory background to maintain the "notebook page" feel.
- **Ink:** Dark Gray (#1F2937) is used for all text to ensure high legibility without the harshness of pure black.
- **Functional Green (#10B981):** Added for "Success" or "Completed" states to provide a clear semantic contrast to the primary red.

## Typography

The typography utilizes **Plus Jakarta Sans** for its friendly, open counters and excellent legibility on backlit screens. 

The type scale is intentionally oversized to accommodate the fast-paced, "at-a-glance" nature of restaurant work. Headlines use a tighter letter-spacing and heavier weights to anchor the page, while body text maintains a generous line height to prevent eye fatigue during long shifts. Labels are often capitalized and bolded to function as clear visual signposts for data fields.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model optimized for landscape tablet orientation (iPad/Surface). 

- **Grid:** A 12-column grid system with wide 24px gutters.
- **Margins:** Screens must maintain a minimum 32px safety margin to ensure thumbs do not obscure content when holding a tablet.
- **Rhythm:** An 8px linear scale is used. However, all primary interactive components must adhere to a minimum 48px touch-target height.
- **Mobile/Portrait:** On smaller screens, the 12-column grid collapses into a single-column stack, and `headline-lg` reduces to its mobile variant to maintain clear hierarchy without excessive scrolling.

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to simulate the physical stacking of paper and folders. 

- **Level 0 (Background):** Pure White (#FFFFFF).
- **Level 1 (Cards):** Pure White with a 1px soft border (#E5E7EB) and a subtle, wide-diffusion shadow (offset: 0 4px, blur: 20px, opacity: 0.05).
- **Level 2 (Active/Floating):** Used for modals or active selection. The shadow intensity increases (blur: 30px, opacity: 0.1) and the primary color is used as a 4px left-side accent "marker" to denote focus.
- **Transitions:** Elements should feel "lifted" when interacted with, using a slight scale-up (1.02x) rather than traditional color shifts.

## Shapes

The shape language is defined by "Friendly Precision." 

- **Standard Elements:** Buttons and small inputs use a `0.5rem` (8px) radius.
- **Cards:** Large containers use `rounded-xl` (1.5rem / 24px) to emphasize the notebook metaphor and create a softer, modern appearance.
- **Indicators:** Status tags and chips use a "Full Pill" radius to distinguish them from actionable buttons.

## Components

- **Primary Buttons:** High-contrast Red (#E11D48) with white text. 56px minimum height for tablet use. Bold, center-aligned typography.
- **Large Cards:** White background, 24px corner radius, and 32px internal padding. Used to group orders, inventory items, or table sections.
- **Selection Chips:** Secondary Yellow (#FBBF24) with Dark Gray text. Used for "Special Requests" or "Urgent" modifiers on orders.
- **Input Fields:** Large, 16px font size, with an 8px corner radius and a 2px border that turns Red on focus. Labels sit permanently above the field (no floating labels) to ensure visibility at all times.
- **Status Indicators:** Use a combination of a colored dot and a text label to ensure accessibility for color-blind users.
- **The "Notebook" Header:** A persistent top bar with a thick bottom border (4px) in Primary Red, acting as the "binding" of the digital notebook.