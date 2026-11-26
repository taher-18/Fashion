# STYLE RULES (the engine's brain)

These are the rules the outfit engine and the AI stylist must follow. Weights are a starting point; tune in code.
Format: rule → effect (points) → reason text shown to Taher.

## Contrast and color
1. Top and pants are the exact same color → -3 → "Top and pants look flat together"
2. Top and pants lightness differ by 40+ → +2 → "Top stands out against the pants"
3. Top and pants lightness differ by less than 12 → -1 → "Top and pants are too close in shade"
4. Navy/royal layered directly on or under black (jacket over top, or top over tee) → -2 → "Navy and black blend into each other"
   - Navy top with black pants is allowed (no penalty). The ban is only for stacked top layers.
5. Cream next to white in the same outfit (top layers) → -1 → "Cream next to white looks faded"
6. Black on black on black (top, pants, shoes all black) → -1 → "All black looks heavy, add a light piece"
7. Brown shoes with a navy top → -1 → "Brown shoes clash with navy here"

## Layering
8. Zip hoodie MUST have a tee under it. Tee is 40+ lighter than the hoodie → +1.5 → "Light tee pops under the zip". Otherwise → -1 → "Go lighter under the zip"
9. Best tees under zip hoodies: white first, then light grey, then cream. Never navy or black under royal blue.
10. Two hoods stacked (hooded jacket over a hoodie or zip hoodie) → -1.5 → "Two hoods get bulky"
11. Burgundy puffer: only white, black or grey under it, with dark jeans → +1, otherwise -1.5 → "Too much color with the burgundy puffer"
12. Black puffer over black top → -1 → "Black puffer over black gets heavy"

## Pairings that work (bonuses)
13. Tan/brown suede jacket + blue denim → +2 → "Tan suede and blue denim are a classic match"
14. Tan/brown suede + white/cream/grey layer underneath → +1 → "Light layer under the suede looks clean"
15. Tan/brown suede + olive Timberlands → +1 → "Olive Timberlands suit the suede"
16. Royal blue top + lighter blue denim → +0.5 → "Royal blue with lighter denim works"
17. White sneakers → +1 → "White sneakers keep it fresh" (default casual shoe)
18. Cream/beige shirt + black trousers + black shoes → +1.5 → "Polished and clean"

## Occasion fit
19. Average outfit formality vs occasion target: -2 per 1.0 gap. Within 0.35 → "Right level of dressy"
20. Joggers on Date or Her family → -3 → "Joggers are too relaxed here"
21. Ripped jeans on Her family → -2; on Date → -0.8
22. Fleece hoodie on Her family → -1.5
23. Graphic tee on Date or Her family → -1.5 → "Graphic tee is too casual here"
24. Puffer (bulky) indoors (Cinema) when weather is not Cold → -1 → "Puffer is bulky in a cinema seat"
25. Puffer on Date / Her family → -0.5 (prefer suede or a cleaner jacket)
26. Meeting her family: prefer mature smart-casual (dark jeans or trousers, clean light top, suede or neat jacket, clean shoes).
27. Semi-formal: needs a shirt; tuck it in; black belt with black trousers; watch.

## Taste notes (Taher's own words)
- He wants ONE clear best answer, not a long list of maybes.
- When torn between two pieces, pick whichever looks better ON HIM, ignoring other factors.
- Dark blue jeans read more mature; light blue is for relaxed outings.
- Slim blue jeans look sharper on him than the baggier black ripped pair.
- The navy Tommy zip hoodie looks cleaner on him than the bulky black puffer.
- Keep white sneakers clean and press the white tee for important outings.

## History
- Main top or jacket worn in the last 3 outfits → -1.2 → "You wore this recently"
- Combo rated thumbs up before → +1; thumbs down → -2
