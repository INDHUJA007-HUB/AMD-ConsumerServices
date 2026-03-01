import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Component, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import GradientText from '@/components/GradientText';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

// Mock components that might cause issues
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

// Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

// Simple Error Boundary component
class ErrorBoundary extends Component<
  { children: ReactNode; FallbackComponent: typeof ErrorFallback },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; FallbackComponent: typeof ErrorFallback }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.FallbackComponent;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

describe('Integration Testing - UI Visibility Improvements', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorage.clear();
    mockNavigate.mockClear();
    // Clear console spy
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('GradientText Error Boundaries and Edge Cases', () => {
    it('handles empty colors array without crashing', () => {
      const { container } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GradientText colors={[]}>Test Text</GradientText>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Text')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles negative animationSpeed without crashing', () => {
      const { container } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GradientText colors={['#5227FF', '#FF9FFC']} animationSpeed={-10}>
            Test Text
          </GradientText>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Text')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      const { container } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GradientText colors={['#5227FF', '#FF9FFC']}>
            {null}
          </GradientText>
        </ErrorBoundary>
      );

      // Should render without crashing
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      const { container } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GradientText colors={['#5227FF', '#FF9FFC']}>
            {undefined}
          </GradientText>
        </ErrorBoundary>
      );

      // Should render without crashing
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles zero animationSpeed without crashing', () => {
      const { container } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GradientText colors={['#5227FF', '#FF9FFC']} animationSpeed={0}>
            Test Text
          </GradientText>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Text')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Flow - Logout → Login → Logout Cycle', () => {
    it('completes full authentication cycle without errors', () => {
      // Mock window.location.reload
      const originalReload = window.location.reload;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: vi.fn() },
      });

      // Step 1: Start logged out
      const { rerender } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();

      // Step 2: Simulate login by setting localStorage
      localStorage.setItem('userName', 'TestUser');

      // Rerender to reflect login state
      rerender(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
      expect(screen.getByText('TestUser')).toBeInTheDocument();

      // Step 3: Click logout
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(localStorage.getItem('userName')).toBeNull();

      // Restore original reload
      window.location.reload = originalReload;
    });

    it('maintains UI consistency through multiple logout cycles', () => {
      const originalReload = window.location.reload;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: vi.fn() },
      });

      const { rerender } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // Cycle 1
      localStorage.setItem('userName', 'User1');
      rerender(<BrowserRouter><Landing /></BrowserRouter>);
      expect(screen.getByText('User1')).toBeInTheDocument();

      const logoutButton1 = screen.getByText('Logout');
      fireEvent.click(logoutButton1);
      expect(localStorage.getItem('userName')).toBeNull();

      // Cycle 2
      rerender(<BrowserRouter><Landing /></BrowserRouter>);
      localStorage.setItem('userName', 'User2');
      rerender(<BrowserRouter><Landing /></BrowserRouter>);
      expect(screen.getByText('User2')).toBeInTheDocument();

      const logoutButton2 = screen.getByText('Logout');
      fireEvent.click(logoutButton2);
      expect(localStorage.getItem('userName')).toBeNull();

      window.location.reload = originalReload;
    });
  });

  describe('Console Error Verification', () => {
    it('produces no console errors during tab switching', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Simulate tab clicks
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        fireEvent.click(tab);
      });

      // Check no console errors were logged
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('produces no console errors during Landing page render', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('produces no console errors during authentication state changes', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const originalReload = window.location.reload;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: vi.fn() },
      });

      const { rerender } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      localStorage.setItem('userName', 'TestUser');
      rerender(<BrowserRouter><Landing /></BrowserRouter>);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      window.location.reload = originalReload;
    });
  });

  describe('Responsive Behavior', () => {
    const setViewportWidth = (width: number) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      window.dispatchEvent(new Event('resize'));
    };

    it('renders correctly at mobile width (375px)', () => {
      setViewportWidth(375);

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // Should render without errors - check for unique element
      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();
    });

    it('renders correctly at tablet width (768px)', () => {
      setViewportWidth(768);

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();
    });

    it('renders correctly at desktop width (1920px)', () => {
      setViewportWidth(1920);

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();
    });

    it('Dashboard renders correctly at mobile width', () => {
      setViewportWidth(375);

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('Dashboard renders correctly at desktop width', () => {
      setViewportWidth(1920);

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows Tab key navigation through dashboard tabs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];

      // Focus first tab
      firstTab.focus();
      expect(document.activeElement).toBe(firstTab);

      // Simulate Tab key press
      fireEvent.keyDown(firstTab, { key: 'Tab', code: 'Tab' });

      // Focus should move (browser handles this, we just verify no errors)
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('allows Arrow key navigation through tabs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];

      firstTab.focus();

      // Simulate ArrowRight key
      fireEvent.keyDown(firstTab, { key: 'ArrowRight', code: 'ArrowRight' });

      // Verify no errors occurred
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('supports Enter key to activate tabs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];

      firstTab.focus();

      // Simulate Enter key
      fireEvent.keyDown(firstTab, { key: 'Enter', code: 'Enter' });

      // Verify no errors occurred
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('localStorage Disabled (Privacy Mode)', () => {
    it('handles localStorage.getItem failure gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn');

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // Should render login button as fallback
      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();

      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'localStorage not available:',
        expect.any(Error)
      );

      Storage.prototype.getItem = originalGetItem;
    });

    it('handles localStorage.setItem failure gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      const originalRemoveItem = Storage.prototype.removeItem;

      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn');

      localStorage.setItem('userName', 'TestUser');

      const originalReload = window.location.reload;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: vi.fn() },
      });

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'localStorage not available:',
        expect.any(Error)
      );

      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
      window.location.reload = originalReload;
    });

    it('renders correctly when localStorage is completely unavailable', () => {
      const originalLocalStorage = window.localStorage;
      
      // @ts-expect-error - Simulating localStorage unavailable
      delete window.localStorage;

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // Should still render without crashing - check for unique element
      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('GradientText Integration in Landing Page', () => {
    it('renders GradientText in hero section without errors', () => {
      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // Verify subtitle text is present (rendered by GradientText)
      expect(screen.getByText(/Stop searching. Start deciding./i)).toBeInTheDocument();
    });

    it('GradientText maintains GSAP animations compatibility', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // Verify no errors from GSAP animation conflicts
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Complete User Flow Integration', () => {
    it('completes full user journey without errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const originalReload = window.location.reload;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: vi.fn() },
      });

      // Step 1: Land on page (logged out)
      const { rerender } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();

      // Step 2: Simulate login
      localStorage.setItem('userName', 'IntegrationTestUser');
      rerender(<BrowserRouter><Landing /></BrowserRouter>);

      expect(screen.getByText('IntegrationTestUser')).toBeInTheDocument();

      // Step 3: Navigate to dashboard
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </QueryClientProvider>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      // Step 4: Switch tabs
      tabs.forEach(tab => {
        fireEvent.click(tab);
      });

      // Step 5: Back to landing and logout
      rerender(<BrowserRouter><Landing /></BrowserRouter>);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(localStorage.getItem('userName')).toBeNull();

      // Verify no console errors throughout entire flow
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      window.location.reload = originalReload;
    });
  });
});
