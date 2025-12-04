/**
 * Patient Card Component
 * Display individual patient information in card format
 */

import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  DateRange as CalendarIcon,
} from '@mui/icons-material';
import type { DoctorPatient } from '../types/doctor';

export interface PatientCardProps {
  patient: DoctorPatient;
  onViewDetails: (patientId: string) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onViewDetails }) => (
  <Card
    data-testid={`patient-card-${patient.id}`}
    sx={{
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      },
    }}
    onClick={() => onViewDetails(patient.id)}
  >
    <CardContent>
      {/* Patient Name and Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" data-testid="patient-name">
            {patient.firstName} {patient.lastName}
          </Typography>
          {patient.chronicPatient && (
            <Box
              sx={{
                display: 'inline-block',
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: '#fff3e0',
                color: '#e65100',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              data-testid="chronic-badge"
            >
              Patient Chronique
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            color: '#666',
          }}
        >
          <PersonIcon fontSize="small" />
        </Box>
      </Box>

      {/* Contact Information */}
      <Stack spacing={1} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" data-testid="patient-email">
            {patient.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" data-testid="patient-phone">
            {patient.phone}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" data-testid="patient-age">
            Age: {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} ans
          </Typography>
        </Box>
      </Stack>

      {/* Last Visit */}
      {patient.lastVisit && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Dernière visite:
          </Typography>
          <Typography variant="body2" data-testid="patient-last-visit">
            {new Date(patient.lastVisit).toLocaleDateString('fr-CH')}
          </Typography>
        </Box>
      )}

      {/* Active Conditions */}
      {patient.activeConditions.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Conditions actives:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            {patient.activeConditions.slice(0, 2).map((condition, idx) => (
              <Box
                key={idx}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: '#f0f0f0',
                  fontSize: '0.75rem',
                }}
                data-testid="active-condition"
              >
                {condition}
              </Box>
            ))}
            {patient.activeConditions.length > 2 && (
              <Typography variant="caption" color="text.secondary">
                +{patient.activeConditions.length - 2} autre(s)
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </CardContent>
  </Card>
);
