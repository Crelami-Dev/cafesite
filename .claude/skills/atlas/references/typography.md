# Typography as a design and engineering system

Typography determines reading, hierarchy, identity and layout. It is not a final cosmetic choice.

## Start with content

Collect real samples before selecting a family:

- The longest likely H1 and H2.
- A natural paragraph in the actual language.
- Product/person/place names.
- Prices, dates, units and changing data.
- A short and long action label.
- Validation/help text and navigation labels.

For Indonesian, test natural phrasing rather than forcing English-like fragments. For multilingual work, verify script coverage, punctuation, accent marks, word-breaking and font fallback for every required language. Do not use Latin-centric tracking rules for scripts where they damage reading.

## Define roles before sizes

| Role | Primary concern | Common mistake |
|---|---|---|
| Display | Identity and first understanding | Oversized slogan with weak meaning |
| Section heading | Scanning and argument structure | Every H2 treated like a second hero |
| Body | Sustained reading | Tight leading, weak contrast, long measure |
| Utility label | Orientation and state | Tiny uppercase text everywhere |
| Data | Alignment and accurate comparison | Decorative font obscuring digits/units |
| Control | Clear action and stable geometry | Label wrapping into a narrow button |
| Caption/help | Context and interpretation | Meaningful facts hidden in unreadable small text |

Use semantic heading levels independently from visual classes.

## Select families by behavior

Inspect x-height, cap height, counters, stroke contrast, width, punctuation, italics, numerals and weight range. Two fonts with the same CSS size can have very different perceived size.

Ask whether the family supports:

- Reading the actual copy at body sizes.
- The intended mood without costume-like exaggeration.
- Legible small labels and controls.
- Required languages and symbols.
- Useful normal/bold/italic variants without synthetic styling.
- A maintainable loading and licensing arrangement.

One well-chosen family can provide enough hierarchy. A second should have a clear job. Monospace belongs where alignment or technical content benefits, not as a universal “premium label” treatment.

Do not default every physical business to Playfair-like headings or every tool to a fashionable grotesk. The available brand assets and audience come first.

## Pair by contrast, not fashion

If using two families, distinguish their roles and compare their perceived sizes. A display serif can coexist with a quiet sans, but it is not mandatory.

Avoid pairing two nearly similar faces whose differences look accidental. Avoid giving every role a different font.

Test the combination in complete sections, not only a font specimen. A family can be attractive in a wordmark and poor for a long product name.

## Establish a provisional scale

Start with body readability and available space, then choose heading relationships.

Typical starting points for ordinary company pages may include 16-18px body, 28-48px section headings and a moderate display range. These are calibration examples, not universal Atlas rules. Dense tools, editorial publications and deliberate campaign posters have different needs.

Do not inflate H1 until the page appears designed. Choose size from line count, width, nearby media, action position and viewport height.

Use a limited set of roles. Avoid arbitrary one-off sizes unless an actual composition needs them.

## Fluid type with accessible bounds

A fluid value should preserve a readable floor and a sensible ceiling. Prefer a relative minimum/maximum and a fluid middle term; avoid relying entirely on viewport width.

Example principle:

```css
.page-title {
  font-size: clamp(2.25rem, 1.35rem + 3vw, 4.5rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
}
```

This is a demonstration of the mechanism, not a class to copy into every project. Test browser zoom and user font settings. A clamp does not automatically produce accessible scaling.

## Measure and line-height

Begin prose around 45-70 characters per line for Latin-script reading, then judge the actual font and audience. This is a heuristic, not a legal limit or accurate measurement from a crude width formula.

Use a comfortable body line-height, often around 1.5-1.7. Large display lines can be tighter when ascenders, descenders and accents remain clear.

Short utility labels can be more compact. Multiline buttons, hints and error messages still need breathing room.

Do not reduce font size to cure a paragraph that should be narrower or shorter.

## Wrapping is part of composition

Inspect headings at 320, 375, 390, tablet, short desktop and the intended wide layout.

Look for:

- An isolated short word.
- A final line detached from its meaning.
- A forced break that becomes awkward after stacking.
- Names/units split in misleading ways.
- Button labels wrapping asymmetrically.
- Clipping caused by fixed height or tight line boxes.

Use natural wrapping first. Consider text-wrap:balance for short headings or text-wrap:pretty for prose where supported and useful. Check current support; retain normal wrapping as fallback.

Use explicit line breaks only when the phrase, composition and responsive behavior justify them. Do not insert nonbreaking spaces throughout a heading to force one screenshot.

Do not make every heading contain the same italic final word.

## Tracking, case and optical adjustment

Apply letter spacing by type role and script. Display tracking may be slightly tighter; body copy usually needs normal spacing.

Uppercase can help a short utility label, but long uppercase phrases lose word shapes and increase width. Do not use huge tracking to simulate sophistication.

Review optical alignment: punctuation, italic overhang, large initial letters and mixed family baselines may need small deliberate adjustments. Do not use dozens of negative margins to rescue a fundamentally unsuitable face.

## Numbers and technical text

Use tabular numerals for changing counters, aligned prices and data comparisons when the font supports them. Proportional numerals can remain appropriate in prose.

Make units explicit. Do not use decorative spacing that separates a value from its unit or currency.

For code and identifiers, preserve copyability, readable punctuation and a controlled overflow strategy. A terminal aesthetic is not required for technical credibility.

## Contrast and emphasis

Use exact foreground/background pairs. Normal text typically needs at least 4.5:1 and qualifying large text 3:1. Font weight and actual rendered size matter.

Do not assume text is “decorative” because it is small. Captions, labels, dates and instructions often carry essential information.

Use weight, position and wording as well as color. Avoid long low-opacity paragraphs or a page where all text has identical emphasis.

## Loading and fallback

Load necessary families, weights and subsets only. Use the framework's font tooling when available. Do not include an entire variable family solely to animate a weight axis.

Test fallback before the webfont finishes or when it fails. Confirm headings, buttons and navigation retain usable geometry.

Metric adjustments can reduce fallback mismatch, but must be based on real font metrics. Do not apply font-size-adjust or @font-face overrides blindly, or stack them on top of framework adjustments without checking the result.

A font is not “loaded” merely because a CSS declaration exists. Check document.fonts and visible rendering; missing-glyph fallback can still occur.

## Reflow and text-spacing checks

Check enlarged text and narrow reflow. Do not disable zoom or clamp text into a fixed-height box.

Review the relevant WCAG text-spacing conditions when making accessibility claims: content must not break when users increase line, paragraph, letter and word spacing. A beautiful default screenshot does not prove that.

Ensure focus outlines, descenders and accents are not clipped by overflow-hidden wrappers.

## Typography review record

Record:

- Family/weight/subset and reason for the roles.
- Actual sample strings tested.
- Important sizes, measures and wrapping decisions.
- Font-loading/fallback observations.
- Narrow/short viewport results.
- Any user-settings or language coverage limitation.
- Strongest remaining typographic improvement and whether it was made.

## Technical sources

Verify current behavior against [MDN text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap), [MDN font-size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-size-adjust), and [WCAG text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html). Source checks complement the actual rendering test.
