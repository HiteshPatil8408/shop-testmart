# Product image generation manifest

Mode: new image generation (not editing)

Final outputs: `public/images/products/` (60 optimized 1200 × 900 JPEGs)

The prompts below document the exact text sent to the image generator. For every row except the first, concatenate the subject clause with the named suffix exactly as written; each suffix intentionally begins with a space.

## Shared suffixes

**A — computers and tablets**

` Original fictional industrial design for an ecommerce catalogue. Premium photorealistic studio product photography, landscape 4:3, centered single product, generous breathing room, warm off-white seamless background, soft grounded shadow, accurate physical geometry. Any screen may show only an abstract teal-and-coral geometric gradient. No people, no hands, no recognizable brand resemblance, no logos, no text, no watermark.`

**B — audio products**

` Original fictional industrial design for an ecommerce catalogue. Premium photorealistic studio product photography, landscape 4:3, centered product presentation, generous breathing room, warm off-white seamless background, soft grounded shadow, accurate physical geometry. No people, no hands, no recognizable brand resemblance, no logos, no text, no watermark.`

**C — mice**

` Original fictional industrial design for an ecommerce catalogue. Premium photorealistic studio product photography, landscape 4:3, centered single product, generous breathing room, warm off-white seamless background, soft grounded shadow, highly accurate physical geometry. No people, no hands, no recognizable brand resemblance, no logos, no text, no watermark.`

## Per-image prompts

