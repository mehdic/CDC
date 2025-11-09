/**
 * Patient Record Panel Component
 * Sidebar displaying patient medical record during teleconsultation
 * Task: T172 - Implement patient record sidebar
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ExpandMore,
  Person,
  Medication,
  Warning,
  LocalHospital,
  History,
  Phone,
  Email,
  Cake,
  Refresh,
} from '@mui/icons-material';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Patient } from '../../../shared/hooks/useTeleconsultation';

// ============================================================================
// Types
// ============================================================================

interface PrescriptionRecord {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  prescribed_date: string;
  prescribing_doctor: string;
  status: 'active' | 'completed' | 'expired';
}

interface MedicalCondition {
  id: string;
  condition: string;
  diagnosed_date: string;
  status: 'active' | 'resolved';
}

interface ConsultationHistory {
  id: string;
  date: string;
  pharmacist: string;
  summary: string;
  prescriptions_created: number;
}

interface PatientRecordPanelProps {
  patient: Patient;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Mock Data (in real implementation, fetch from API)
// ============================================================================

const mockPrescriptions: PrescriptionRecord[] = [
  {
    id: '1',
    medication_name: 'Metformin 500mg',
    dosage: '500mg',
    frequency: 'Twice daily',
    prescribed_date: '2025-10-15',
    prescribing_doctor: 'Dr. Jean Dupont',
    status: 'active',
  },
  {
    id: '2',
    medication_name: 'Lisinopril 10mg',
    dosage: '10mg',
    frequency: 'Once daily',
    prescribed_date: '2025-09-20',
    prescribing_doctor: 'Dr. Marie Martin',
    status: 'active',
  },
];

const mockConditions: MedicalCondition[] = [
  {
    id: '1',
    condition: 'Type 2 Diabetes',
    diagnosed_date: '2022-03-15',
    status: 'active',
  },
  {
    id: '2',
    condition: 'Hypertension',
    diagnosed_date: '2021-11-08',
    status: 'active',
  },
];

const mockConsultationHistory: ConsultationHistory[] = [
  {
    id: '1',
    date: '2025-10-28',
    pharmacist: 'Jean-Pierre Blanc',
    summary: 'Medication review and diabetes management consultation',
    prescriptions_created: 1,
  },
  {
    id: '2',
    date: '2025-09-15',
    pharmacist: 'Sophie Laurent',
    summary: 'Blood pressure monitoring and lifestyle advice',
    prescriptions_created: 0,
  },
];

// ============================================================================
// PatientRecordPanel Component
// ============================================================================

const PatientRecordPanel: React.FC<PatientRecordPanelProps> = ({
  patient,
  onRefresh,
  isLoading = false,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('demographics');

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // Calculate patient age
  const age = patient.date_of_birth
    ? differenceInYears(new Date(), parseISO(patient.date_of_birth))
    : null;

  // Count active items
  const activePrescriptionsCount = mockPrescriptions.filter((p) => p.status === 'active').length;
  const activeConditionsCount = mockConditions.filter((c) => c.status === 'active').length;
  const allergiesCount = patient.allergies?.length || 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Person sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {patient.first_name} {patient.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Patient ID: {patient.id}
              </Typography>
            </Box>
          </Box>
          {onRefresh && (
            <Tooltip title="Refresh patient data">
              <IconButton onClick={onRefresh} disabled={isLoading} size="small">
                {isLoading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {/* Demographics */}
        <Accordion
          expanded={expandedSection === 'demographics'}
          onChange={handleAccordionChange('demographics')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">Demographics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              <ListItem>
                <Cake sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText
                  primary="Age"
                  secondary={age ? `${age} years (DOB: ${format(parseISO(patient.date_of_birth), 'MMM d, yyyy')})` : 'Not available'}
                />
              </ListItem>
              <ListItem>
                <Phone sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText primary="Phone" secondary={patient.phone || 'Not available'} />
              </ListItem>
              <ListItem>
                <Email sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText primary="Email" secondary={patient.email || 'Not available'} />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Allergies */}
        <Accordion
          expanded={expandedSection === 'allergies'}
          onChange={handleAccordionChange('allergies')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" width="100%">
              <Typography fontWeight="medium">Allergies</Typography>
              <Badge badgeContent={allergiesCount} color="error" sx={{ ml: 'auto', mr: 2 }}>
                <Warning />
              </Badge>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {allergiesCount > 0 ? (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Patient has {allergiesCount} documented {allergiesCount === 1 ? 'allergy' : 'allergies'}
                </Alert>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {patient.allergies?.map((allergy, index) => (
                    <Chip
                      key={index}
                      label={allergy}
                      color="error"
                      icon={<Warning />}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No known allergies documented
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Active Prescriptions */}
        <Accordion
          expanded={expandedSection === 'prescriptions'}
          onChange={handleAccordionChange('prescriptions')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" width="100%">
              <Typography fontWeight="medium">Active Prescriptions</Typography>
              <Badge badgeContent={activePrescriptionsCount} color="primary" sx={{ ml: 'auto', mr: 2 }}>
                <Medication />
              </Badge>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {activePrescriptionsCount > 0 ? (
              <List dense disablePadding>
                {mockPrescriptions
                  .filter((p) => p.status === 'active')
                  .map((prescription, index) => (
                    <React.Fragment key={prescription.id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <Box width="100%">
                          <Typography variant="body2" fontWeight="medium">
                            {prescription.medication_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {prescription.dosage} - {prescription.frequency}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Prescribed by {prescription.prescribing_doctor}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(prescription.prescribed_date), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No active prescriptions
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Chronic Conditions */}
        <Accordion
          expanded={expandedSection === 'conditions'}
          onChange={handleAccordionChange('conditions')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" width="100%">
              <Typography fontWeight="medium">Chronic Conditions</Typography>
              <Badge badgeContent={activeConditionsCount} color="secondary" sx={{ ml: 'auto', mr: 2 }}>
                <LocalHospital />
              </Badge>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {activeConditionsCount > 0 ? (
              <List dense disablePadding>
                {mockConditions
                  .filter((c) => c.status === 'active')
                  .map((condition, index) => (
                    <React.Fragment key={condition.id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {condition.condition}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Diagnosed: {format(parseISO(condition.diagnosed_date), 'MMM yyyy')}
                          </Typography>
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No chronic conditions documented
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Consultation History */}
        <Accordion
          expanded={expandedSection === 'history'}
          onChange={handleAccordionChange('history')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" width="100%">
              <Typography fontWeight="medium">Recent Consultations</Typography>
              <Badge badgeContent={mockConsultationHistory.length} color="info" sx={{ ml: 'auto', mr: 2 }}>
                <History />
              </Badge>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {mockConsultationHistory.map((consultation, index) => (
                <React.Fragment key={consultation.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <Box width="100%">
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {format(parseISO(consultation.date), 'MMM d, yyyy')}
                        </Typography>
                        {consultation.prescriptions_created > 0 && (
                          <Chip
                            label={`${consultation.prescriptions_created} Rx`}
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2">{consultation.summary}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        with {consultation.pharmacist}
                      </Typography>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default PatientRecordPanel;
