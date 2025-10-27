import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test-utils/react-test-utils';
import EventTabs from '../EventTabs';

describe('EventTabs', () => {
  it('should render both tabs', () => {
    render(<EventTabs activeTab="upcoming" onChange={vi.fn()} />);

    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Past Events')).toBeInTheDocument();
  });

  it('should highlight the active tab', () => {
    render(<EventTabs activeTab="upcoming" onChange={vi.fn()} />);

    const upcomingTab = screen.getByText('Upcoming').closest('div');
    expect(upcomingTab).toHaveClass('text-primary');
    expect(upcomingTab).toHaveClass('border-primary');
  });

  it('should call onChange when a tab is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<EventTabs activeTab="upcoming" onChange={handleChange} />);

    const pastTab = screen.getByText('Past Events');
    await user.click(pastTab);

    expect(handleChange).toHaveBeenCalledWith('past');
  });

  it('should switch active tab when onChange is triggered', () => {
    const { rerender } = render(<EventTabs activeTab="upcoming" onChange={vi.fn()} />);

    let upcomingTab = screen.getByText('Upcoming').closest('div');
    expect(upcomingTab).toHaveClass('text-primary');

    // Rerender with past tab active
    rerender(<EventTabs activeTab="past" onChange={vi.fn()} />);

    const pastTab = screen.getByText('Past Events').closest('div');
    expect(pastTab).toHaveClass('text-primary');

    upcomingTab = screen.getByText('Upcoming').closest('div');
    expect(upcomingTab).not.toHaveClass('text-primary');
  });

  it('should render tab icons', () => {
    const { container } = render(<EventTabs activeTab="upcoming" onChange={vi.fn()} />);

    // Both tabs should have SVG icons
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});
