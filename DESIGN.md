# DESIGN.md — Giải Mã Gia Đình (dichbome) — v2

> Bảng token normative theo định dạng Impeccable, sẵn sàng chép thành `DESIGN.md`
> ở gốc repo app khi implementation bắt đầu. Nguồn quyết định:
> `DESIGN-LANGUAGE.md`, `LAYOUT-SPEC.md`, `COPY-DIET.md` trong
> `~/workspace/mini-apps/redesign-v2/dichbome/`. Code render phải khớp file này.

## Creative North Star — «The Conversation Stage» (Sân khấu hội thoại)

Một tin nhắn lên sân khấu: câu gốc là bong bóng chat đứng một mình trong khung,
bản giải mã là lời đáp bước ra đáp lại. Trang là một khung `100dvh` không cuộn:
app bar ghim trên, composer ghim đáy, sân khấu ở giữa. Mọi nội dung phụ sống
trong **Board** sau một lối vào duy nhất.

**Signature component:** Phiếu giải mã sân khấu (Stage Slip) — lượt đáp có sân
khấu hoá: luôn đứng dưới bong bóng câu gốc của chính nó, mở đầu bằng hàng meta
ghi **nguồn engine**, gồm Ý thật (serif duy nhất của app) → Điều {vai} muốn nghe
→ Thước căng thẳng một-hue → 3 thẻ trả lời có nút sao chép có chữ.

## Colors

| Token | Value | Role |
|---|---|---|
| `--crimson` | `#C22A44` | Primary action, original-message bubble, mark, gauge fill, selection |
| `--crimson-deep` | `#A8243B` | CTA hover/pressed |
| `--crimson-ink` | `#8C1D31` | Crimson text on light, reply-bubble border, low-confidence chip text |
| `--crimson-tint` | `#F7E3E7` | Selected chip bg, offline source-label bg (never white text on it) |
| `--paper` | `#FAF6EF` | Page / stage background |
| `--stage` | `#FFFDF8` | Slip, composer, reply bubble surface |
| `--card` | `#FFFFFF` | Board cards |
| `--ink` | `#101418` | Primary text |
| `--muted` | `#49525C` | Secondary text |
| `--placeholder` | `#6B5F52` | Placeholder text only (own token — never an opacity blend) |
| `--line` | `#E7DDD0` | Decorative hairlines ONLY (1.25:1 — never a sole delimiter) |
| `--line-strong` | `#8A744A` | Input/control/card borders (≥3:1 on every adjacent surface) |
| `--warn-bg` / `--warn-ink` | `#FFF6D8` / `#8A6414` | System strips (offline, attention) — body text on it is `--ink` |
| `--confirm-bg` | `#F3EAD3` | Copy/save confirmation strip (body text `--ink`) |

### Contrast table (WCAG 2.x formula, computed 2026-10-23 on the real backgrounds)

| Pair | Ratio | Gate |
|---|---|---|
| ink / paper · ink / stage · ink / card | 17.17 · 18.20 · 18.50 | text ≥4.5 ✓ |
| muted / paper · stage · card | 7.37 · 7.81 · 7.94 | text ≥4.5 ✓ |
| placeholder / stage · paper | 6.10 · 5.76 | text ≥4.5 ✓ |
| white / crimson · white / crimson-deep | 5.66 · 7.05 | text ≥4.5 ✓ |
| crimson / paper · stage | 5.26 · 5.57 | text + focus ≥3 ✓ |
| crimson-ink / paper · tint | 8.35 · 7.32 | text ≥4.5 ✓ |
| warn-ink / warn-bg (icons/emphasis only) | 4.96 | non-text ≥3 ✓ |
| ink / warn-bg · ink / confirm-bg | 17.11 · 15.43 | text ≥4.5 ✓ |
| line-strong / stage · paper · card | 4.42 · 4.17 · 4.49 | border ≥3 ✓ |

