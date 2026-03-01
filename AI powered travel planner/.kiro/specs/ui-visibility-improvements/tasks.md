# Implementation Plan: UI Visibility Improvements

## Overview

This implementation plan addresses UI visibility issues in the NammaWay application through targeted component and styling modifications. The work is organized into four main areas: (1) creating the reusable GradientText component, (2) fixing dashboard tab text visibility, (3) updating the landing page hero subtitle, and (4) enhancing authentication UI. Each task builds incrementally, with testing integrated throughout to catch issues early.

## Tasks

- [x] 1. Create GradientText component with animation support
  - Create `src/components/GradientText.tsx` with TypeScript interface for props (children, colors, animationSpeed, showBorder, className)
  - Implement component using framer-motion's motion.span for animated gradient effects
  - Apply CSS properties: background-clip: text, color: transparent, background-image with linear-gradient
  - Create `src/components/GradientText.css` with keyframe animations for color cycling
  - Add prop validation with default values (animationSpeed: 8, showBorder: false)
  - Handle edge cases: empty colors array defaults to ["#5227FF", "#FF9FFC"], invalid animationSpeed defaults to 8
  - Export component as default export
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 1.1 Write unit tests for GradientText component
  - Test rendering with default props
  - Test custom className application
  - Test empty colors array fallback
  - Test invalid animationSpeed handling
  - Test children content rendering
  - Test showBorder prop toggle
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 1.2 Write property test for GradientText prop handling
  - **Property 4: GradientText component prop handling**
  - Generate random combinations of colors arrays (2-5 hex colors), animationSpeed (1-20), showBorder (boolean), and text content (1-100 chars)
  - Verify component renders without errors for all combinations
  - Verify children content is displayed correctly
  - Run 100 iterations minimum
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 2. Fix dashboard navigation tab text visibility
  - Open `src/pages/Dashboard.tsx` and locate all TabsTrigger components (6 total)
  - Add `text-gray-700` class to each TabsTrigger for inactive state text color
  - Add `hover:text-gray-900` class for hover state feedback
  - Verify existing active state classes remain: `data-[state=active]:text-white`
  - Ensure all existing gradient backgrounds and transitions are preserved
  - Test all six tabs: stay, expense, food, commute, pgs, rent
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Write property test for tab text contrast ratio
  - **Property 1: Tab text contrast ratio**
  - For each tab value (stay, expense, food, commute, pgs, rent), render in inactive state
  - Calculate contrast ratio between text color (gray-700) and background color (white/60 with backdrop-blur)
  - Assert contrast ratio is at least 4.5:1 (WCAG AA standard)
  - Run 100 iterations minimum
  - _Requirements: 1.1, 1.4_
  - **Validates: Requirements 1.1, 1.4**

- [x] 2.2 Write property test for active tab styling preservation
  - **Property 2: Active tab styling preservation**
  - For each tab, set to active state and verify text color is white (rgb(255, 255, 255))
  - Verify gradient background classes are applied (data-[state=active]:bg-gradient-to-r)
  - Verify specific gradient colors for each tab (blue-500 to blue-600 for stay, etc.)
  - Run 100 iterations minimum
  - _Requirements: 1.2, 1.5_
  - **Validates: Requirements 1.2, 1.5**

- [x] 2.3 Write property test for tab hover feedback
  - **Property 3: Tab hover feedback**
  - For each tab in inactive state, simulate hover event
  - Verify text color changes to darker shade (gray-900)
  - Verify hover effect is visually distinct from inactive state
  - Run 100 iterations minimum
  - _Requirements: 1.3_
  - **Validates: Requirements 1.3**