- `aster-novabook-14-01.jpg` — `Create an original ecommerce product catalog image for a fictional laptop named NovaBook 14. Clean three-quarter front hero view of a slim balanced 14-inch ultrabook, distinctive deep navy aluminum body with a subtle teal hinge accent, screen showing only an abstract teal-to-coral geometric gradient with no words or symbols. Warm off-white seamless studio background, soft grounded shadow, premium photorealistic product photography, centered single product, ample breathing room, landscape 4:3 composition. No people, no hands, no recognizable brand resemblance, no logos, no text, no watermark.`
- `aster-novabook-14-02.jpg` + A — `Alternate rear three-quarter view of a slim 14-inch ultrabook in deep navy aluminum with a distinctive teal cylindrical hinge accent, lid mostly closed to reveal thin profile and ports.`
- `meridian-forge-16-01.jpg` + A — `Three-quarter front hero view of a powerful 16-inch mobile workstation laptop, graphite metal chassis, broad display, full keyboard, strong angular cooling vents, tiny coral power-key accent.`
- `meridian-forge-16-02.jpg` + A — `Alternate rear three-quarter view of a powerful 16-inch graphite mobile workstation laptop, lid open, emphasizing substantial cooling vents, port selection, and sturdy hinge architecture.`
- `velo-airleaf-13-01.jpg` + A — `Three-quarter front hero view of an exceptionally thin and light 13-inch laptop, satin silver magnesium body, pale mint edge accent, minimal keyboard deck and ultra-thin display.`
- `velo-airleaf-13-02.jpg` + A — `Alternate side profile view of an exceptionally thin satin-silver 13-inch laptop, lid partly open, showing featherweight wedge silhouette and minimal ports.`
- `northstar-studio-15-01.jpg` + A — `Three-quarter front hero view of a refined 15-inch creator laptop, warm charcoal aluminum body with a restrained coral trim, large color-rich display and oversized precision trackpad.`
- `northstar-studio-15-02.jpg` + A — `Alternate top-down three-quarter view of a warm-charcoal 15-inch creator laptop, lid open, highlighting the expansive trackpad, color-rich display, and subtle coral rear trim.`
- `aster-circuitbook-15-01.jpg` + A — `Three-quarter front hero view of a practical upgrade-friendly 15-inch laptop, matte slate-blue chassis, full keyboard with numeric keypad, visible but tasteful service-panel seam and multiple ports.`
- `aster-circuitbook-15-02.jpg` + A — `Alternate rear and side three-quarter view of a practical matte slate-blue 15-inch laptop, lid partly open, highlighting abundant ports, replaceable-access panel details, and squared hinge.`
- `meridian-fieldbook-14-01.jpg` + A — `Three-quarter front hero view of a rugged 14-inch field laptop, dark olive and graphite shell, reinforced rubber corners, sealed keyboard, carry-ready durable construction with a small teal latch accent.`
- `meridian-fieldbook-14-02.jpg` + A — `Alternate rear three-quarter view of a rugged dark-olive 14-inch field laptop, lid partly open, emphasizing reinforced corners, covered ports, thick protective shell, and sturdy hinges.`
- `solace-canvas-11-01.jpg` + A — `Three-quarter hero view of an 11-inch creative tablet in deep teal anodized metal, slim even bezels, accompanied by a matching unbranded precision stylus resting alongside.`
- `solace-canvas-11-02.jpg` + A — `Alternate rear three-quarter view of an 11-inch deep-teal creative tablet on a minimal folding stand, showing a clean single camera detail and magnetic stylus rail, stylus attached.`
- `ember-slate-10-01.jpg` + A — `Three-quarter hero view of a friendly 10-inch entertainment tablet, smooth charcoal body, rounded corners, slim bezels, landscape orientation designed for reading and streaming.`
- `ember-slate-10-02.jpg` + A — `Alternate low side view of a charcoal 10-inch entertainment tablet propped in a simple coral folio stand, showing thin profile, stereo speaker openings, and rounded corners.`
- `solace-pocketpad-8-01.jpg` + A — `Three-quarter hero view of a compact 8-inch travel tablet, pale coral metal back and thin charcoal front bezel, portrait-friendly proportions, lightweight rounded shape.`
- `solace-pocketpad-8-02.jpg` + A — `Alternate rear three-quarter view of a compact pale-coral 8-inch travel tablet, showing its small scale, slim edge, single camera, and subtle teal power button.`
- `quanta-board-pro-13-01.jpg` + A — `Three-quarter hero view of a productivity-focused 13-inch tablet in graphite, attached to a slim detachable charcoal keyboard cover with a precise trackpad, tablet screen in landscape.`
- `quanta-board-pro-13-02.jpg` + A — `Alternate side and rear three-quarter view of a graphite 13-inch productivity tablet with detachable keyboard and integrated kickstand, emphasizing the hinge and tablet-to-laptop versatility.`
- `ember-playtab-11-01.jpg` + A — `Three-quarter hero view of a high-refresh 11-inch gaming tablet, dark navy chassis with restrained teal cooling accents, wide landscape display, paired with two small detachable unbranded game controls.`
- `ember-playtab-11-02.jpg` + A — `Alternate rear three-quarter view of a dark-navy 11-inch gaming tablet, showing angular cooling lines, wide stereo vents, detachable controls, and a restrained coral trigger accent.`
- `quanta-junior-tab-01.jpg` + A — `Three-quarter hero view of a durable child-friendly tablet without any child present, 9-inch display inside a chunky soft-touch teal protective bumper with coral corner grips and a sturdy integrated handle.`
- `quanta-junior-tab-02.jpg` + A — `Alternate rear three-quarter view of a child-friendly tablet in a chunky teal-and-coral protective bumper, showing the integrated handle folded into a kickstand and deeply protected corners.`
- `sonora-hushwave-700-01.jpg` + B — `Hero three-quarter view of premium wireless over-ear noise-cancelling headphones, deep navy oval earcups, plush charcoal cushions, elegant teal metal yokes and padded headband.`
- `sonora-hushwave-700-02.jpg` + B — `Alternate folded three-quarter view of premium deep-navy over-ear noise-cancelling headphones beside a sculpted charcoal travel case, showing swivel hinges and plush cushions.`
- `kinetic-loop-buds-01.jpg` + B — `Hero presentation of a pair of compact true-wireless sport earbuds with secure flexible ear fins, matte teal bodies with tiny coral accents, arranged beside an open pebble-shaped charging case.`
- `kinetic-loop-buds-02.jpg` + B — `Alternate top-down product view of matte-teal sport earbuds seated inside an open pebble-shaped charging case, clearly showing flexible stabilizing fins and compact ergonomic tips.`
- `sonora-studio-monitor-50-01.jpg` + B — `Hero three-quarter view of professional wired over-ear monitoring headphones, large graphite circular earcups, exposed brushed-metal adjustment arms, thick neutral cushions, coiled cable placed neatly.`
- `sonora-studio-monitor-50-02.jpg` + B — `Alternate side profile and folded-flat view of professional graphite wired monitoring headphones, highlighting large circular earcups, metal adjustment markings without text, and a detachable cable socket.`
- `kinetic-cloudlite-300-01.jpg` + B — `Hero three-quarter view of an ultra-light wireless computer headset, pale gray slim headband, breathable light cushions, subtle teal rings, and a clean retractable boom microphone.`
- `kinetic-cloudlite-300-02.jpg` + B — `Alternate side and rear three-quarter view of an ultra-light pale-gray wireless headset, showing the retractable boom microphone, thin flexible headband, and breathable ear cushions.`
- `auraloom-openair-01.jpg` + B — `Hero presentation of a pair of open-ear wireless sport headphones, lightweight dark-teal ear hooks that curve around rather than block the ear canal, small charcoal speaker pods, arranged neatly with a slim charging cradle.`
- `auraloom-openair-02.jpg` + B — `Alternate top and side product view of open-ear dark-teal sport headphones resting in their slim charging cradle, emphasizing flexible ear-hook geometry and non-occluding speaker pods.`
- `auraloom-nightsong-01.jpg` + B — `Hero three-quarter view of a soft sleep-headphone headband, breathable midnight-blue fabric band with flat concealed speakers and a tiny coral control tab, gently curved to show wearable form without a person.`
- `auraloom-nightsong-02.jpg` + B — `Alternate laid-flat top-down product view of a midnight-blue fabric sleep-headphone headband, showing the soft woven texture, ultra-flat speaker zones, and small removable control module.`
- `echopeak-room-one-01.jpg` + B — `Hero three-quarter view of a compact home speaker, rounded rectangular body wrapped in warm light-gray acoustic fabric, dark-navy top surface with a subtle teal status ring, no visible controls or symbols.`
- `echopeak-room-one-02.jpg` + B — `Alternate rear three-quarter view of a compact light-gray fabric home speaker, showing its rounded form, a clean recessed power connection, and dark-navy top with subtle teal status glow.`
- `roamworks-trailbeat-01.jpg` + B — `Hero three-quarter view of a rugged portable outdoor speaker, horizontal cylindrical body in dark teal woven mesh, graphite rubber end caps, integrated coral carry loop, weather-resistant detailing.`
- `roamworks-trailbeat-02.jpg` + B — `Alternate vertical and rear three-quarter view of a rugged dark-teal cylindrical outdoor speaker, emphasizing sealed graphite controls without text, grippy rubber end cap, and coral carry loop.`
- `echopeak-cinema-bar-01.jpg` + B — `Hero three-quarter view of a refined television soundbar, long low-profile charcoal body with seamless perforated grille, gently faceted ends, slim wireless subwoofer standing beside it, subtle teal light line.`
- `echopeak-cinema-bar-02.jpg` + B — `Alternate rear three-quarter view of a low-profile charcoal television soundbar and slim subwoofer, showing clean recessed connection bay without labels, wall-mount geometry, and gently faceted ends.`
- `roamworks-pocket-pulse-01.jpg` + B — `Hero three-quarter view of a tiny clip-on portable speaker, compact coral rounded-square body, dark teal perforated grille, integrated graphite carabiner clip, playful but premium outdoor design.`
- `roamworks-pocket-pulse-02.jpg` + B — `Alternate rear and side close product view of a tiny coral clip-on speaker, emphasizing integrated graphite carabiner, sealed edge controls without symbols, and rugged rounded construction.`
- `harmonic-grid-duo-01.jpg` + B — `Hero presentation of a matched pair of compact powered bookshelf speakers, warm walnut side panels, charcoal woven grilles, subtle teal indicator on the right speaker, balanced modern hi-fi proportions.`
- `harmonic-grid-duo-02.jpg` + B — `Alternate rear three-quarter presentation of a matched pair of compact walnut-and-charcoal powered bookshelf speakers, one turned to show a clean connection panel without text and rear bass port.`
- `harmonic-field-clockradio-01.jpg` + B — `Hero three-quarter view of a calm bedside alarm radio speaker, low rounded rectangular body in warm sand-colored fabric, coral top dial, dark navy face with only an abstract sunrise glow and no numerals or text.`
- `harmonic-field-clockradio-02.jpg` + B — `Alternate top and rear three-quarter view of a sand-fabric bedside radio speaker, highlighting the tactile coral dial, soft rounded body, and clean rear power recess, no clock numerals or text.`
- `pixelgrove-precision-s-01.jpg` + C — `Hero three-quarter view of a refined ergonomic wireless productivity mouse, graphite sculpted body, quiet main buttons, brushed teal thumb rest, two subtle side buttons and precision scroll wheel.`
- `pixelgrove-precision-s-02.jpg` + C — `Alternate left-side and rear three-quarter view of a graphite ergonomic productivity mouse, emphasizing the brushed-teal thumb rest, sculpted palm support, side controls, and precise wheel.`
- `vectorfox-sprint-8-01.jpg` + C — `Hero three-quarter view of an ultra-light competitive gaming mouse, crisp off-white shell with carefully engineered triangular ventilation cutouts, dark-teal interior, coral scroll wheel accent, symmetrical low shape.`
- `vectorfox-sprint-8-02.jpg` + C — `Alternate top and rear three-quarter view of an off-white ultra-light gaming mouse, highlighting triangular ventilation pattern, flexible dark-teal cable, coral wheel, and low symmetrical geometry.`
- `pixelgrove-travel-dot-01.jpg` + C — `Hero three-quarter view of a tiny portable wireless travel mouse, smooth pebble-like pale-teal body, minimal split buttons, compact coral scroll wheel, no visible branding.`
- `pixelgrove-travel-dot-02.jpg` + C — `Alternate top-down and side profile view of a tiny pale-teal pebble-shaped travel mouse, emphasizing its low compact silhouette and a discreet storage door underneath placed beside it.`
- `vectorfox-command-12-01.jpg` + C — `Hero three-quarter view of a feature-rich MMO gaming mouse, matte charcoal sculpted body, organized grid of twelve small teal thumb buttons, coral scroll-wheel ring, controlled premium styling without glowing logos.`
- `vectorfox-command-12-02.jpg` + C — `Alternate left-side close three-quarter view of a charcoal MMO gaming mouse, clearly emphasizing the organized twelve-button teal thumb grid, supportive palm shape, and coral wheel ring.`
- `kinova-vertical-ease-01.jpg` + C — `Hero three-quarter view of a calm ergonomic vertical mouse, tall handshake-shaped body in warm light gray, dark-navy inner grip, subtle teal thumb shelf, coral precision wheel accent.`
- `kinova-vertical-ease-02.jpg` + C — `Alternate front and left-side three-quarter view of a warm-light-gray ergonomic vertical mouse, emphasizing the natural handshake angle, dark-navy grip surface, teal thumb shelf, and stable base.`
- `kinova-track-orbit-01.jpg` + C — `Hero three-quarter view of a wireless thumb trackball mouse, sculpted deep-navy body with a large exposed teal trackball at the thumb, soft charcoal palm area, coral wheel accent.`
- `kinova-track-orbit-02.jpg` + C — `Alternate top and left-side close three-quarter view of a deep-navy thumb trackball mouse, clearly emphasizing the large teal ball, contoured charcoal palm rest, coral wheel, and stable ergonomic base.`
