# Product colour-variant image manifest

Mode: precise object editing with the built-in image generator

Source assets: the 60 original product views documented in
[`product-image-prompts.md`](./product-image-prompts.md)

Final outputs: `public/images/products/` (120 optimized 1200 × 900 JPEGs: two views for
each of two colour variants across 30 products)

Each source view was edited separately. The category prompt below was sent verbatim with
`${label}` replaced by the selected colour label. No colour was simulated in CSS.

## Colour pairs

- Laptops: Deep Navy (`#173f5f`) and Warm Silver (`#c2ccd3`)
- Tablets: Lagoon Teal (`#1f9e9a`) and Sunset Coral (`#ed7966`)
- Headphones: Night Navy (`#173f5f`) and Sunset Coral (`#ed7966`)
- Speakers: Harbour Blue (`#173f5f`) and Terracotta (`#ed7966`)
- Mice: Graphite (`#3d4248`) and Mist Silver (`#b9c5cb`)

## Exact edit prompts

### Laptops

`Use case: precise-object-edit. Asset type: ecommerce product colour variant. Input image: edit target. Change only the laptop's main exterior chassis finish to ${label}, including all visible lid, keyboard-deck, side, and lower-chassis surfaces that belong to the exterior finish. Keep the keyboard keys, screen, ports, vents, protective rubber trim, and small accent details appropriate and unchanged. Preserve the exact same fictional product design, geometry, camera angle, crop, composition, screen graphic, accessories, background, lighting, shadows, materials, and every other detail. Do not add, remove, reshape, or reposition anything. No text, no logos, no watermark.`

The first laptop batch used the same prompt with “rubber trim” in place of “protective rubber
trim”.

### Tablets

`Use case: precise-object-edit. Asset type: ecommerce product colour variant. Input image: edit target. Change only the tablet's main exterior finish to ${label}. Apply the selected finish consistently to the tablet's visible outer housing and any clearly colour-matched accessory shell, stylus, folio, controller, handle, or protective case primary surfaces; keep screens, black bezels, keyboard keys, ports, lenses, vents, and small contrasting accent details unchanged. Preserve the exact same fictional product design, geometry, camera angle, crop, composition, screen graphic, accessories, background, lighting, shadows, materials, and every other detail. Do not add, remove, reshape, or reposition anything. No text, no logos, no watermark.`

### Headphones

`Use case: precise-object-edit. Asset type: ecommerce product colour variant. Input image: edit target. Change only the audio product's main exterior colour to ${label}. Apply the selected colour consistently to the primary earcup, earbud, ear-hook, headband, fabric-band, and colour-matched charging-case exterior surfaces that are present. Keep cushions and inner padding appropriately dark or neutral, and keep metal hardware, cables, speaker grilles, ports, controls, tiny accents, and travel-case fabric unchanged unless they are clearly part of the product's main coloured shell. Preserve the exact same fictional product design, geometry, camera angle, crop, composition, background, lighting, shadows, materials, accessories, and every other detail. Do not add, remove, reshape, or reposition anything. No text, no logos, no watermark.`

### Speakers

`Use case: precise-object-edit. Asset type: ecommerce product colour variant. Input image: edit target. Change only the speaker product's main exterior finish to ${label}. Apply the selected finish consistently to the primary cabinet, housing, fabric wrap, or colour-bearing shell surfaces, including every speaker in a pair and the matching subwoofer when present. Keep black or neutral grilles, drivers, display glass, ports, controls, rubber end caps, feet, metal clips, tiny indicator lights, and small accent details unchanged unless a surface is clearly the product's main coloured exterior. Preserve the exact same fictional product design, geometry, camera angle, crop, composition, background, lighting, shadows, materials, accessories, and every other detail. Do not add, remove, reshape, or reposition anything. No text, no logos, no watermark.`

### Mice

`Use case: precise-object-edit. Asset type: ecommerce product colour variant. Input image: edit target. Change only the mouse's main exterior shell finish to ${label}, applying it consistently across every primary upper and lower shell panel. Keep rubber grip areas, scroll wheels, buttons, trackballs, ventilation openings, cables, receivers, feet, and small teal or coral accent details unchanged unless a surface is clearly part of the main exterior shell. Preserve the exact same fictional product design, geometry, camera angle, crop, composition, background, lighting, shadows, materials, accessories, and every other detail. Do not add, remove, reshape, or reposition anything. No text, no logos, no watermark.`

## Output naming

Every output uses this deterministic pattern:

`{product-slug}-{colour-slug}-0{view}.jpg`

For example, the two Warm Silver NovaBook outputs are
`aster-novabook-14-warm-silver-01.jpg` and
`aster-novabook-14-warm-silver-02.jpg`.
