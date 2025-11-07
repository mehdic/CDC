/**
 * Navigation Type Definitions
 * Defines screen names and their parameters for type-safe navigation
 */

import { Prescription } from '../types';

export type RootStackParamList = {
  CreatePrescription: undefined;
  SendConfirmation: {
    prescription: Prescription;
  };
};
