# TODO - HomeScreen responsive refactor

- [x] Convert `src/screens/HomeScreen.tsx` into the single responsive HomeScreen implementation
  - [x] Remove `width > 760` / `width > 900` checks
- [ ] Use `useScreenSize()` across the file
  - [ ] Replace hardcoded/manual `%` widths with responsive grid calculations
  - [ ] Add maxWidth container centering
  - [ ] RobotConsoleCard: Phone column, Tablet/Desktop row
  - [ ] Feature cards: Phone 1 col, Tablet 2 cols, Desktop 4 cols
  - [ ] Module cards: Phone 2 cols, Tablet 3 cols, Desktop 4 cols
  - [ ] Ensure no horizontal scrolling (avoid overflow / fixed widths)
  - [ ] Ensure landscape tablet works
  - [ ] Ensure all sections use SafeAreaView (already at top; verify)
  - [ ] Replace fixed dimensions where practical with responsive utilities
  - [ ] Optimize for Android phones/tablets, iPads, laptops, and Expo Web
- [x] Refactor `src/screens/HomeScreen.responsive.tsx`
  - [ ] Remove its own implementation
  - [ ] Re-export the single default HomeScreen (only one default export)

- [ ] Smoke-test / lint
  - [ ] Run TS/Metro build if available
  - [ ] Verify layout rules (columns) visually


