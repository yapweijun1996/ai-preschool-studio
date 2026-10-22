# Brand mark and illustrations

## Source and style

All raster illustrations in `src/assets/illustrations/` and `src/assets/placeholders/` are AI-generated for this project. Their PNG masters are kept outside the repository in the workspace `masters/` directory. The brand mark is hand-written SVG at `src/assets/brand/mark.svg`.

Use a flat geometric style with thick rounded shapes and three or four solid colors. Prefer objects only. If a child figure is necessary, it must be a simple cartoon with no facial features, viewed from behind or faceless. Never use photorealism. Do not put text, letters, numbers, writing, or symbols in an image. Request a transparent background; use a soft rounded `#E7F3EF` backdrop shape if the composition needs contrast on dark surfaces.

Approved palette:

`#167D68` · `#116653` · `#E7F3EF` · `#9A6700` · `#FFF8E6` · `#1D4ED8` · `#EEF3FE` · `#1E293B` · `#64748B`

Keep artwork clear on `#F8FAFC` and `#FFFFFF` light surfaces and the blue-black dark surfaces (`#0B1220`, `#111A2B`, `#18233A`). Empty-state images are 480 × 480 WebP and at most 30 KB. Photo placeholders are 640 × 480 WebP and at most 35 KB. Preserve transparency. Optimize before adding assets; do not add PNG masters to the repo.

## Exact generation prompts

Prompts below were used with the built-in image generation tool and `transparent_background: true`.

### Empty-state illustrations

#### `no-observations.webp`

