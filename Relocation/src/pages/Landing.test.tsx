import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from './Landing';

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

vi.mock('@/components/GradientText', () => ({
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe('Landing Page - Authentication UI', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shows login button when logged out', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    const loginButton = screen.getByText(/Plan Your City Now/i);
    expect(loginButton).toBeInTheDocument();
  });

  it('shows welcome message when logged in with specific username', () => {
    localStorage.setItem('userName', 'TestUser');

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('logout button clears localStorage', () => {
    localStorage.setItem('userName', 'TestUser');

    // Mock window.location.reload
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

    expect(localStorage.getItem('userName')).toBeNull();

    // Restore original reload
    window.location.reload = originalReload;
  });

  it('login button navigates to /login route', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    const loginButton = screen.getByText(/Plan Your City Now/i);
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles localStorage error gracefully', () => {
    // Mock localStorage to throw error
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('localStorage not available');
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Should still render without crashing
    expect(screen.getByText(/Plan Your City Now/i)).toBeInTheDocument();

    // Restore original
    Storage.prototype.getItem = originalGetItem;
    consoleWarnSpy.mockRestore();
  });

  it('displays user avatar with first letter of username', () => {
    localStorage.setItem('userName', 'Alice');

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Check for avatar with first letter
    const avatar = screen.getByText('A');
    expect(avatar).toBeInTheDocument();
  });

  it('shows Continue Planning button when logged in', () => {
    localStorage.setItem('userName', 'TestUser');

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    const continueButton = screen.getByText(/Continue Planning/i);
    expect(continueButton).toBeInTheDocument();
  });

  it('shows logout button when logged in', () => {
    localStorage.setItem('userName', 'TestUser');

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });
});