### Named color rules
- **One Crimson Rule:** crimson only as primary action, original bubble, mark,
  selection, gauge fill, plus at most one text accent per screen.
- **No Glow Rule:** zero coloured shadows/glows (the live CTA's
  `rgba(194,42,68,0.22)` shadow is banned by name), zero gradients, zero
  decorative blur/glass. Depth = hairlines + the two neutral shadows below.
- **One Warm System Rule:** the cold host tokens (`#E1E4EA`, `#F2F4F7`) must not
  appear on any app surface. This file is the single token source.
- **Border Law:** any border that is the sole delimiter of a control/card must
  be `--line-strong`; `--line` is decoration only.
- **No Colour-Alone Rule:** tension, selection, engine source, errors always
  pair colour with text/number/position.
- **Gauge One-Hue Rule:** the tension gauge is crimson fill length + ink ticks
  + text labels. No multi-hue scale.

## Typography

| Role | Font | Scale |
|---|---|---|
| Display (stage idle title, OG) | **Fraunces** variable, `opsz`, WONK 0 SOFT 0, weights 600–700 | 30/37 mobile · 40/48 desktop |
| Slip serif («Ý thật» only) | Fraunces 560 | 17/26 |
| Title / wordmark | **Be Vietnam Pro** 700 | 17/24 |
| Body | Be Vietnam Pro 400/500 | 16/24 |
| Label | Be Vietnam Pro 600 | 14/20 |
| Caption (meta, counter, source label) | Be Vietnam Pro 400/600 | **12/16 — absolute floor, nothing smaller exists** |
| Input | Be Vietnam Pro 400 | 16/24 |

Font evidence (fontTools 4.46.0 on official google/fonts files, 2026-10-23):
Fraunces variable — Vietnamese precomposed set U+1EA0–U+1EF9 **90/90** (missing
only combining U+0309/U+0323 → render NFC, engine strings are precomposed);
Be Vietnam Pro — **90/90, auxiliary set 0 missing**. Outfit measured 2/90 and
Playfair Display is unloaded-but-unused in live code: **both are removed** —
Declared = Used Law: every loaded family must appear in computed styles; no
system serif (Georgia/Times) anywhere, including inline styles. Neither family
ships `tnum` in the measured files → counters/levels sit in fixed-width,
right-aligned boxes; do not claim tabular figures. Load via `next/font/google`
with `subsets: ['latin','vietnamese']`, `display: swap`; acceptance zoom-proof
of stacked diacritics («Giải Mã Gia Đình», «Ý thật», Ệ Ộ Ữ Ỡ) on mobile before
ship, plus a `document.fonts` check that both families report `loaded`.

**Banned:** all-caps tracked kickers/eyebrows above headings (detector-banned
pattern); 11px text anywhere; a third font family.

## Layout

Pattern: **Conversation Stage** — one `100dvh` frame, no page scroll. App bar
52 (mobile) / 56 (desktop) pinned top; composer pinned bottom of the stage
column; only the stage region scrolls internally. Scroll budget (revised
2026-10-23 after Panel #02 measured the shipped slip at stage 1325/579px —
the original "typical flow fits 795/844" estimate was wrong and is retired):
the first stage frame holds the whole "reading" part of a typical slip
(bubble + source row + Ý thật + Điều muốn nghe + full tension gauge);
replies + actions scroll internally under a sticky «Còn nội dung ở dưới»
indicator. Full budget, typical-case definition and measured baseline:
LAYOUT-SPEC §1 (revised). Desktop ≥1280px: stage column (max 640) centered +
Board column 380px at right, independently scrolling; below that the Board
is a full sheet. Spacing scale (only these): 4 · 8 · 12 · 16 · 24 · 32 · 48.
Radius: bubbles 18 · slip 16 · Board cards 14 · controls/composer 12 · chips 999.
Shadows: `--shadow-card: 0 1px 2px rgba(16,20,24,.05), 0 8px 24px rgba(16,20,24,.06)`;
`--shadow-lift: 0 2px 4px rgba(16,20,24,.06), 0 16px 40px rgba(16,20,24,.10)` —
neutral ink only, never on the CTA. No cards inside cards: slip sections divide
by hairlines; reply rows are flat rows inside the slip.

