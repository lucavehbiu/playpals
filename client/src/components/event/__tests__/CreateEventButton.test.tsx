import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils/react-test-utils';
import CreateEventButton from '../CreateEventButton';

describe('CreateEventButton', () => {
  it('should render the button with correct text', () => {
    render(<CreateEventButton />);

    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('should render with plus icon', () => {
    const { container } = render(<CreateEventButton />);

    // Check for SVG icon (PlusIcon from lucide-react)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    render(<CreateEventButton />);

    const button = screen.getByRole('button', { name: /create event/i });
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-white');
  });

  it('should render centered when centered prop is true', () => {
    render(<CreateEventButton centered />);

    const button = screen.getByRole('button', { name: /create event/i });
    expect(button).toHaveClass('mx-auto');
  });

  it('should render full width when fullWidth prop is true', () => {
    render(<CreateEventButton fullWidth />);

    const button = screen.getByRole('button', { name: /create event/i });
    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('justify-center');
  });

  it('should have correct button type', () => {
    render(<CreateEventButton />);

    const button = screen.getByRole('button', { name: /create event/i });
    expect(button).toHaveAttribute('type', 'button');
  });
});