- [x] 3. Update landing page hero subtitle with gradient text
  - Open `src/pages/Landing.tsx` and locate the hero subtitle paragraph (line ~285)
  - Import GradientText component at top of file
  - Replace the `<p className="hero-subtitle...">` element with GradientText component
  - Pass props: colors={["#5227FF", "#FF9FFC", "#B19EEF"]}, animationSpeed={8}, showBorder={false}
  - Maintain existing className: "hero-subtitle text-lg md:text-xl max-w-2xl mx-auto mb-10"
  - Keep subtitle text: "Stop searching. Start deciding. AI that plans your stay, food, travel & budget — with clear reasoning for every choice."
  - Verify GSAP animations still work correctly (hero-subtitle class is used in animation selectors)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Write property test for responsive text sizing
  - **Property 5: Responsive text sizing**
  - Generate random viewport widths from 320px to 1920px
  - Render hero section at each viewport width
  - For widths < 768px, verify text-lg class is applied
  - For widths >= 768px, verify text-xl class is applied
  - Run 100 iterations minimum
  - _Requirements: 2.4, 5.4_
  - **Validates: Requirements 2.4, 5.4**

- [x] 4. Checkpoint - Verify component integration and styling
  - Run the application and navigate to landing page
  - Verify hero subtitle displays with gradient animation
  - Navigate to dashboard and verify all tab labels are visible
  - Click through all six tabs and verify active state styling
  - Test hover effects on inactive tabs
  - Check browser console for any errors or warnings
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhance authentication UI with logout functionality
  - Open `src/pages/Landing.tsx` and locate the authentication conditional rendering (line ~286)
  - Create `handleLogout` function that removes userName from localStorage and reloads page
  - Add logout button next to "Continue Planning" button when user is logged in
  - Style logout button consistently with existing HeroButton component (variant="ghost")
  - Ensure login button is clearly visible when logged out (already implemented)
  - Verify welcome message and avatar display correctly with username
  - Test localStorage access with try-catch for browser compatibility
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 5.1 Write property test for authentication state display
  - **Property 6: Authentication state display**
  - Generate random username strings (1-50 characters)
  - Set each username in localStorage
  - Render Landing page and verify "Welcome [username]" message appears
  - Verify username is rendered with gradient styling (text-gradient class)
  - Run 100 iterations minimum
  - _Requirements: 4.2_
  - **Validates: Requirements 4.2**

- [x] 5.2 Write property test for logout functionality
  - **Property 7: Logout functionality**
  - Generate random username strings (1-50 characters)
  - Set each username in localStorage
  - Render Landing page and simulate logout button click
  - Verify localStorage no longer contains userName key
  - Verify UI updates to show login button instead of welcome message
  - Run 100 iterations minimum
  - _Requirements: 4.4_
  - **Validates: Requirements 4.4**

- [x] 5.3 Write unit tests for authentication UI
  - Test login button displays when logged out
  - Test welcome message displays when logged in with specific username
  - Test logout button clears localStorage
  - Test login button navigates to /login route
  - Test localStorage error handling (try-catch)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [-] 6. Integration testing and error handling verification
  - Add error boundaries around GradientText component usage
  - Test GradientText with edge cases: empty colors array, negative animationSpeed, null children
  - Test authentication flow: logout → login → logout cycle
  - Verify no console errors during tab switching
  - Test responsive behavior at mobile (375px), tablet (768px), and desktop (1920px) widths
  - Verify keyboard navigation works for tabs (Tab key, Arrow keys)
  - Test with localStorage disabled (privacy mode) and verify graceful fallback
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [~] 6.1 Write property test for no console errors
  - **Property 8: No console errors**
  - Simulate various user interactions: tab clicks, page loads, logout actions
  - Monitor browser console for JavaScript errors and React warnings
  - Assert zero errors for all interactions
  - Run 100 iterations minimum
  - _Requirements: 5.6_
  - **Validates: Requirements 5.6**

- [~] 7. Final checkpoint - Complete testing and validation
  - Run all unit tests and property tests (minimum 100 iterations each)
  - Verify all 8 correctness properties pass
  - Test complete user flows: landing page → login → dashboard → tab navigation → logout
  - Verify WCAG AA contrast ratios with browser DevTools or axe
  - Check responsive design at all breakpoints
  - Verify animations perform smoothly (60fps)
  - Review code for any TODO comments or temporary fixes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and catch issues early
- GradientText component is created first as it's a dependency for landing page updates
- Authentication enhancements build on existing conditional rendering logic
- All changes maintain existing GSAP animations, Tailwind styling, and responsive behavior

