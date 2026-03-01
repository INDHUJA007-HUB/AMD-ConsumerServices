import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { test, fc } from '@fast-check/vitest';
import GradientText from './GradientText';

describe('GradientText Component - Property-Based Tests', () => {
  // Helper to generate valid hex color strings
  const hexColorArbitrary = fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([r, g, b]) => 
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  );

  // Helper to generate non-whitespace strings
  const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);

  // Feature: ui-visibility-improvements, Property 4: GradientText component prop handling
  // **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  test.prop([
    fc.array(hexColorArbitrary, { minLength: 2, maxLength: 5 }),
    fc.integer({ min: 1, max: 20 }),
    fc.boolean(),
    nonWhitespaceString
  ], { numRuns: 100 })(
    'Property 4: renders without errors for all valid prop combinations',
    (colors, speed, border, text) => {
      // Render GradientText with generated props
      const { container } = render(
        <GradientText
          colors={colors}
          animationSpeed={speed}
          showBorder={border}
        >
          {text}
        </GradientText>
      );

      // Assert no errors thrown (component rendered successfully)
      const element = container.querySelector('.gradient-text');
      expect(element).toBeInTheDocument();
      
      // Verify text content is displayed correctly
      expect(element?.textContent).toBe(text);
      
      // Verify gradient-text class is applied
      expect(element).toHaveClass('gradient-text');
      
      // Verify border class is applied when showBorder is true
      if (border) {
        expect(element).toHaveClass('gradient-text-border');
      } else {
        expect(element).not.toHaveClass('gradient-text-border');
      }
      
      // Verify animation speed is applied
      const style = element?.getAttribute('style');
      expect(style).toContain(`${speed}s`);
      
      // Verify gradient text styles are applied
      expect(style).toContain('background-clip: text');
      expect(style).toContain('color: transparent');
      
      // Verify component doesn't throw errors with these props
      expect(element).toBeTruthy();
    }
  );

  // Additional property test for edge cases with invalid props
  test.prop([
    fc.oneof(
      fc.constant([]), // empty array
      fc.array(hexColorArbitrary, { maxLength: 1 }) // single color
    ),
    fc.oneof(
      fc.constant(0), // zero speed
      fc.integer({ min: -10, max: 0 }) // negative speed
    ),
    nonWhitespaceString
  ], { numRuns: 100 })(
    'Property 4 (Edge Cases): handles invalid props gracefully with defaults',
    (colors, speed, text) => {
      // Render GradientText with invalid props
      const { container } = render(
        <GradientText
          colors={colors}
          animationSpeed={speed}
        >
          {text}
        </GradientText>
      );

      // Assert component still renders without errors
      const element = container.querySelector('.gradient-text');
      expect(element).toBeInTheDocument();
      
      // Verify text content is displayed correctly
      expect(element?.textContent).toBe(text);
      
      // Verify default values are used
      const style = element?.getAttribute('style');
      
      // Default speed should be 8s
      expect(style).toContain('8s');
      
      // Verify gradient text styles are applied
      expect(style).toContain('background-clip: text');
      expect(style).toContain('color: transparent');
      
      // Verify component doesn't throw errors with invalid props
      expect(element).toBeTruthy();
    }
  );
});
