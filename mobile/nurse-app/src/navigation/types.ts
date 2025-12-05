/**
 * Navigation Type Definitions for Nurse App
 * Defines all navigation routes and their parameters
 */

import { StackScreenProps } from '@react-navigation/stack';

export type PatientsStackParamList = {
  PatientSearch: undefined;
  PatientMedications: {
    patientId: string;
    patientName: string;
  };
  MedicationOrder: {
    patientId: string;
    patientName: string;
  };
  Administration: {
    patientId: string;
    medicationId?: string;
    scheduledTime?: string;
  };
  BarcodeScanner: {
    patientId: string;
    onScan: (barcode: string) => void;
  };
  PatientRecords: {
    patientId: string;
    patientName: string;
  };
  Reactions: {
    patientId: string;
    patientName: string;
    medicationId?: string;
    medicationName?: string;
  };
};

export type MedicationOrderScreenProps = StackScreenProps<
  PatientsStackParamList,
  'MedicationOrder'
>;

export type AdministrationRecordingScreenProps = StackScreenProps<
  PatientsStackParamList,
  'Administration'
>;

export type BarcodeScannerScreenProps = StackScreenProps<
  PatientsStackParamList,
  'BarcodeScanner'
>;

export type PatientRecordsScreenProps = StackScreenProps<
  PatientsStackParamList,
  'PatientRecords'
>;

export type AdverseReactionsScreenProps = StackScreenProps<
  PatientsStackParamList,
  'Reactions'
>;