## Components

- **App bar:** mark 32 + real-text wordmark + one «Bảng» button (44px, saved
  count badge). No back arrow on the standalone app, no tagline, no blur.
- **Composer (pinned):** role = ONE horizontally scrolling chip row (16 roles,
  group separators inline, selection persisted across sessions); context =
  one button opening a radio sheet (9 options, never a chip wall); textarea
  auto-grow 1–4 rows, 500 chars, counter in a fixed-width box; [Dán] / [Xoá]
  44px inside the field edge; CTA «Dịch ý {vai}» 52px; `Ctrl/⌘+Enter`
  translates (hint shown on desktop); cancel button while translating.
- **Original bubble:** left-aligned, crimson, white text, meta line above it
  («{vai} nhắn · Hoàn cảnh: {context}»), max 2 lines preview, tap to expand.
- **Stage Slip (signature):** source meta row first (see Engine honesty),
  Ý thật (serif 560, 3-line preview), Điều {vai} muốn nghe (2-line preview),
  tension gauge, optional warning disclosure (closed by default), 3 reply
  rows (2-line preview each; copy always copies the full text), confirmation
  strip, actions (Lưu kết quả · Chia sẻ · Dịch câu khác). ONE shared
  «Đọc tiếp»/«Thu gọn» control expands every clamped block at once (revised
  2026-10-23, Panel #02 M-3 — the previous two separate expand buttons plus
  internal scroll were two competing "there is more" mechanisms). Internal
  section dividers and the gauge track use `--line-strong` (revised
  2026-10-23, N-6 — was the decorative `--line` at 1.32:1). Once saved, the
  «Đã lưu» action opens the Board's Saved tab instead of un-saving
  (revised 2026-10-23, N-5a; un-save lives on the Board card's delete +
  8s undo).
- **Tension gauge:** printed ruler — ticks 0–5 in ink, crimson fill by level,
  text at both ends («nhẹ nhàng» / «rất căng») and a text value
  («Mức 3/5 · {dangerLabel}»). One term everywhere: **«Mức căng thẳng»**.
- **Reply rows:** flat rows; style label + text + copy button 44×44 **with the
  visible word «Sao chép»** (never icon-only).
- **Board (Pinterest):** one entry, four tabs (Câu mẫu · Đã lưu · Lịch sử ·
  Tìm hiểu). Examples/Saved = masonry with naturally varying card heights
  (uniform grids banned); History = chronological list; Find-out tab holds
  intro + 3 steps + classic phrases + FAQ + privacy as disclosures, all
  server-rendered for SEO, all closed by default.
- **Sheets/dialogs:** context picker, Board (<1280px), destructive-action
  confirmation, undo bar (8s) for every deletion.

## Engine honesty (design-level contract for implementation)

- `TranslateResult` presentation must carry **source** (`Máy chủ` / `Trên máy`)
  and **confidence tier**; the slip's meta row always renders both as text
  ≥12px. Saved/History items persist their source and show it in the Board.
- **Not-enough-meaning state is a first-class stage state:** no rule match AND
  no recognised Vietnamese token (vocabulary = union of both engines' rule
  keys + an interjection list covering real curt replies like «Ừ», «Dạ») →
  honest card, no meaning, no gauge, no replies, no History write; the
  role-fallback reading is reachable only via the user's explicit tap and is
  always badged «Độ tin cậy thấp», with the gauge replaced by the text
  «Chưa đủ dữ kiện để chấm mức căng thẳng cho câu này.»
- Offline/fallback slips add the reconciliation line: «Bản trên máy có thể
  khác bản máy chủ — có mạng lại, bấm Dịch lại để đối chiếu.»
