// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  createMockEvent,
} from '@/test-utils/react-test-utils';
import EventCard from '../EventCard';

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
}));

// Mock fetch
global.fetch = vi.fn();

describe('EventCard', () => {
  const mockEvent = createMockEvent();
  const mockOnJoin = vi.fn();
  const mockOnManage = vi.fn();
  const mockOnShare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('Rendering', () => {
    it('should render event title', () => {
      renderWithProviders(<EventCard event={mockEvent} />);

      expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    });

    it('should render event location', () => {
      renderWithProviders(<EventCard event={mockEvent} />);

      expect(screen.getByText(mockEvent.location)).toBeInTheDocument();
    });

    it('should render sport type badge', () => {
      renderWithProviders(<EventCard event={mockEvent} />);

      // Sport type is capitalized
      expect(screen.getByText('Basketball')).toBeInTheDocument();
    });

    it('should render participant count', () => {
      renderWithProviders(<EventCard event={mockEvent} />);

      expect(screen.getByText('5/10 players')).toBeInTheDocument();
    });

    it('should render event image', () => {
      const eventWithImage = createMockEvent({
        eventImage: 'https://example.com/event.jpg',
      });

      renderWithProviders(<EventCard event={eventWithImage} />);

      const img = screen.getByAltText(eventWithImage.title);
      expect(img).toHaveAttribute('src', eventWithImage.eventImage);
    });

    it('should use fallback image when eventImage is null', () => {
      const eventNoImage = createMockEvent({ eventImage: null });

      renderWithProviders(<EventCard event={eventNoImage} />);

      const img = screen.getByAltText(eventNoImage.title);
      expect(img.getAttribute('src')).toContain('unsplash');
    });
  });

  describe('Join Event Button', () => {
    it('should render "Join Event" button by default', () => {
      renderWithProviders(<EventCard event={mockEvent} onJoin={mockOnJoin} />);

      expect(screen.getByText('Join Event')).toBeInTheDocument();
    });

    it('should call onJoin when Join button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<EventCard event={mockEvent} onJoin={mockOnJoin} />);

      const joinButton = screen.getByText('Join Event');
      await user.click(joinButton);

      expect(mockOnJoin).toHaveBeenCalledWith(mockEvent.id);
    });

    it('should not propagate click to card when Join button is clicked', async () => {
      const user = userEvent.setup();
      const mockCardClick = vi.fn();

      renderWithProviders(
        <div onClick={mockCardClick}>
          <EventCard event={mockEvent} onJoin={mockOnJoin} />
        </div>
      );

      const joinButton = screen.getByText('Join Event');
      await user.click(joinButton);

      expect(mockOnJoin).toHaveBeenCalled();
      expect(mockCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Manage Event Mode', () => {
    it('should render "Manage" button when isManageable is true', () => {
      renderWithProviders(
        <EventCard
          event={mockEvent}
          isManageable={true}
          onManage={mockOnManage}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText('Manage')).toBeInTheDocument();
      expect(screen.queryByText('Join Event')).not.toBeInTheDocument();
    });

    it('should call onManage when Manage button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <EventCard event={mockEvent} isManageable={true} onManage={mockOnManage} />
      );

      const manageButton = screen.getByText('Manage');
      await user.click(manageButton);

      expect(mockOnManage).toHaveBeenCalledWith(mockEvent.id);
    });

    it('should render Share button in manage mode', () => {
      renderWithProviders(
        <EventCard event={mockEvent} isManageable={true} onShare={mockOnShare} />
      );

      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('should call onShare when Share button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <EventCard event={mockEvent} isManageable={true} onShare={mockOnShare} />
      );

      const shareButton = screen.getByText('Share');
      await user.click(shareButton);

      expect(mockOnShare).toHaveBeenCalledWith(mockEvent.id);
    });
  });

  describe('Past Event Mode', () => {
    it('should render "View Details" button when isPast is true', () => {
      renderWithProviders(<EventCard event={mockEvent} isPast={true} onManage={mockOnManage} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.queryByText('Join Event')).not.toBeInTheDocument();
    });

    it('should have reduced opacity for past events', () => {
      const { container } = renderWithProviders(<EventCard event={mockEvent} isPast={true} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('opacity-90');
    });

    it('should fetch match result for past events', () => {
      renderWithProviders(<EventCard event={mockEvent} isPast={true} />);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/events/${mockEvent.id}/match-result`,
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('should fetch RSVP data for past events', () => {
      renderWithProviders(<EventCard event={mockEvent} isPast={true} />);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/rsvps/event/${mockEvent.id}`,
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });

  describe('Sport Badge Colors', () => {
    it('should render correct color for basketball', () => {
      const basketballEvent = createMockEvent({ sportType: 'basketball' });

      renderWithProviders(<EventCard event={basketballEvent} />);

      const badge = screen.getByText('Basketball');
      expect(badge.className).toContain('bg-secondary');
    });

    it('should render correct color for soccer', () => {
      const soccerEvent = createMockEvent({ sportType: 'soccer' });

      renderWithProviders(<EventCard event={soccerEvent} />);

      const badge = screen.getByText('Soccer');
      expect(badge.className).toContain('bg-accent');
    });

    it('should render default color for unknown sport', () => {
      const unknownSportEvent = createMockEvent({ sportType: 'unknown' });

      renderWithProviders(<EventCard event={unknownSportEvent} />);

      const badge = screen.getByText('Unknown');
      expect(badge.className).toContain('bg-gray-500');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const specificDate = new Date('2024-12-25T14:30:00');
      const eventWithDate = createMockEvent({
        date: specificDate.toISOString(),
      });

      renderWithProviders(<EventCard event={eventWithDate} />);

      // Check that some part of the formatted date is present
      expect(screen.getByText(/Dec 25/)).toBeInTheDocument();
    });
  });

  describe('Participant Display', () => {
    it('should show +N indicator when more than 3 participants', () => {
      const eventWithManyParticipants = createMockEvent({
        currentParticipants: 8,
      });

      renderWithProviders(<EventCard event={eventWithManyParticipants} />);

      expect(screen.getByText('+5')).toBeInTheDocument();
    });

    it('should not show +N indicator when 3 or fewer participants', () => {
      const eventWithFewParticipants = createMockEvent({
        currentParticipants: 2,
      });

      renderWithProviders(<EventCard event={eventWithFewParticipants} />);

      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for event image', () => {
      renderWithProviders(<EventCard event={mockEvent} />);

      const img = screen.getByAltText(mockEvent.title);
      expect(img).toBeInTheDocument();
    });

    it('should have clickable card', () => {
      const { container } = renderWithProviders(<EventCard event={mockEvent} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });
  });
});
