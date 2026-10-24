# RoseWave website artwork

Six still compositions rendered in Blender 5.1.2 / Cycles, using the original RoseWave watercolor wash and transparent sun from the app's opening artwork. These are new website compositions, with independently placed sun and eight editable wave meshes. Text stays in HTML.

| Area | Desktop | Mobile | Composition |
| --- | --- | --- | --- |
| Introduction | 1920 × 600 | 900 × 900 | Ivory copy field; sun and waves below/right of the headline |
| About | 1920 × 800 | 900 × 1200 | Plum copy field; low waves leave the story readable |
| Footer | 1920 × 320 | 900 × 360 | Short panoramic/phone horizons, with circular suns |

`rosewave-web.blend` contains all six named scenes with both source textures packed. The browser loads just the appropriate composition through `<picture>` at the gallery's 900px breakpoint. Public WebPs are in `nextjs-elements/public/revamp/rosewave-gallery/artwork/`; each is under 25 KB.

To re-render from this directory:

```powershell
blender --background rosewave-web.blend --python render.py -- --output path/to/pngs
```

To rebuild the scene, pass `--source` pointing to the original `rose-wave-opening/assets` folder containing `sun.png` and `watercolor.png`. The original app scene is not modified. Export the resulting PNGs to WebP quality 90, method 6. Keep PNG intermediates outside the public asset folder.
