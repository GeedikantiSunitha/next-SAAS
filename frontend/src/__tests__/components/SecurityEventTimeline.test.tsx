/**
 * Tests for Security Event Timeline Component
 *
 * Task 3.3: Security Monitoring & Alerting
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityEventTimeline from '../../components/SecurityEventTimeline';

describe('SecurityEventTimeline', () => {
  const mockEvents = [
    {
      id: '1',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      type: 'FAILED_LOGIN',
      severity: 'LOW' as const,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
      ipAddress: '192.168.1.1',
      resource: '/api/auth/login',
      action: 'POST',
      outcome: 'FAILURE' as const,
      details: { attemptNumber: 1 },
      alertSent: false,
    },
    {
      id: '2',
      timestamp: new Date('2024-01-01T12:05:00Z'),
      type: 'BRUTE_FORCE_DETECTED',
      severity: 'HIGH' as const,
      user: null,
      ipAddress: '10.0.0.1',
      resource: null,
      action: null,
      outcome: 'BLOCKED' as const,
      details: { threshold: 5, attempts: 5 },
      alertSent: true,
    },
    {
      id: '3',
      timestamp: new Date('2024-01-01T12:10:00Z'),
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM' as const,
      user: {
        id: 'user-2',
        email: 'user2@example.com',
        name: null,
      },
      ipAddress: '192.168.1.2',
      resource: '/api/data',
      action: 'GET',
      outcome: 'BLOCKED' as const,
      details: {},
      alertSent: false,
    },
  ];

  it('should render the timeline header', () => {
    render(<SecurityEventTimeline events={[]} />);
    expect(screen.getByText('Security Event Timeline')).toBeInTheDocument();
    expect(screen.getByText('Real-time stream of security events and incidents')).toBeInTheDocument();
  });

  it('should show empty state when no events', () => {
    render(<SecurityEventTimeline events={[]} />);
    expect(screen.getByText('No security events in the selected time period')).toBeInTheDocument();
  });

  it('should display all events', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText('Failed Login')).toBeInTheDocument();
    expect(screen.getByText('Brute Force Detected')).toBeInTheDocument();
    expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
  });

  it('should display severity badges correctly', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should show alert sent badge when applicable', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText('Alert Sent')).toBeInTheDocument();
  });

  it('should display user information when available', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
  });

  it('should display IP address when user is not available', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
  });

  it('should display resource and action information', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText(/POST \/api\/auth\/login/)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/data/)).toBeInTheDocument();
  });

  it('should display outcome with correct icon', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    expect(screen.getByText('FAILURE')).toBeInTheDocument();
    expect(screen.getAllByText('BLOCKED')).toHaveLength(2);
  });

  it('should show correct severity icons', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    // Check for presence of severity icons (by checking their container classes)
    // Need to be more specific to avoid selecting the card wrapper itself
    const eventCards = document.querySelectorAll('.flex.gap-4.p-4.rounded-lg.border');
    expect(eventCards.length).toBe(mockEvents.length);

    // Check that severity icons are present
    const icons = document.querySelectorAll('.lucide');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should format timestamp correctly', () => {
    // Mock current date
    vi.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01T12:15:00Z').getTime());

    render(<SecurityEventTimeline events={mockEvents} />);

    // Check that the timestamp text exists in the document
    // The timestamps should be formatted as dates since they're far in the past relative to the mock date
    const dateText = '1/1/2024'; // This is how toLocaleDateString() formats it
    expect(screen.getAllByText(dateText).length).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('should expand details when available', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    // Find and click the first details summary
    const detailsElements = screen.getAllByText('View Details');
    expect(detailsElements.length).toBeGreaterThan(0);

    fireEvent.click(detailsElements[0]);

    // Should show the JSON details
    expect(screen.getByText(/"attemptNumber":/)).toBeInTheDocument();
  });

  it('should handle events without details gracefully', () => {
    const eventsWithoutDetails = [{
      ...mockEvents[0],
      details: null,
    }];

    render(<SecurityEventTimeline events={eventsWithoutDetails} />);

    // Should not show "View Details" for events without details
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('should handle mixed severity events correctly', () => {
    const mixedEvents = [
      { ...mockEvents[0], severity: 'CRITICAL' as const },
      { ...mockEvents[1], severity: 'INFO' as const },
    ];

    render(<SecurityEventTimeline events={mixedEvents} />);

    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();
  });

  it('should handle events with all outcome types', () => {
    const outcomeEvents = [
      { ...mockEvents[0], outcome: 'SUCCESS' as const },
      { ...mockEvents[1], outcome: 'PENDING' as const },
    ];

    render(<SecurityEventTimeline events={outcomeEvents} />);

    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should apply hover effect on event cards', () => {
    render(<SecurityEventTimeline events={mockEvents} />);

    const eventCards = document.querySelectorAll('.hover\\:bg-muted\\/50');
    expect(eventCards.length).toBe(mockEvents.length);
  });

  it('should render in a scrollable area', () => {
    // Create many events to test scrolling
    const manyEvents = Array.from({ length: 20 }, (_, i) => ({
      ...mockEvents[0],
      id: `event-${i}`,
    }));

    render(<SecurityEventTimeline events={manyEvents} />);

    // Check for ScrollArea component (by checking for specific height class)
    const scrollArea = document.querySelector('.h-\\[600px\\]');
    expect(scrollArea).toBeInTheDocument();
  });
});