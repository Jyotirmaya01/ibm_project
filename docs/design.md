# AnnaSetu AI --- Design System and Brand Direction

**Design objective:** Warm, human, dependable and easy to use under time
pressure. AnnaSetu should feel community-led and trustworthy---not cold
enterprise software, not a generic AI dashboard, and not an overly
luxurious product. Premium craft means clarity, consistency and care.

## 1. Emotional design principles

-   **Dignity:** never portray recipients as helpless or use pity-driven
    imagery. Show people as capable community members.
-   **Trust:** clear food details, real photos, transparent status and
    honest uncertainty.
-   **Calm urgency:** make pickup deadlines visible without alarmist red
    everywhere.
-   **Low friction:** donors may be posting food while an event is
    ending; forms must be short, save progress and explain required
    fields.
-   **Fairness:** make allocation logic understandable and avoid visual
    favoritism.
-   **Human control:** clearly show what AI assessed, what a person
    decided and what is confirmed.
-   **Accessible by default:** readable text, large touch targets, clear
    focus states and good contrast.

## 2. Brand concept and logo

### Concept

A simple bridge/connection motif combined with a leaf or two gently
connected bowls/plates. The mark should communicate "food connects
communities" and the meaning of *Setu* (bridge) without using a literal
AI robot, glowing brain, generic circuit head, hands holding a heart, or
an over-detailed illustration.

### Logo requirements

-   Primary logo: distinctive geometric symbol plus `AnnaSetu` wordmark.
-   Optional descriptor: `Food Rescue Network` (not required in every
    placement).
-   Symbol must remain recognizable at 24×24 px and as a one-color mark.
-   Create light and dark variants, app icon, favicon and monochrome
    version.
-   Avoid gradients as the only way the mark works; the icon must work
    in flat color.
-   Maintain clear space around the mark and never distort it.
-   Do not invent or use a generated logo as final without reviewing
    legibility, originality and small-size behavior.
-   App icon should use the bridge/leaf motif, not tiny text.
-   Provide SVG source and exported PNG assets when the actual logo is
    created.

## 3. Color system

Use semantic tokens so contrast can be adjusted globally. This palette
should feel fresh and grounded: leafy green for trust/action, warm
marigold for food/attention, creamy neutral backgrounds for warmth, and
ink for legibility.

  -----------------------------------------------------------------------
  Token                   Hex                     Use
  ----------------------- ----------------------- -----------------------
  `brand-forest`          `#1F5D46`               Primary brand, primary
                                                  buttons

  `brand-deep`            `#164333`               Pressed/strong states,
                                                  dark surfaces

  `brand-leaf`            `#3F8061`               Secondary accents,
                                                  illustrations

  `brand-sage`            `#DDEBE1`               Soft backgrounds and
                                                  selected states

  `brand-cream`           `#FAF7EF`               Warm app background

  `brand-paper`           `#FFFFFF`               Cards and form surfaces

  `brand-marigold`        `#E8A83E`               Attention, food accent,
                                                  non-critical highlights

  `brand-terracotta`      `#B85D43`               Warm accent; use
                                                  sparingly

  `ink-primary`           `#1C2923`               Main text

  `ink-secondary`         `#59665F`               Secondary text

  `line-default`          `#DCE4DD`               Borders/dividers

  `state-success`         `#237447`               Success status

  `state-warning`         `#8A5A00`               Warning text/icons

  `state-danger`          `#B42318`               Error/danger

  `state-info`            `#175CD3`               Informational state
  -----------------------------------------------------------------------

Rules: - Test contrast against WCAG AA targets before release; adjust
pairs if needed. - Never rely on color alone to communicate status; pair
with text/icon. - Marigold is an accent, not a default background for
long text. - Do not use a green safety badge to imply food is certified
safe. - Avoid neon greens, purple AI gradients, glassmorphism, heavy
blur and excessive gradients. - Dark mode may be added later using
semantic tokens, not by inverting colors mechanically.

## 4. Typography --- distinctive, not generic

Avoid defaulting to Inter everywhere. Use a purposeful, accessible
pairing: - **Headings and display:** `Plus Jakarta Sans` (600--700
weights) for a friendly, contemporary, crafted voice. - **Body and UI:**
`Source Sans 3` (400--600 weights) for excellent readability in forms,
instructions and data-heavy screens. - **Numbers/quantities:** use
`Source Sans 3` with tabular numerals where supported so quantities line
up. - **Fallbacks:** platform sans-serif fallbacks; never let missing
fonts break layout. - Self-host or bundle licensed font files where
appropriate; otherwise use a reliable font-loading strategy and provide
fallbacks.

