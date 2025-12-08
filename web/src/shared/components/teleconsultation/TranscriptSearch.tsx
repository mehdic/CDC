/**
 * Transcript Search Component
 * Search within transcripts for medical terms, symptoms, medications
 * Task: T3-017
 */

import React, { useState } from 'react';

interface SearchResult {
  consultation_id: string;
  segment_id: string;
  text: string;
  context: string;
  timestamp: number;
  relevance_score: number;
}

interface TranscriptSearchProps {
  consultationId?: string;
  onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
}

interface SearchFilters {
  searchType: 'text' | 'medical_term';
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Transcript Search Component
 */
export function TranscriptSearch({ consultationId, onSearch }: TranscriptSearchProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'medical_term'>('text');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Veuillez entrer un terme de recherche');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const filters: SearchFilters = {
        searchType,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const searchResults = await onSearch(query, filters);
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="p-4 border-b space-y-4">
        <div>
          <label htmlFor="transcript-search-input" className="block text-sm font-medium text-gray-700 mb-2">
            Recherche dans les transcriptions
          </label>
          <div className="flex gap-2">
            <input
              id="transcript-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: ibuprofène, maux de tête, allergie..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSearching}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSearching}
            >
              {isSearching ? (
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search Type */}
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="text"
              checked={searchType === 'text'}
              onChange={(e) => setSearchType(e.target.value as 'text')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Texte complet</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="medical_term"
              checked={searchType === 'medical_term'}
              onChange={(e) => setSearchType(e.target.value as 'medical_term')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Termes médicaux uniquement</span>
          </label>
        </div>

        {/* Date filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="date-from-input" className="block text-xs text-gray-600 mb-1">Date de début</label>
            <input
              id="date-from-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              disabled={isSearching}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="date-to-input" className="block text-xs text-gray-600 mb-1">Date de fin</label>
            <input
              id="date-to-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              disabled={isSearching}
            />
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="p-4">
        {results.length === 0 && !isSearching && query && (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>Aucun résultat trouvé</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé
              {results.length > 1 ? 's' : ''}
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={`${result.consultation_id}-${result.segment_id}-${index}`}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 font-mono">
                      {formatTimestamp(result.timestamp)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Consultation: {result.consultation_id.substring(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mb-1">
                    {highlightMatch(result.text, query)}
                  </p>
                  {result.context !== result.text && (
                    <p className="text-xs text-gray-500 italic">
                      Contexte: {highlightMatch(result.context, query)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${result.relevance_score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(result.relevance_score * 100)}% pertinent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