- **Copy honesty:** success = persistent text strip «Đã sao chép câu trả
  lời.»; failure = error strip + the reply rendered in a pre-selected manual
  copy box. Setting a success state after a swallowed clipboard error is
  banned (live `copyReply` does exactly this).
- **Destructive honesty:** delete-all requires the in-Board confirmation
  (states items live only on-device); every deletion is undoable for 8s.
  Saving beyond 20 must refuse visibly — silent eviction (live `slice(0,20)`)
  is banned.

## Motion

Named list only: `bubble-in` 160ms · `slip-answer` stagger 60ms per block ·
`gauge-fill` 400ms · `typing-dots` (loading — the logo's reply-bubble dots,
never the framework's default pulse skeleton) · `board-sheet` 220ms. All
transform/opacity. `prefers-reduced-motion`: instant/fade-minimal, dots static.

## Imagery

Mascot per BRAND.md, evolved with ONE added element (reply bubble — see
ASSETS.md rationale); original geometry untouched. Imagery appears only in:
OG art, the stage idle state (empty-state spot ≤150px wide), and the Board
Find-out banner (fixed 3:1 frame, mascot face never cropped). No stock
photos, no 3D gloss, no decorative illustration inside the core flow, no
placeholder «lines-for-text» artwork. No user avatars exist in this product;
DiceBear is **not** used (no member/person entities).

## Accessibility commitments (design-level)

Hitboxes ≥44×44 (CTA 52). **Every** interactive element has a `focus-visible`
ring: 2px `--crimson`, offset 2px (5.26:1 on paper / 5.57:1 on stage);
textarea focus = `--crimson-ink` border (8.35:1) + ring. Text contrast per
the table (all text pairs ≥4.5:1, borders/focus ≥3:1 on the real adjacent
background). Minimum text size 12px. Result region `aria-live`, focus moves
to the «Ý thật» heading after translation; Board sheet traps focus, `Esc`
closes, focus returns to the «Bảng» button. States never signalled by colour
alone. Terminology is singular: «Mức căng thẳng», «Đã lưu», «Bảng».

## App shell & offline

- **Service worker:** register on first load; precache the app shell (HTML,
  CSS, JS, font subsets, v2 icons) **and the client-engine data + local
  examples**, so the tool opens *and translates* while offline — never the
  browser's raw offline page.
- **Cache strategy:** shell = cache-first (new version announced inside the
  Board, never a forced mid-session reload); translate API = network-only
  (results are personal data — they enter History/Saved only through the
  app's own storage, never the SW cache); offline navigations fall back to
  the cached shell.
- **Two-engine behaviour:** online → API engine (label `Nguồn: Máy chủ`);
  offline or API failure → client engine (labels `Nguồn: Trên máy` /
  `Nguồn: Trên máy · Đang offline`) with the reconciliation line. Nothing
  else degrades; Board, Saved, History are local and fully offline.
- **Offline indicator:** one-line sticky strip directly under the app bar
  (36px, `--warn-bg`, ink text: «Đang offline — vẫn dịch được bằng dữ liệu
  trên máy.»), auto-hidden on reconnect, **plus** the per-slip source label —
  two layers, one truth, friendly Vietnamese, no raw browser errors.
- **Installable:** service worker + the existing standalone manifest
  (`theme_color #C22A44`, `background_color #FAF6EF`, v2 icon set incl.
  maskable) must together satisfy the PWA install criteria; the installed
  app launches offline from the cached shell. (Requirement source: W5-01,
  `~/workspace/mini-apps/redesign/CONSTRAINT-OFFLINE-W5-01.md`.)

## Do / Don't

- Do keep one primary action per view; do let the slip answer the bubble
  in place; do write UI copy in lived-in, product-specific Vietnamese.
- Don't scroll the page; don't put anything above the stage; don't add a
  second accent colour, a coloured glow, a kicker, a bottom nav, a uniform
  card grid, or a third font; don't present a fallback as a confident
  result; don't report a copy that did not happen.
