/**
 * Drug Interaction Checker Component
 * Displays drug interactions with severity color coding
 * Supports override with pharmacist approval
 * T3-007: Frontend drug interaction checker
 */

import React, { useState, useEffect } from 'react';

// Types matching backend
export enum DrugInteractionSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CONTRAINDICATED = 'contraindicated',
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: DrugInteractionSeverity;
  description: string;
  recommendation: string;
}

export interface AllergyWarning {
  medication: string;
  allergen: string;
  allergyType: 'drug' | 'ingredient' | 'class';
  allergySeverity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  recommendation: string;
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: DrugInteraction[];
  allergyWarnings: AllergyWarning[];
  checkedAt: Date;
  patientId?: string;
}

interface DrugInteractionCheckerProps {
  medications: string[];
  patientId?: string;
  patientAllergies?: AllergyWarning[];
  onOverride?: (interaction: DrugInteraction, reason: string) => void;
  autoCheck?: boolean; // Automatically check on medication change
  apiEndpoint?: string; // Custom API endpoint
}

/**
 * Drug Interaction Checker Component
 * Real-time drug interaction checking with color-coded severity display
 */
export const DrugInteractionChecker: React.FC<DrugInteractionCheckerProps> = ({
  medications,
  patientId,
  patientAllergies = [],
  onOverride,
  autoCheck = true,
  apiEndpoint = '/api/drug-interactions/check',
}) => {
  const [result, setResult] = useState<InteractionCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<number>>(new Set());
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overriding, setOverriding] = useState<DrugInteraction | null>(null);

  // Auto-check when medications change
  useEffect(() => {
    if (autoCheck && medications.length > 1) {
      checkInteractions();
    }
  }, [medications, autoCheck]);

  /**
   * Check drug interactions via API
   */
  const checkInteractions = async () => {
    if (medications.length < 2) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications,
          patientId,
          allergies: patientAllergies,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: InteractionCheckResult = await response.json();
      setResult(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to check interactions: ${errorMsg}`);
      console.error('[DrugInteractionChecker] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle expanded view for interaction details
   */
  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedInteractions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInteractions(newExpanded);
  };

  /**
   * Handle override submission
   */
  const handleOverride = () => {
    if (overriding && overrideReason.trim() && onOverride) {
      onOverride(overriding, overrideReason);
      setOverriding(null);
      setOverrideReason('');
    }
  };

  /**
   * Get severity color for UI
   */
  const getSeverityColor = (severity: DrugInteractionSeverity): string => {
    switch (severity) {
      case DrugInteractionSeverity.CONTRAINDICATED:
        return '#d32f2f'; // Red
      case DrugInteractionSeverity.MAJOR:
        return '#f57c00'; // Orange
      case DrugInteractionSeverity.MODERATE:
        return '#fbc02d'; // Yellow
      case DrugInteractionSeverity.MINOR:
        return '#1976d2'; // Blue
      default:
        return '#757575'; // Grey
    }
  };

  /**
   * Get severity badge style
   */
  const getSeverityStyle = (severity: DrugInteractionSeverity): React.CSSProperties => {
    const color = getSeverityColor(severity);
    return {
      backgroundColor: color,
      color: '#fff',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      display: 'inline-block',
    };
  };

  /**
   * Get allergy severity color
   */
  const getAllergySeverityColor = (severity: string): string => {
    switch (severity) {
      case 'anaphylaxis':
        return '#b71c1c'; // Dark red
      case 'severe':
        return '#d32f2f'; // Red
      case 'moderate':
        return '#f57c00'; // Orange
      case 'mild':
        return '#fbc02d'; // Yellow
      default:
        return '#757575'; // Grey
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner} />
          <p>Checking drug interactions...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h4 style={styles.errorTitle}>⚠️ Error</h4>
          <p>{error}</p>
          <button onClick={checkInteractions} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No medications to check
  if (medications.length < 2 && patientAllergies.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.infoBox}>
          <p>Add at least 2 medications to check for interactions.</p>
        </div>
      </div>
    );
  }

  // No result yet
  if (!result) {
    return (
      <div style={styles.container}>
        <button onClick={checkInteractions} style={styles.checkButton}>
          Check Drug Interactions
        </button>
      </div>
    );
  }

  // Render results
  const hasAllergyWarnings = result.allergyWarnings && result.allergyWarnings.length > 0;
  const hasInteractions = result.hasInteractions;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Drug Interaction Check</h3>
        <p style={styles.subtitle}>
          Checked {medications.length} medications at{' '}
          {new Date(result.checkedAt).toLocaleTimeString()}
        </p>
        {!autoCheck && (
          <button onClick={checkInteractions} style={styles.refreshButton}>
            Refresh
          </button>
        )}
      </div>

      {/* Allergy Warnings */}
      {hasAllergyWarnings && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>⚠️ Allergy Warnings</h4>
          {result.allergyWarnings.map((warning, index) => (
            <div key={index} style={styles.allergyWarning}>
              <div style={styles.allergyHeader}>
                <span
                  style={{
                    ...styles.severityBadge,
                    backgroundColor: getAllergySeverityColor(warning.allergySeverity),
                  }}
                >
                  {warning.allergySeverity}
                </span>
                <span style={styles.allergyText}>
                  <strong>{warning.medication}</strong> - Allergy to {warning.allergen} (
                  {warning.allergyType})
                </span>
              </div>
              <p style={styles.recommendation}>{warning.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Drug Interactions */}
      {hasInteractions ? (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>💊 Drug Interactions Found</h4>
          {result.interactions.map((interaction, index) => (
            <div key={index} style={styles.interactionCard}>
              <div
                style={styles.interactionHeader}
                onClick={() => toggleExpanded(index)}
              >
                <div style={styles.interactionDrugs}>
                  <span style={getSeverityStyle(interaction.severity)}>
                    {interaction.severity}
                  </span>
                  <span style={styles.drugNames}>
                    {interaction.drug1} ⚡ {interaction.drug2}
                  </span>
                </div>
                <span style={styles.expandIcon}>
                  {expandedInteractions.has(index) ? '▼' : '▶'}
                </span>
              </div>

              {expandedInteractions.has(index) && (
                <div style={styles.interactionDetails}>
                  <div style={styles.detailSection}>
                    <h5 style={styles.detailTitle}>Description:</h5>
                    <p style={styles.detailText}>{interaction.description}</p>
                  </div>

                  <div style={styles.detailSection}>
                    <h5 style={styles.detailTitle}>Recommendation:</h5>
                    <p style={styles.detailText}>{interaction.recommendation}</p>
                  </div>

                  {onOverride && (
                    <div style={styles.overrideSection}>
                      <button
                        onClick={() => setOverriding(interaction)}
                        style={styles.overrideButton}
                      >
                        Override with Reason
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.section}>
          <div style={styles.successBox}>
            <h4 style={styles.successTitle}>✓ No Interactions Found</h4>
            <p>No known drug interactions detected between these medications.</p>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overriding && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h4 style={styles.modalTitle}>Override Interaction Warning</h4>
            <p style={styles.modalText}>
              You are overriding a <strong>{overriding.severity}</strong> interaction between{' '}
              <strong>{overriding.drug1}</strong> and <strong>{overriding.drug2}</strong>.
            </p>
            <p style={styles.modalWarning}>
              This action requires pharmacist approval. Please provide a clinical justification.
            </p>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter clinical justification for override..."
              style={styles.overrideTextarea}
              rows={4}
            />
            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setOverriding(null);
                  setOverrideReason('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                style={{
                  ...styles.submitButton,
                  opacity: overrideReason.trim() ? 1 : 0.5,
                }}
              >
                Submit Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  refreshButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  checkButton: {
    padding: '12px 24px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  allergyWarning: {
    backgroundColor: '#fff3e0',
    border: '2px solid #f57c00',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
  },
  allergyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  severityBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#fff',
  },
  allergyText: {
    fontSize: '14px',
    color: '#333',
  },
  recommendation: {
    margin: '8px 0 0 0',
    fontSize: '13px',
    color: '#555',
    fontStyle: 'italic',
  },
  interactionCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  interactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
  },
  interactionDrugs: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  drugNames: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#666',
  },
  interactionDetails: {
    padding: '16px',
    borderTop: '1px solid #eee',
  },
  detailSection: {
    marginBottom: '16px',
  },
  detailTitle: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  detailText: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5',
  },
  overrideSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #eee',
  },
  overrideButton: {
    padding: '8px 16px',
    backgroundColor: '#f57c00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    border: '2px solid #4caf50',
    borderRadius: '6px',
    padding: '16px',
  },
  successTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196f3',
    borderRadius: '6px',
    padding: '16px',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    border: '2px solid #d32f2f',
    borderRadius: '6px',
    padding: '16px',
  },
  errorTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#c62828',
  },
  retryButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#d32f2f',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '40px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #1976d2',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#555',
  },
  modalWarning: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  overrideTextarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#757575',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#f57c00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

export default DrugInteractionChecker;
