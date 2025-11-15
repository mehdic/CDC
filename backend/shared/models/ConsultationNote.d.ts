import { Teleconsultation } from './Teleconsultation';
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
    edit_history: EditHistoryEntry[] | null;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=ConsultationNote.d.ts.map