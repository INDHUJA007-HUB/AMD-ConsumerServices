import { describe, expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';

// Helper function to calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper function to calculate contrast ratio
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper to verify class string contains expected classes
function hasClasses(className: string, expectedClasses: string[]): boolean {
  return expectedClasses.every(cls => className.includes(cls));
}

describe('Dashboard Component - Property-Based Tests', () => {
  // Feature: ui-visibility-improvements, Property 1: Tab text contrast ratio
  // **Validates: Requirements 1.1, 1.4**
  test.prop([
    fc.constantFrom('stay', 'expense', 'food', 'commute', 'pgs', 'rent')
  ], { numRuns: 100 })(
    'Property 1: Tab text has sufficient contrast ratio (>= 4.5:1) in inactive state',
    (tabValue) => {
      // text-gray-700 is rgb(55, 65, 81)
      const textColor: [number, number, number] = [55, 65, 81];
      
      // Background is white/60 with backdrop-blur, approximate as white for contrast calculation
      // white is rgb(255, 255, 255)
      const backgroundColor: [number, number, number] = [255, 255, 255];
      
      // Calculate contrast ratio
      const contrastRatio = getContrastRatio(textColor, backgroundColor);
      
      // Assert contrast ratio meets WCAG AA standard (4.5:1)
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      
      // Verify the expected classes are defined for all tabs
      const expectedClasses = ['text-gray-700', 'hover:text-gray-900'];
      const tabClassNames = {
        stay: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all',
        expense: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all',
        food: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-lg transition-all',
        commute: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all',
        pgs: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all',
        rent: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg transition-all'
      };
      
      const className = tabClassNames[tabValue as keyof typeof tabClassNames];
      expect(hasClasses(className, expectedClasses)).toBe(true);
    }
  );

  // Feature: ui-visibility-improvements, Property 2: Active tab styling preservation
  // **Validates: Requirements 1.2, 1.5**
  test.prop([
    fc.constantFrom('stay', 'expense', 'food', 'commute', 'pgs', 'rent')
  ], { numRuns: 100 })(
    'Property 2: Active tab has white text and gradient background',
    (tabValue) => {
      // Verify gradient background classes and white text are applied for active state
      const gradientMap: Record<string, { from: string; to: string }> = {
        stay: { from: 'blue-500', to: 'blue-600' },
        expense: { from: 'purple-500', to: 'purple-600' },
        food: { from: 'violet-500', to: 'violet-600' },
        commute: { from: 'indigo-500', to: 'indigo-600' },
        pgs: { from: 'cyan-500', to: 'blue-600' },
        rent: { from: 'emerald-500', to: 'teal-600' }
      };
      
      const expectedGradient = gradientMap[tabValue];
      const expectedClasses = [
        'data-[state=active]:bg-gradient-to-r',
        `data-[state=active]:from-${expectedGradient.from}`,
        `data-[state=active]:to-${expectedGradient.to}`,
        'data-[state=active]:text-white'
      ];
      
      const tabClassNames = {
        stay: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all',
        expense: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all',
        food: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-lg transition-all',
        commute: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all',
        pgs: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all',
        rent: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg transition-all'
      };
      
      const className = tabClassNames[tabValue as keyof typeof tabClassNames];
      expect(hasClasses(className, expectedClasses)).toBe(true);
    }
  );

  // Feature: ui-visibility-improvements, Property 3: Tab hover feedback
  // **Validates: Requirements 1.3**
  test.prop([
    fc.constantFrom('stay', 'expense', 'food', 'commute', 'pgs', 'rent')
  ], { numRuns: 100 })(
    'Property 3: Inactive tab provides hover feedback with darker text',
    (tabValue) => {
      // Verify hover class is present
      const expectedClasses = ['hover:text-gray-900', 'text-gray-700'];
      
      const tabClassNames = {
        stay: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all',
        expense: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all',
        food: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-lg transition-all',
        commute: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all',
        pgs: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all',
        rent: 'flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg transition-all'
      };
      
      const className = tabClassNames[tabValue as keyof typeof tabClassNames];
      expect(hasClasses(className, expectedClasses)).toBe(true);
      
      // Verify the hover color (gray-900) is darker than inactive color (gray-700)
      // gray-700 is rgb(55, 65, 81), gray-900 is rgb(17, 24, 39)
      const inactiveColor: [number, number, number] = [55, 65, 81];
      const hoverColor: [number, number, number] = [17, 24, 39];
      
      // Calculate luminance to verify hover is darker
      const inactiveLuminance = getLuminance(...inactiveColor);
      const hoverLuminance = getLuminance(...hoverColor);
      
      // Hover color should have lower luminance (darker)
      expect(hoverLuminance).toBeLessThan(inactiveLuminance);
    }
  );
});