Suggested scale (adjust after testing): - Display / landing headline:
36--44 px web, 30--36 mobile. - H1: 30--34 px web, 26--30 mobile. - H2:
24--28 px. - H3/card heading: 18--22 px. - Body: 16--17 px. -
Secondary/body small: 14--15 px. - Metadata: 12--13 px; never put
critical safety instructions only in tiny metadata. - Button: 15--16 px,
weight 600. - Line height: approximately 1.45--1.65 for body, 1.15--1.3
for headings. - Use sentence case. Avoid overly tight tracking, all-caps
labels and too many font weights.

## 5. Spacing, shape and interaction

-   Base spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px.
-   Mobile page gutters: typically 20 px; compact screens may use 16 px.
-   Card padding: 16--20 px; section gaps: 24--32 px.
-   Buttons: minimum 48 px height on mobile; web controls generally
    44--48 px.
-   Input fields: 48--56 px height, explicit labels, helper text and
    visible errors.
-   Radius: 10--12 px for controls, 16 px for cards, 20--24 px for major
    sheets/dialogs.
-   Use subtle 1 px borders and restrained shadows; no floating card for
    every element.
-   Motion: short, purposeful transitions (about 160--220 ms); respect
    reduced-motion settings.
-   Provide clear pressed, focus, disabled, loading and success states.
-   Destructive actions require a confirmation and an explanation.

## 6. Imagery and illustration

-   Prefer real, respectful photography of food containers, volunteers,
    community kitchens and handover moments.
-   Keep photos truthful: do not modify donated-food images to make food
    appear fresher or larger.
-   Show the donor's actual listing photos as supplied, with safe
    resizing/cropping that does not misrepresent contents.
-   Avoid stereotyped poverty imagery, staged pity, excessive
    stock-photo polish and AI-looking imagery.
-   Use simple line illustrations only for empty states or guidance.
-   Always provide image alt text and loading/error placeholders.

## 7. Information hierarchy

### Food listing card

1.  Actual food photo.
2.  Food type and available quantity/unit.
3.  Preparation time and pickup deadline.
4.  Approximate distance/area where privacy permits.
5.  Evidence status and actionable warning.
6.  Clear action: `View food`, `Request quantity` or `Manage listing`.

### Evidence panel

Use a neutral heading such as `Food information review` or
`Safety evidence`. Show: - What information was supplied. - What remains
missing. - What the model can visibly observe. - What cannot be
determined from a photo. - Whether clarification or human review is
required.

Never use "100% safe", "AI-certified" or a high green score as a safety
guarantee.

### Allocation panel

Show total available quantity, each recipient's requested and proposed
quantity, demand/capacity, reasons, deadline/feasibility and remaining
unallocated amount. Distinguish proposed, reserved, collected, delivered
and accepted quantities.

## 8. Key screen design

-   **Donor flow:** short stepper, clear progress, photo upload
    first-class, draft autosave, obvious pickup window and a final
    review before publish.
-   **Recipient discovery:** photo-forward cards, strong
    quantity/deadline metadata, clear evidence warnings and filters for
    need/compatibility.
-   **Recipient decision:** accept proposed quantity, edit/request
    smaller quantity, ask a question or decline; explain consequences.
-   **Chat:** distinguish system status events from human messages.
-   **Pickup:** timeline with ETA, current status, contact controls and
    recovery instructions.
-   **Operations dashboard:** dense but readable tables, clear exception
    queues, filters and audit history; avoid decorative charts without
    decisions attached.

## 9. Accessibility and localization

-   Target WCAG AA contrast for web.
-   Support screen readers, keyboard navigation, focus rings and
    scalable text.
-   Do not communicate state using color alone.
-   Use localization keys; do not hardcode visible strings in
    components.
-   Design for English first and later Indian-language translations,
    including longer labels.
-   Handle low bandwidth, upload interruption, small Android screens and
    keyboard overlap.

## 10. Design acceptance checklist

-   [ ] Font pairing is loaded correctly with robust fallbacks.
-   [ ] Buttons and inputs meet touch-size guidance.
-   [ ] Color contrast is tested.
-   [ ] Food photos remain truthful and clear.
-   [ ] Safety evidence is not visually presented as certification.
-   [ ] Allocation and handover states are unmistakably different.
-   [ ] Empty, loading, offline, error and success states exist.
-   [ ] Logo works in monochrome, small sizes and app icon.
-   [ ] The UI feels welcoming and dignified to donors and recipients.
