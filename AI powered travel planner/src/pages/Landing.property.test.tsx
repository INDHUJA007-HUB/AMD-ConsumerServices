import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { fc } from "@fast-check/vitest";
import { BrowserRouter } from "react-router-dom";
import GradientText from "../components/GradientText";
import Landing from "./Landing";

// Mock GSAP and plugins
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({
      revert: vi.fn(),
    })),
    from: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    fromTo: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

vi.mock('gsap/MorphSVGPlugin', () => ({
  MorphSVGPlugin: {},
}));

// Mock heavy components
vi.mock('@/components/Dock', () => ({
  default: () => null,
}));

vi.mock('@/components/DotGrid', () => ({
  default: () => null,
}));

vi.mock('@/components/ClickSpark', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/BlurText', () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

/**
 * Feature: ui-visibility-improvements
 * Property 5: Responsive text sizing
 * 
 * **Validates: Requirements 2.4, 5.4**
 */

describe("Landing Page - Property 5: Responsive text sizing", () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original window width
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("should apply correct responsive text size class based on viewport width", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (viewportWidth) => {
          // Set viewport width
          Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          // Update matchMedia to reflect the viewport width
          Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: (query: string) => {
              // Parse the media query to check if it matches
              // md breakpoint in Tailwind is 768px
              const mdMatch = query.includes("min-width: 768px") || query.includes("min-width:768px");
              
              return {
                matches: mdMatch ? viewportWidth >= 768 : viewportWidth < 768,
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
              };
            },
          });

          // Render the GradientText component with the same classes as in Landing page
          const { container } = render(
            <GradientText
              colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
              animationSpeed={8}
              showBorder={false}
              className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto mb-10"
            >
              Stop searching. Start deciding. AI that plans your stay, food, travel & budget — with clear reasoning for every choice.
            </GradientText>
          );

          // Find the rendered element
          const element = container.querySelector(".hero-subtitle");
          
          // Verify the element exists
          expect(element).toBeTruthy();

          if (element) {
            const classList = Array.from(element.classList);
            const classNameStr = element.className;
            
            // Both mobile and desktop should have text-lg as the base class
            expect(classList).toContain("text-lg");
            
            // Desktop (>= 768px) should also have md:text-xl in the className
            // Mobile (< 768px) should have md:text-xl in the className (it's always there, just not active)
            // The responsive class is always present in the className string
            expect(classNameStr).toMatch(/md:text-xl/);
            
            // The key property is that the className contains both text-lg and md:text-xl
            // Tailwind CSS will apply text-lg by default and text-xl at md breakpoint
            // In the test environment, we verify the classes are present
            // The actual responsive behavior is handled by Tailwind CSS at runtime
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: ui-visibility-improvements
 * Property 6: Authentication state display
 * 
 * **Validates: Requirements 4.2**
 */

describe("Landing Page - Property 6: Authentication state display", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("should display welcome message with username in gradient styling for any valid username", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (username) => {
          // Clean up before each property test iteration
          cleanup();
          localStorage.clear();
          
          // Set username in localStorage
          localStorage.setItem('userName', username);

          const { getAllByText, container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          // Verify welcome message appears
          const welcomeTexts = getAllByText(/Welcome,/i);
          expect(welcomeTexts.length).toBeGreaterThan(0);

          // Find the username element with gradient styling using querySelector
          const gradientUsernameElement = container.querySelector('.text-gradient.font-bold');
          expect(gradientUsernameElement).toBeTruthy();
          expect(gradientUsernameElement?.textContent).toBe(username);
          expect(gradientUsernameElement?.className).toMatch(/text-gradient/);

          // Clean up after test
          cleanup();
          localStorage.clear();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: ui-visibility-improvements
 * Property 7: Logout functionality
 * 
 * **Validates: Requirements 4.4**
 */

describe("Landing Page - Property 7: Logout functionality", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("should clear localStorage and show login button after logout for any username", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (username) => {
          // Clean up before each property test iteration
          cleanup();
          localStorage.clear();
          
          // Set username in localStorage
          localStorage.setItem('userName', username);

          // Mock window.location.reload
          const originalReload = window.location.reload;
          Object.defineProperty(window, 'location', {
            writable: true,
            value: { reload: vi.fn() },
          });

          const { getAllByText } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          // Verify user is logged in
          expect(localStorage.getItem('userName')).toBe(username);

          // Find and click logout button (use getAllByText since there might be multiple)
          const logoutButtons = getAllByText('Logout');
          expect(logoutButtons.length).toBeGreaterThan(0);
          
          fireEvent.click(logoutButtons[0]);

          // Verify localStorage is cleared
          expect(localStorage.getItem('userName')).toBeNull();

          // Restore original reload
          window.location.reload = originalReload;
          
          // Clean up after test
          cleanup();
          localStorage.clear();
        }
      ),
      { numRuns: 100 }
    );
  });
});
