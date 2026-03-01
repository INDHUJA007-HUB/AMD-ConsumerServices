import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GradientText from './GradientText';

describe('GradientText Component', () => {
  it('renders with default props', () => {
    render(
      <GradientText colors={['#5227FF', '#FF9FFC']}>
        Test Text
      </GradientText>
    );
    
    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    render(
      <GradientText 
        colors={['#5227FF', '#FF9FFC']}
        className="custom-class text-xl"
      >
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveClass('text-xl');
  });

  it('handles empty colors array gracefully with fallback', () => {
    render(
      <GradientText colors={[]}>
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).toBeInTheDocument();
    // Component should use default colors ["#5227FF", "#FF9FFC"]
    expect(element).toHaveStyle({ backgroundImage: expect.stringContaining('#5227FF') });
  });

  it('handles single color array with fallback', () => {
    render(
      <GradientText colors={['#FF0000']}>
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).toBeInTheDocument();
    // Component should use default colors since array has less than 2 colors
    expect(element).toHaveStyle({ backgroundImage: expect.stringContaining('#5227FF') });
  });

  it('handles invalid animationSpeed with default value', () => {
    render(
      <GradientText 
        colors={['#5227FF', '#FF9FFC']}
        animationSpeed={-5}
      >
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).toBeInTheDocument();
    // Component should use default speed of 8 seconds
    const style = element.getAttribute('style');
    expect(style).toContain('8s');
  });

  it('handles zero animationSpeed with default value', () => {
    render(
      <GradientText 
        colors={['#5227FF', '#FF9FFC']}
        animationSpeed={0}
      >
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).toBeInTheDocument();
    // Component should use default speed of 8 seconds
    const style = element.getAttribute('style');
    expect(style).toContain('8s');
  });

  it('renders children content correctly', () => {
    render(
      <GradientText colors={['#5227FF', '#FF9FFC']}>
        <span>Nested Content</span>
      </GradientText>
    );
    
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });

  it('applies border class when showBorder is true', () => {
    render(
      <GradientText 
        colors={['#5227FF', '#FF9FFC']}
        showBorder={true}
      >
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).toHaveClass('gradient-text-border');
  });

  it('does not apply border class when showBorder is false', () => {
    render(
      <GradientText 
        colors={['#5227FF', '#FF9FFC']}
        showBorder={false}
      >
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    expect(element).not.toHaveClass('gradient-text-border');
  });

  it('uses custom animationSpeed when valid', () => {
    render(
      <GradientText 
        colors={['#5227FF', '#FF9FFC']}
        animationSpeed={12}
      >
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    const style = element.getAttribute('style');
    expect(style).toContain('12s');
  });

  it('creates gradient from multiple colors', () => {
    const colors = ['#5227FF', '#FF9FFC', '#B19EEF'];
    render(
      <GradientText colors={colors}>
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    colors.forEach(color => {
      expect(element).toHaveStyle({ backgroundImage: expect.stringContaining(color) });
    });
  });

  it('applies gradient text styles correctly', () => {
    render(
      <GradientText colors={['#5227FF', '#FF9FFC']}>
        Test Text
      </GradientText>
    );
    
    const element = screen.getByText('Test Text');
    const style = element.getAttribute('style');
    expect(style).toContain('background-clip: text');
    expect(style).toContain('color: transparent');
  });
});
