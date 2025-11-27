/**
 * Transcript Panel Component Tests
 * Task: T3-018
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranscriptPanel } from '../TranscriptPanel';

describe('TranscriptPanel', () => {
  const mockSegments = [
    {
      id: 'segment-1',
      text: 'Bonjour. Comment puis-je vous aider?',
      start_time: 0,
      end_time: 3,
      confidence: 0.95,
      speaker: {
        id: 'pharm-1',
        name: 'Dr. Martin',
        role: 'pharmacist' as const,
      },
    },
    {
      id: 'segment-2',
      text: 'J\'ai des maux de tête depuis trois jours.',
      start_time: 3.5,
      end_time: 7,
      confidence: 0.92,
      speaker: {
        id: 'patient-1',
        name: 'Patient',
        role: 'patient' as const,
      },
      highlighted_terms: [
        {
          term: 'maux de tête',
          category: 'symptom',
          start_offset: 6,
          end_offset: 18,
          confidence: 0.89,
        },
      ],
    },
  ];

  it('should render transcript panel', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={mockSegments}
      />
    );

    expect(screen.getByText('Transcription')).toBeInTheDocument();
    expect(screen.getByText(/2 segments/)).toBeInTheDocument();
  });

  it('should display live indicator when isLive is true', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={mockSegments}
        isLive={true}
      />
    );

    expect(screen.getByText('EN DIRECT')).toBeInTheDocument();
  });

  it('should render all segments with timestamps', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={mockSegments}
      />
    );

    expect(screen.getByText('00:00')).toBeInTheDocument(); // First segment timestamp
    expect(screen.getByText('Bonjour. Comment puis-je vous aider?')).toBeInTheDocument();
    expect(screen.getByText(/J'ai des maux de tête depuis trois jours/)).toBeInTheDocument();
  });

  it('should display speaker labels', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={mockSegments}
      />
    );

    expect(screen.getByText('Dr. Martin')).toBeInTheDocument();
    expect(screen.getByText('Patient')).toBeInTheDocument();
  });

  it('should highlight medical terms', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={mockSegments}
      />
    );

    const highlightedTerm = screen.getByText('maux de tête');
    expect(highlightedTerm).toBeInTheDocument();
    expect(highlightedTerm).toHaveClass('bg-red-200'); // Symptom color
  });

  it('should show empty state when no segments', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={[]}
      />
    );

    expect(screen.getByText('Aucune transcription disponible')).toBeInTheDocument();
  });

  it('should show waiting message when live with no segments', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={[]}
        isLive={true}
      />
    );

    expect(screen.getByText('En attente de transcription...')).toBeInTheDocument();
  });

  it('should show low confidence warning', () => {
    const lowConfidenceSegment = {
      id: 'segment-3',
      text: 'Unclear audio',
      start_time: 10,
      end_time: 12,
      confidence: 0.65,
    };

    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={[lowConfidenceSegment]}
      />
    );

    expect(screen.getByText(/Faible confiance/)).toBeInTheDocument();
    expect(screen.getByText(/65%/)).toBeInTheDocument();
  });

  it('should show legend when medical terms present', () => {
    render(
      <TranscriptPanel
        consultationId="consultation-123"
        segments={mockSegments}
      />
    );

    expect(screen.getByText('Légende:')).toBeInTheDocument();
    expect(screen.getByText('Médicament')).toBeInTheDocument();
    expect(screen.getByText('Symptôme')).toBeInTheDocument();
  });
});
