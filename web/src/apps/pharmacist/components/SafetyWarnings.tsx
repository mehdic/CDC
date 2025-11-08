/**
 * Safety Warnings Panel Component
 * Displays drug interactions, allergy warnings, and contraindications
 * Task: T119 - Implement safety warnings panel
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';
import {
  DrugInteraction,
  AllergyWarning,
  Contraindication,
} from '../../../shared/hooks/usePrescriptions';

// ============================================================================
// Types
// ============================================================================

export interface SafetyWarningsProps {
  drugInteractions?: DrugInteraction[];
  allergyWarnings?: AllergyWarning[];
  contraindications?: Contraindication[];
}

type Severity = 'low' | 'moderate' | 'high' | 'critical';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get severity color
 */
const getSeverityColor = (severity: Severity): 'info' | 'warning' | 'error' => {
  switch (severity) {
    case 'low':
      return 'info';
    case 'moderate':
      return 'warning';
    case 'high':
    case 'critical':
      return 'error';
    default:
      return 'warning';
  }
};

/**
 * Get severity icon
 */
const getSeverityIcon = (severity: Severity): React.ReactElement => {
  switch (severity) {
    case 'low':
      return <InfoIcon />;
    case 'moderate':
      return <WarningIcon />;
    case 'high':
    case 'critical':
      return <ErrorIcon />;
    default:
      return <WarningIcon />;
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Drug Interaction Item
 */
const DrugInteractionItem: React.FC<{ interaction: DrugInteraction }> = ({ interaction }) => {
  return (
    <Alert
      severity={getSeverityColor(interaction.severity)}
      icon={getSeverityIcon(interaction.severity)}
      sx={{ mb: 1 }}
    >
      <AlertTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold">
            {interaction.drug1} ↔ {interaction.drug2}
          </Typography>
          <Chip
            label={interaction.severity.toUpperCase()}
            size="small"
            color={getSeverityColor(interaction.severity)}
          />
        </Stack>
      </AlertTitle>
      <Typography variant="body2">{interaction.description}</Typography>
    </Alert>
  );
};

/**
 * Allergy Warning Item
 */
const AllergyWarningItem: React.FC<{ warning: AllergyWarning }> = ({ warning }) => {
  return (
    <Alert
      severity={getSeverityColor(warning.severity)}
      icon={getSeverityIcon(warning.severity)}
      sx={{ mb: 1 }}
    >
      <AlertTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold">
            Allergen: {warning.allergen}
          </Typography>
          <Chip
            label={warning.severity.toUpperCase()}
            size="small"
            color={getSeverityColor(warning.severity)}
          />
        </Stack>
      </AlertTitle>
      <Typography variant="body2">
        <strong>Reaction Type:</strong> {warning.reaction_type}
      </Typography>
    </Alert>
  );
};

/**
 * Contraindication Item
 */
const ContraindicationItem: React.FC<{ contraindication: Contraindication }> = ({
  contraindication,
}) => {
  return (
    <Alert severity="warning" icon={<MedicalIcon />} sx={{ mb: 1 }}>
      <AlertTitle>
        <Typography variant="subtitle2" fontWeight="bold">
          Condition: {contraindication.condition}
        </Typography>
      </AlertTitle>
      <Typography variant="body2">{contraindication.reason}</Typography>
    </Alert>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const SafetyWarnings: React.FC<SafetyWarningsProps> = ({
  drugInteractions = [],
  allergyWarnings = [],
  contraindications = [],
}) => {
  const hasDrugInteractions = drugInteractions.length > 0;
  const hasAllergyWarnings = allergyWarnings.length > 0;
  const hasContraindications = contraindications.length > 0;
  const hasAnyWarnings = hasDrugInteractions || hasAllergyWarnings || hasContraindications;

  // Calculate highest severity level
  const allSeverities: Severity[] = [
    ...drugInteractions.map((d) => d.severity),
    ...allergyWarnings.map((a) => a.severity),
  ];

  const hasCritical = allSeverities.includes('critical');
  const hasHigh = allSeverities.includes('high');
  const hasModerate = allSeverities.includes('moderate');

  const overallSeverity: Severity = hasCritical
    ? 'critical'
    : hasHigh
    ? 'high'
    : hasModerate
    ? 'moderate'
    : 'low';

  if (!hasAnyWarnings) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="success" icon={<MedicalIcon />}>
          <AlertTitle>
            <Typography variant="h6" fontWeight="bold">
              No Safety Warnings
            </Typography>
          </AlertTitle>
          <Typography variant="body2">
            This prescription has passed all safety checks. No drug interactions, allergy warnings,
            or contraindications detected.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          {getSeverityIcon(overallSeverity)}
          <Typography variant="h6" fontWeight="bold">
            Safety Warnings
          </Typography>
          <Chip
            label={`${overallSeverity.toUpperCase()} SEVERITY`}
            size="small"
            color={getSeverityColor(overallSeverity)}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Review all warnings before approving this prescription. Contact prescribing doctor if
          clarification is needed.
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Drug Interactions */}
      {hasDrugInteractions && (
        <Accordion defaultExpanded={hasCritical || hasHigh}>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ErrorIcon color="error" />
              <Typography variant="subtitle1" fontWeight="bold">
                Drug Interactions
              </Typography>
              <Chip
                label={drugInteractions.length}
                size="small"
                color="error"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {drugInteractions.map((interaction, index) => (
                <DrugInteractionItem key={index} interaction={interaction} />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Allergy Warnings */}
      {hasAllergyWarnings && (
        <Accordion defaultExpanded={hasCritical || hasHigh}>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningIcon color="warning" />
              <Typography variant="subtitle1" fontWeight="bold">
                Allergy Warnings
              </Typography>
              <Chip
                label={allergyWarnings.length}
                size="small"
                color="warning"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {allergyWarnings.map((warning, index) => (
                <AllergyWarningItem key={index} warning={warning} />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Contraindications */}
      {hasContraindications && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MedicalIcon color="warning" />
              <Typography variant="subtitle1" fontWeight="bold">
                Contraindications
              </Typography>
              <Chip
                label={contraindications.length}
                size="small"
                color="warning"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {contraindications.map((contraindication, index) => (
                <ContraindicationItem key={index} contraindication={contraindication} />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default SafetyWarnings;
