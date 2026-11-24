# Karinderya ni Lola — Game Design

Lola has passed away and left her apo (the player) her karinderya and her
recipe notebook. Keep the karinderya alive, one day at a time.

**Platform:** browser, phone-first portrait (one thumb). Works on tablets and
PC: the play area stays a fixed 360×640 core and extra scenery fills wider or
taller screens.
**Art:** flat cartoon, thick outlines, drawn in code on a canvas.

## Day loop

1. **Morning: Lola's notebook.** Pick what to cook (up to 3 kaldero). Each
   dish costs ingredients (*puhunan*).
2. **Cooking.** Each recipe is 2–4 mini-game steps. Average score → 1–3 stars.
   Stars add a tip to every order of that dish.
3. **Lunch rush (2 minutes, 11 AM–2 PM).** Plate orders at the counter, collect
   dirty plates, wash them.
4. **Evening tally.** Sales, costs, profit, mistakes, suki hearts, Lola's note.

## Cooking mini-games

| Type  | Gesture                          | Used for                                   |
|-------|----------------------------------|--------------------------------------------|
| chop  | tap when the knife is on the line | garlic, kamatis, patatas/karot            |
| flip  | tap when heat is in the green     | manok, talong (grill), torta, isda        |
| pour  | hold, release inside the band     | toyo + suka, sampalok (asim), tomato sauce |
| stir  | drag in circles, not too fast     | adobo, sinigang, menudo                    |
| mash  | tap fast against the clock        | pitpit talong, asin sa isda                |

## Recipes

| Dish               | Price | Puhunan | Unlocks | Steps                              |
|--------------------|-------|---------|---------|------------------------------------|
| Adobong Manok      | ₱60   | ₱300    | Day 1   | chop, flip, pour (toyo+suka), stir |
| Tortang Talong     | ₱45   | ₱200    | Day 1   | flip (grill), mash, flip           |
| Sinigang na Baboy  | ₱75   | ₱350    | Day 2   | chop, pour (asim), stir            |
| Pritong Galunggong | ₱50   | ₱220    | Day 3   | mash (asin), flip                  |
| Menudo             | ₱65   | ₱320    | Day 4   | chop, pour (sarsa), stir           |
| Kare-kare          | —     | —       | later   | not built yet                      |

Each cooked dish = 10 orders (20 half-scoops) in its kaldero.

## Lunch rush

- The apo starts behind the counter (kitchen: sink, plate rack, rice cooker,
  sinangag wok). The counter has openings at both ends.
- Up to 3 customers wait at the counter with an order bubble and a patience bar.
- **Tap a customer → plating screen.**
  - The order card shows the customer's sentence and a checklist:
    ulam, rice, sabaw. Each line turns ✓ green, ✗ red or stays empty as you plate.
  - **One tap on an ulam = one full order.** Tapping a second, different ulam
    turns the plate into half-half.
  - Kanin (₱15) or sinangag (₱20), 1–3 scoops. Sabaw is free and toggles.
  - Tap food on the plate to remove it. ULITIN clears the plate. IABOT hands it over.
  - Correct: price + tip (stars, speed, suki). Wrong: price only, counted as *mali*.
- Customers seat themselves and eat. They leave a dirty plate that blocks the seat.
- **Plates:** 6 clean plates. Walk out, tap a dirty plate to pick up every plate
  on that table (carry up to 6), tap the sink to wash. No clean plates = no service.
- Movement: tap to walk, A* pathfinding around tables and the counter.

## Suki

- **Mang Kanor** (jeepney driver, loves adobo)
- **Aling Bebang** (tindera sa palengke, loves torta)

They come once a day if their dish is cooked, wear a name tag, and gain a heart
when served correctly.

## Roadmap / ideas

- **Helpers & upgrades:** unlock the apo's sister to collect and wash plates;
  bigger carry stack; more kaldero slots; more plates; faster rice cooker.
- **Mid-rush re-cook** ("Magluto pa") when a kaldero runs low.
- **More recipes:** kare-kare, bistek, pinakbet, lumpia, dinuguan.
- **Suki quirks:** "Yung toasted part ha!", utang ("lista mo muna"), regular schedules.
- **Events:** brownout, rainy day (sopas/lugaw sell more), fiesta, payday (15th/30th).
- **Save progress** between sessions.
- **Sound & music.**
