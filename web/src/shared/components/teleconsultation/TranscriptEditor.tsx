/**
 * Transcript Editor Component
 * Allows pharmacists to edit and correct transcript segments
 * Task: T3-017
 */

import React, { useState } from 'react';

interface TranscriptSegment {
  id: string;
  text: string;
  start_time: number;
  speaker?: {
    id: string;
    name?: string;
    role?: 'pharmacist' | 'patient' | 'unknown';
  };
}

interface TranscriptEditorProps {
  consultationId: string;
  segment: TranscriptSegment;
  onSave: (segmentId: string, newText: string, reason?: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Transcript Editor Modal
 */
export function TranscriptEditor({
  consultationId,
  segment,
  onSave,
  onCancel,
}: TranscriptEditorProps) {
  const [editedText, setEditedText] = useState(segment.text);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (editedText.trim() === '') {
      setError('Le texte ne peut pas être vide');
      return;
    }

    if (editedText === segment.text) {
      setError('Aucune modification détectée');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(segment.id, editedText, reason || undefined);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      setIsSaving(false);
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Modifier la transcription
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSaving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">Horodatage: {formatTimestamp(segment.start_time)}</span>
            {segment.speaker && (
              <span>
                Locuteur: {segment.speaker.name || segment.speaker.role || 'Inconnu'}
              </span>
            )}
          </div>

          {/* Original text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texte original:
            </label>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700">
              {segment.text}
            </div>
          </div>

          {/* Edited text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texte corrigé: *
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              disabled={isSaving}
            />
          </div>

          {/* Reason (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de la modification (optionnel):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Correction d'une erreur de reconnaissance vocale"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              ℹ️ Toutes les modifications sont enregistrées avec un historique d'audit HIPAA-compliant.
              Le texte original sera conservé.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
