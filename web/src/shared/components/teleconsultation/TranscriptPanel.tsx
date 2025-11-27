/**
 * Transcript Panel Component
 * Displays real-time transcript during teleconsultation
 * Task: T3-017
 */

import React, { useEffect, useRef } from 'react';

/**
 * Transcript segment with speaker and timing
 */
interface TranscriptSegment {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
  speaker?: {
    id: string;
    name?: string;
    role?: 'pharmacist' | 'patient' | 'unknown';
  };
  highlighted_terms?: Array<{
    term: string;
    category: string;
    start_offset: number;
    end_offset: number;
    confidence: number;
  }>;
}

interface TranscriptPanelProps {
  consultationId: string;
  segments: TranscriptSegment[];
  isLive?: boolean;
  onSegmentClick?: (segment: TranscriptSegment) => void;
}

/**
 * Format timestamp to MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get color for speaker role
 */
function getSpeakerColor(role?: string): string {
  switch (role) {
    case 'pharmacist':
      return 'text-blue-600 bg-blue-50';
    case 'patient':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get category color for medical terms
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    medication: 'bg-purple-200 text-purple-800',
    symptom: 'bg-red-200 text-red-800',
    dosage: 'bg-blue-200 text-blue-800',
    frequency: 'bg-green-200 text-green-800',
    duration: 'bg-yellow-200 text-yellow-800',
    condition: 'bg-orange-200 text-orange-800',
    vital: 'bg-pink-200 text-pink-800',
    allergy: 'bg-red-300 text-red-900',
  };
  return colors[category] || 'bg-gray-200 text-gray-800';
}

/**
 * Render text with highlighted medical terms
 */
function renderHighlightedText(segment: TranscriptSegment): React.ReactNode {
  if (!segment.highlighted_terms || segment.highlighted_terms.length === 0) {
    return <span>{segment.text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Sort terms by start offset
  const sortedTerms = [...segment.highlighted_terms].sort(
    (a, b) => a.start_offset - b.start_offset
  );

  sortedTerms.forEach((term, idx) => {
    // Add text before term
    if (term.start_offset > currentIndex) {
      parts.push(
        <span key={`text-${idx}`}>
          {segment.text.substring(currentIndex, term.start_offset)}
        </span>
      );
    }

    // Add highlighted term
    parts.push(
      <span
        key={`term-${idx}`}
        className={`px-1 py-0.5 rounded text-xs font-medium ${getCategoryColor(term.category)}`}
        title={`${term.category} (${Math.round(term.confidence * 100)}% confidence)`}
      >
        {term.term}
      </span>
    );

    currentIndex = term.end_offset;
  });

  // Add remaining text
  if (currentIndex < segment.text.length) {
    parts.push(<span key="text-end">{segment.text.substring(currentIndex)}</span>);
  }

  return <>{parts}</>;
}

/**
 * Transcript Panel Component
 */
export function TranscriptPanel({
  consultationId,
  segments,
  isLive = false,
  onSegmentClick,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new segments arrive (in live mode)
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, isLive]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Transcription</h3>
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              EN DIRECT
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {segments.length} segment{segments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Transcript segments */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: '500px' }}
      >
        {segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-12 h-12 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <p className="text-sm">
              {isLive ? 'En attente de transcription...' : 'Aucune transcription disponible'}
            </p>
          </div>
        ) : (
          segments.map((segment, index) => (
            <div
              key={segment.id}
              className={`flex gap-3 ${
                onSegmentClick ? 'cursor-pointer hover:bg-gray-50 rounded p-2 -m-2' : ''
              }`}
              onClick={() => onSegmentClick?.(segment)}
            >
              {/* Timestamp */}
              <div className="flex-shrink-0 w-16 text-xs text-gray-500 font-mono pt-1">
                {formatTimestamp(segment.start_time)}
              </div>

              {/* Segment content */}
              <div className="flex-1">
                {/* Speaker */}
                {segment.speaker && (
                  <div
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-1 ${getSpeakerColor(
                      segment.speaker.role
                    )}`}
                  >
                    {segment.speaker.name || segment.speaker.role || 'Inconnu'}
                  </div>
                )}

                {/* Text with highlights */}
                <p className="text-sm text-gray-800 leading-relaxed">
                  {renderHighlightedText(segment)}
                </p>

                {/* Confidence indicator */}
                {segment.confidence < 0.8 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Faible confiance ({Math.round(segment.confidence * 100)}%)
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      {segments.some(s => s.highlighted_terms && s.highlighted_terms.length > 0) && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">Légende:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${getCategoryColor('medication')}`}>
              Médicament
            </span>
            <span className={`px-2 py-1 rounded ${getCategoryColor('symptom')}`}>
              Symptôme
            </span>
            <span className={`px-2 py-1 rounded ${getCategoryColor('dosage')}`}>
              Dosage
            </span>
            <span className={`px-2 py-1 rounded ${getCategoryColor('allergy')}`}>
              Allergie
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
