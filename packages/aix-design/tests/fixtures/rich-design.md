# DESIGN.md

## Design Philosophy

- Calm operational clarity over decorative novelty.
- Fast comprehension before visual flourish.
- Progressive disclosure should reduce cognitive load.

## Brand Personality

- Professional but approachable.
- Technically advanced but understandable.
- Stable and dependable.

## Color System

| Token | Value | Usage |
| --- | --- | --- |
| primary-500 | #0057ff | Primary actions |
| success-500 | #16a34a | Success messaging |
| warning-500 | #f59e0b | Caution states |
| error-500 | #dc2626 | Error messaging |
| surface | #f8fafc | Page surfaces |
| text | #111827 | Primary text |

## Typography

| Style | Size | Weight | Line Height |
| --- | --- | --- | --- |
| h1 | 48px | 700 | 56px |
| h2 | 36px | 600 | 44px |
| body | 16px | 400 | 24px |

- Prefer readability over density.
- Use weight before color for emphasis.

## Layout Rules

| Token | Value |
| --- | --- |
| space-1 | 4px |
| space-2 | 8px |
| space-4 | 16px |
| space-6 | 24px |

- Use an 8px spacing system.
- Avoid deeply nested card structures.
- Prefer one primary action per screen.

## Component Standards

- Buttons use clear action verbs and visible focus states.
- Forms keep labels visible and validation inline.
- Tables prioritize readability over decoration.

## Interaction Rules

- Minimize modal usage.
- Confirm destructive actions.
- Preserve user context during workflows.

## Motion Principles

- Motion should reinforce hierarchy.
- Avoid decorative animation.
- Fast interactions should complete around 150ms.

## Accessibility

- WCAG AA contrast is the minimum.
- Visible keyboard focus states are required.
- Never rely on color alone for meaning.
- Touch targets should be at least 44px.

## Responsive Behavior

- Mobile-first layout is preferred.
- Preserve primary actions on narrow screens.
- Avoid horizontal scrolling.

## Content Tone

- Concise, direct, professional, and supportive.
- Avoid excessive enthusiasm.
- Avoid technical jargon without explanation.

## AI Generation Constraints

- Never invent new color palettes.
- Never introduce random gradients.
- Always reuse existing patterns.
- Prefer consistency over novelty.

## Examples

- Good dashboards have clear hierarchy and restrained color usage.
- Bad dashboards use competing colors and unclear action hierarchy.
