/**
 * ConsultationNote Entity
 * AI-transcribed and pharmacist-edited notes from teleconsultations
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 2 (P2): Secure Teleconsultation (FR-025, FR-025a, FR-028)
 */
import { Teleconsultation } from './Teleconsultation';
/**
 * Edit history entry for audit trail (FR-025a)
 */
export interface EditHistoryEntry {
    timestamp: Date;
    user_id: string;
    changes: {
        field: string;
        old_value: string;
        new_value: string;
    }[];
    original_ai_version?: string;
}
/**
 * AI-highlighted medical term
 */
export interface HighlightedTerm {
    term: string;
    timestamp: number;
    confidence: number;
    category?: string;
}
export declare class ConsultationNote {
    id: string;
    teleconsultation_id: string;
    teleconsultation: Teleconsultation;
    ai_transcript_encrypted: Buffer | null;
    ai_summary: string | null;
    ai_highlighted_terms: HighlightedTerm[] | null;
    pharmacist_notes_encrypted: Buffer | null;
    edited: boolean;
    /**
     * FR-025a: Immutable audit trail of all transcript edits
     * Original AI version is preserved in edit_history[0].original_ai_version
     * All subsequent edits are tracked with user_id, timestamp, and changes
     */
    edit_history: EditHistoryEntry[] | null;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=ConsultationNote.d.ts.map