> Use case: illustration-story  
> Asset type: decorative empty-state illustration for a teacher portfolio web app  
> Primary request: a neat closed notebook beside one pencil and a few simple stacking blocks, conveying an empty observations list  
> Scene/backdrop: transparent background; add a soft rounded mint (#E7F3EF) backdrop shape behind the objects  
> Style/medium: flat geometric vector-like illustration, 3–4 solid colors, thick rounded shapes, minimal clean edges  
> Composition/framing: centered compact still life, square, generous clear margins  
> Color palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people, no text, letters, numbers, gradients, shadows, or watermark; legible on light and dark UI surfaces

#### `no-results.webp`

> Use case: illustration-story  
> Asset type: decorative no-results empty-state illustration for a teacher portfolio web app  
> Primary request: a rounded magnifying glass above a few scattered geometric toy blocks, conveying a search with no matches  
> Scene/backdrop: transparent background; soft rounded mint (#E7F3EF) backdrop shape behind the objects  
> Style/medium: flat geometric vector-like illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact still life, square, generous margins  
> Color palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people, no text, letters, numbers, gradients, shadows, or watermark; legible on light and dark UI surfaces

#### `not-found.webp`

> Use case: illustration-story  
> Asset type: decorative not-found empty-state illustration for a teacher portfolio web app  
> Primary request: a small paper plane drifting away from a short tower of simple geometric blocks  
> Scene/backdrop: transparent background; soft rounded mint (#E7F3EF) backdrop shape behind the objects  
> Style/medium: flat geometric vector-like illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact square composition, generous clear margins  
> Color palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people, no text, letters, numbers, gradients, shadows, or watermark; legible on light and dark UI surfaces

#### `offline-ai.webp`

> Use case: illustration-story  
> Asset type: decorative offline empty-state illustration for a teacher portfolio web app  
> Primary request: a small friendly cloud with a loose unplugged cord dangling beside it  
> Scene/backdrop: transparent background; soft rounded mint (#E7F3EF) backdrop shape behind the objects  
> Style/medium: flat geometric vector-like illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact square composition, generous clear margins  
> Color palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people, no text, letters, numbers, gradients, shadows, or watermark; legible on light and dark UI surfaces

#### `report-not-started.webp`

> Use case: illustration-story  
> Asset type: decorative empty-state illustration for a teacher portfolio web app  
> Primary request: a blank report sheet with a small two-leaf sprout growing beside it  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: flat geometric vector illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact still life, square, generous clear margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, report entirely blank, absolutely no text, letters, numbers, glyphs, people, gradients, shadows, or watermark; no facial features; legible on light and dark UI

#### `ai-ready.webp`

> Use case: illustration-story  
> Asset type: decorative ready-state illustration for a teacher portfolio web app  
> Primary request: open blank notebook with a few sparkles above the pages  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: flat geometric vector illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact still life, square, generous clear margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: notebook pages blank with no writing; no text, letters, numbers, glyphs, people, gradients, shadows, or watermark; no facial features; legible on light and dark UI

#### `planned-family.webp`

> Use case: illustration-story  
> Asset type: decorative planned family empty-state illustration for a teacher portfolio web app  
> Primary request: a small simple house with a leaf beside it; in front, a faceless parent and child seen strictly from behind holding hands  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: flat geometric vector illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact square composition, generous clear margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: people must have no facial features, viewed from behind; no other facial details; no text, letters, numbers, gradients, shadows, or watermark; legible on light and dark UI

#### `planned-school.webp`

> Use case: illustration-story  
> Asset type: decorative planned school empty-state illustration for a teacher portfolio web app  
> Primary request: simple friendly school building with a plain unmarked flag  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: flat geometric vector illustration, 3–4 solid colors, thick rounded shapes  
> Composition/framing: centered compact square composition, generous clear margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: no symbols on flag; no text, letters, numbers, glyphs, people, gradients, shadows, or watermark; no facial features; legible on light and dark UI

### Photo placeholders

#### `domain-en.webp`

> Use case: illustration-story  
> Asset type: decorative sample image placeholder in an early-learning portfolio  
> Primary request: an open picture book with simple colorful pictures made only of geometric shapes and alphabet-free wooden blocks  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: polished flat geometric vector-like illustration, thick rounded forms, limited solid colors  
> Composition/framing: still life centered in landscape 4:3 frame, generous margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people; no text, letters, numbers, writing, symbols, gradients, shadows, or watermark

#### `domain-zh.webp`

> Use case: illustration-story  
> Asset type: decorative sample image placeholder in an early-learning portfolio  
> Primary request: a handmade paper lantern craft beside a few expressive abstract brush strokes on paper; lantern is plain and unmarked  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: polished flat geometric vector-like illustration, thick rounded forms, limited solid colors  
> Composition/framing: still life centered in landscape 4:3 frame, generous margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people; brushwork must contain no characters or glyphs; no text, letters, numbers, symbols, gradients, shadows, or watermark

#### `domain-ma.webp`

> Use case: illustration-story  
> Asset type: decorative sample image placeholder in an early-learning portfolio  
> Primary request: colorful counting beads arranged beside simple geometric pattern blocks  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: polished flat geometric vector-like illustration, thick rounded forms, limited solid colors  
> Composition/framing: still life centered in landscape 4:3 frame, generous margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people; beads are blank unmarked shapes; no text, letters, numbers, symbols, gradients, shadows, or watermark

#### `domain-se.webp`

> Use case: illustration-story  
> Asset type: decorative sample image placeholder in an early-learning portfolio  
> Primary request: two small chairs side by side with one shared toy basket between them  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: polished flat geometric vector-like illustration, thick rounded forms, limited solid colors  
> Composition/framing: still life centered in landscape 4:3 frame, generous margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people; toys are simple blank shapes; no text, letters, numbers, symbols, gradients, shadows, or watermark

#### `art.webp`

> Use case: illustration-story  
> Asset type: decorative sample image placeholder in an early-learning portfolio  
> Primary request: a child's easel with a simple abstract painting made only of unmarked shapes and broad brush strokes  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: polished flat geometric vector-like illustration, thick rounded forms, limited solid colors  
> Composition/framing: still life centered in landscape 4:3 frame, generous margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people; painting has absolutely no text, letters, numbers, characters, or recognizable symbols; no gradients, shadows, or watermark

#### `outdoor.webp`

> Use case: illustration-story  
> Asset type: decorative sample image placeholder in an early-learning portfolio  
> Primary request: a small sandpit with a toy bucket and spade, a few curved sand mounds  
> Scene/backdrop: transparent background; soft rounded mint #E7F3EF backdrop  
> Style/medium: polished flat geometric vector-like illustration, thick rounded forms, limited solid colors  
> Composition/framing: still life centered in landscape 4:3 frame, generous margins  
> Palette: #167D68 #116653 #E7F3EF #9A6700 #FFF8E6 #1D4ED8 #EEF3FE #1E293B #64748B  
> Constraints: objects only, no people; no text, letters, numbers, symbols, gradients, shadows, or watermark

## Add an illustration

1. Write and review an object-focused prompt using the rules and palette above. Generate with a transparent background, then check for text, symbols, and facial features.
2. Keep the PNG master outside this repository. Crop transparent margins carefully and export a transparent WebP at the correct dimensions and size limit.
3. Add the asset to the appropriate directory and register its Vite import in `src/components/EmptyIllustration.tsx` (or the image selector for its use case).
4. Add an empty-state decorative image with `EmptyIllustration`, or use `PhotoIllustration` for a sample-photo slot. Decorative images use `alt=""` and `aria-hidden="true"`; sample placeholders have meaningful alt text and the translated sample caption.
5. Add a catalog entry and update the e2e coverage when the asset introduces a new use case. Update this page with the final prompt.
