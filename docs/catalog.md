# Component catalog

Open `#/catalog` to inspect the shared interface in the app shell. Theme and language controls remain available, so examples show real translated component labels and the active light or dark token values. Use the table of contents to jump to a component family; expand **Markup** to view the rendered HTML and **Copy** to copy it.

## Porting workflow

1. **Tokens:** copy the CSS custom properties and light/dark values into the destination design system.
2. **CSS classes:** map the app classes shown in each example to equivalent styles, preserving responsive behavior, focus indicators, and touch target sizes.
3. **Markup:** use the rendered markup disclosure as a structural reference. HTML is a rendered snapshot; dynamic attributes and event behavior still need implementation.
4. **React components:** consult `src/components/ui.tsx`, `Menu.tsx`, and `ReportFlow.tsx` for the source props, state logic, and localization dependencies when porting behavior.

## Sections

Tokens; Buttons; Status labels; SourceChip; MilestoneDots; Avatar; SaveIndicator; Notice; Chips; Tabs; Form fields; ReportFlow; ReadinessList; Menu; ScrollRow; Cards; Empty state; Skeleton.
