# Responsive Design - Visual Reference Guide

## 📐 BREAKPOINT OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESPONSIVE BREAKPOINTS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PHONE          │ TABLET         │ DESKTOP                      │
│  < 768px        │ 768 - 1024px   │ ≥ 1024px                    │
│                 │                │                              │
│  • iPhone SE    │ • iPad Mini    │ • iPad Pro 12.9"            │
│  • iPhone 12    │ • iPad Air     │ • Web Browser               │
│  • iPhone 14    │ • iPad (10.2") │ • Desktop Computer          │
│                 │                │                              │
│  375px-430px    │ 768px-1024px   │ 1024px+                     │
│  (Typical)      │ (Typical)      │ (Typical)                   │
│                 │                │                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 LAYOUT PATTERNS BY SCREEN SIZE

### Pattern 1: 1 Column → 2 Columns → 3 Columns

```
PHONE (< 768px)        TABLET (768-1024px)    DESKTOP (≥ 1024px)

┌──────────────┐      ┌──────┐ ┌──────┐     ┌────┐ ┌────┐ ┌────┐
│   Card 1     │      │ C1   │ │ C2   │     │C1  │ │C2  │ │C3  │
├──────────────┤      ├──────┤ ├──────┤     ├────┤ ├────┤ ├────┤
│   Card 2     │      │ C3   │ │ C4   │     │C4  │ │C5  │ │C6  │
├──────────────┤      ├──────┤ ├──────┤     ├────┤ ├────┤ ├────┤
│   Card 3     │      │ C5   │ │ C6   │     │C7  │ │C8  │ │C9  │
├──────────────┤      └──────┘ └──────┘     └────┘ └────┘ └────┘
│   Card 4     │
├──────────────┤
│   Card 5     │
├──────────────┤
│   Card 6     │
└──────────────┘

Code Pattern:
width: isPhone ? '100%' : isTablet ? '48%' : '31%'
```

---

## 🔤 TYPOGRAPHY SCALING

```
┌────────────────────────────────────────────────────────────────┐
│                    FONT SIZE SCALING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BASE SIZE × SCREEN MULTIPLIER = DISPLAYED SIZE                │
│                                                                  │
│  Phone (1.0x)    │ Tablet (1.1x)    │ Desktop (1.2x)           │
│  ─────────────── │ ─────────────    │ ───────────              │
│  32 × 1.0 = 32   │ 32 × 1.1 = 35    │ 32 × 1.2 = 38           │
│  24 × 1.0 = 24   │ 24 × 1.1 = 26    │ 24 × 1.2 = 29           │
│  16 × 1.0 = 16   │ 16 × 1.1 = 18    │ 16 × 1.2 = 19           │
│  12 × 1.0 = 12   │ 12 × 1.1 = 13    │ 12 × 1.2 = 14           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 SPACING/PADDING SCALING

```
┌────────────────────────────────────────────────────────────────┐
│               SPACING & PADDING SCALING                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Base Padding: 16px (Phone)                                    │
│                                                                 │
│  Phone    │ Tablet   │ Desktop                                 │
│  ───────  │ ───────  │ ───────                                 │
│  16px     │ 18px     │ 21px   ← Edge padding                  │
│  12px     │ 14px     │ 16px   ← Internal spacing              │
│  8px      │ 9px      │ 11px   ← Small gap                     │
│                                                                 │
│  Multiplier: 1.0x  │  1.1x  │ 1.3x                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 RESPONSIVE GRID LAYOUTS

### Grid Option 1: Equal Columns
```
PHONE           TABLET          DESKTOP
1 column        2 columns       3 columns
(100% width)    (48% each)      (31% each)

┌─────┐        ┌──┐ ┌──┐      ┌─┐ ┌─┐ ┌─┐
│     │        │  │ │  │      │ │ │ │ │ │
├─────┤        └──┘ └──┘      └─┘ └─┘ └─┘
│     │
├─────┤
│     │
└─────┘
```

### Grid Option 2: Responsive Card Width
```
PHONE                    TABLET              DESKTOP
1 card per row          2 cards per row     4 cards per row
(100% - padding)        (48% each)          (23% each)
```

### Grid Option 3: Sidebar + Content
```
PHONE               TABLET/DESKTOP
No sidebar          Sidebar (200px)
Content full        Content flexible
width

┌────────────┐     ┌─────┬──────────────┐
│            │     │     │              │
│ Content    │     │Side │  Content     │
│            │     │bar  │              │
│            │     │     │              │
└────────────┘     └─────┴──────────────┘
```

---

## 📱 COMMON BREAKPOINT USE CASES

### When to Use `isPhone`
```javascript
// Use for phone-specific layouts
if (screenSize.isPhone) {
  // Stack vertically
  // Full width inputs
  // Single column grid
  // Hide sidebar
  // Simplify controls
}
```

### When to Use `isTablet`
```javascript
// Use for tablet optimizations
if (screenSize.isTablet) {
  // Two-column layout
  // Larger touch targets
  // Optimized for landscape
  // Hybrid layout with sidebar option
}
```

### When to Use `isDesktop`
```javascript
// Use for desktop/web layout
if (screenSize.isDesktop) {
  // Three-column layout
  // Max-width containers
  // Multi-panel views
  // Keyboard shortcuts
}
```

---

## 🎯 RESPONSIVE CONTAINER PATTERNS

### Pattern 1: Full Width with Max-Width
```
┌─────────────────────────────────────────────────┐  Edge padding
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │     Content (max-width: 1200px)        │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
  ↑ 100% width                    ↑ centered
```

### Pattern 2: Sidebar + Content
```
Desktop (≥1024px):
┌──────────┬────────────────────┐
│ Sidebar  │  Main Content      │
│ 200px    │  Flexible width    │
├──────────┼────────────────────┤
│          │                    │
└──────────┴────────────────────┘

Mobile (<768px):
┌──────────────────┐
│   Main Content   │
├──────────────────┤
│                  │
└──────────────────┘
(Sidebar in drawer)
```

### Pattern 3: Three-Column on Desktop
```
Desktop:
┌────┬──────────┬────┐
│ L  │  Center  │ R  │
│    │          │    │
└────┴──────────┴────┘

Tablet:
┌──────────────────┐
│  Center (full)   │
├──────────────────┤
│  L    │  R       │
└───────┴──────────┘

Phone:
┌──────────────────┐
│  Center          │
├──────────────────┤
│  L               │
├──────────────────┤
│  R               │
└──────────────────┘
```

---

## 🎬 REAL-WORLD EXAMPLES

### Example 1: Dashboard Cards Grid

```javascript
// Phone: 1 column
// Tablet: 2 columns
// Desktop: 3 columns

<View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 16}}>
  {cards.map(card => (
    <View
      key={card.id}
      style={{
        width: screenSize.isPhone ? '100%' : 
               screenSize.isTablet ? '48%' : '31%',
        marginBottom: 16,
      }}
    >
      <DashboardCard data={card} />
    </View>
  ))}
</View>
```

### Example 2: Form with Responsive Columns

```javascript
// Phone: Full width inputs
// Tablet: 2-column form
// Desktop: Full width with max-width

<View style={{
  flexDirection: screenSize.isPhone ? 'column' : 'row',
  gap: 16,
  flexWrap: 'wrap',
  maxWidth: screenSize.isDesktop ? 800 : '100%',
  alignSelf: 'center',
}}>
  <TextInput style={{width: screenSize.isPhone ? '100%' : '48%'}} />
  <TextInput style={{width: screenSize.isPhone ? '100%' : '48%'}} />
</View>
```

### Example 3: Content with Readable Max-Width

```javascript
// Article/documentation page
// Stays readable on all sizes

<View style={{
  width: '100%',
  maxWidth: screenSize.isDesktop ? 900 : '100%',
  alignSelf: 'center',
  paddingHorizontal: padding,
}}>
  <Text style={{fontSize: getResponsiveFontSize(24, screenSize)}}>
    Article Title
  </Text>
  {/* Article content */}
</View>
```

---

## 📏 COMMON DEVICE WIDTHS

```
╔═══════════════════════════════════════════════════════════╗
║                    DEVICE WIDTHS                          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  iPhone SE              375px                            ║
║  iPhone 12/13/14        390-393px                        ║
║  iPhone 14 Pro Max      430px                            ║
║  iPhone 15 Pro Max      430px                            ║
║                                                           ║
║  iPad Mini              768px                            ║
║  iPad Air/Pro 10.5"     834px                            ║
║  iPad (10.2")           810px                            ║
║  iPad Pro 12.9"         1024px                           ║
║                                                           ║
║  Laptop                 1280px+                          ║
║  Desktop Monitor        1920px                           ║
║  Large Monitor          2560px+                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ✅ RESPONSIVE CHECKLIST TEMPLATE

For each screen, verify:

```
PHONE (375px)
☐ No horizontal scrolling
☐ All text readable
☐ Buttons tappable (min 44x44)
☐ Keyboard doesn't hide content
☐ Images properly scaled
☐ Single column layout

TABLET (768px)
☐ Two-column layout activated
☐ Proper spacing between items
☐ Sidebar visible if applicable
☐ Touch-friendly spacing
☐ Landscape mode works

DESKTOP (1024px+)
☐ Three-column layout (if applicable)
☐ Max-width container applied
☐ Desktop-optimized layout
☐ Content not stretched too wide
☐ Professional appearance
```

---

## 🔗 QUICK CODE SNIPPETS

### Check Screen Size
```javascript
const screenSize = useScreenSize();
console.log(screenSize.isPhone);      // true/false
console.log(screenSize.isTablet);     // true/false
console.log(screenSize.isDesktop);    // true/false
console.log(screenSize.width);        // actual pixel width
console.log(screenSize.height);       // actual pixel height
```

### Get Responsive Values
```javascript
// Font size
const fontSize = getResponsiveFontSize(24, screenSize);

// Padding
const padding = getResponsivePadding(screenSize);

// Max width
const maxWidth = getMaxWidth(screenSize);

// Column count for grid
const columns = getColumnCount(screenSize);

// Button height
const btnHeight = screenSize.isPhone ? 44 : 48;
```

### Build Responsive Layout
```javascript
<View style={{
  flexDirection: screenSize.isPhone ? 'column' : 'row',
  gap: getResponsivePadding(screenSize),
  maxWidth: getMaxWidth(screenSize),
  alignSelf: 'center',
  width: '100%',
}}>
  {/* Responsive content */}
</View>
```

---

## 📚 REFERENCE TABLE

| Element | Phone | Tablet | Desktop | Function |
|---------|-------|--------|---------|----------|
| **Font Title** | 32px | 35px | 38px | getResponsiveFontSize(32) |
| **Font Body** | 16px | 18px | 19px | getResponsiveFontSize(16) |
| **Padding** | 16px | 18px | 21px | getResponsivePadding() |
| **Grid Cols** | 1 | 2 | 3 | getColumnCount() |
| **Max Width** | 100% | 100% | 1200px | getMaxWidth() |
| **Button Height** | 44px | 48px | 52px | Responsive |
| **Input Height** | 44px | 48px | 48px | Responsive |
| **Card Gap** | 12px | 16px | 20px | Responsive |

---

## 🎯 QUICK DECISION TREE

```
Does your component need responsive layout?
│
├─ YES
│  │
│  ├─ Is it a grid of cards?
│  │  └─ Use: width: isPhone ? '100%' : isTablet ? '48%' : '31%'
│  │
│  ├─ Is it text content?
│  │  └─ Use: getResponsiveFontSize()
│  │
│  ├─ Is it a form?
│  │  └─ Use: flexDirection: isPhone ? 'column' : 'row'
│  │
│  ├─ Is it wide content?
│  │  └─ Use: maxWidth: getMaxWidth(), alignSelf: 'center'
│  │
│  └─ Is it spacing/padding?
│     └─ Use: getResponsivePadding()
│
└─ NO → Use ResponsiveScreen wrapper as parent
```

---

## 📞 COMMON QUESTIONS

**Q: Why can't I just use fixed sizes?**
A: Fixed sizes don't work on different devices. A 360px wide container is too large on iPhone SE (375px) and too small on iPad (768px).

**Q: What if my component doesn't fit the pattern?**
A: Use `useScreenSize()` hook to get actual dimensions and handle custom logic.

**Q: Should I support landscape?**
A: Yes! The responsive system handles it automatically since it's based on actual screen width.

**Q: What about orientation changes?**
A: The hook updates automatically when orientation changes. No extra code needed.

**Q: Can I mix responsive and fixed sizes?**
A: Use responsive for layout, fixed for specific sizes (like avatar 48x48).

---

This is your visual reference guide. Bookmark it and refer back when building responsive screens! 🚀
