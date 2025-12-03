/**
 * Digital Twin Service
 * API client for digital twin operations
 */

import { apiClient } from '../api/client';

export interface DigitalTwinData {
  id: string;
  patientId: string;
  age?: number;
  gender?: string;
  overallHealthScore: number;
  currentRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  medicationAdherence: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  adherenceScore?: number;
  cardiovascularRisk?: number;
  diabetesRisk?: number;
  hospitalReadmissionRisk?: number;
  medications: any[];
  allergies: any[];
  chronicConditions: any[];
  vitalSigns: any[];
  riskFactors: any[];
  recommendations: any[];
  healthTrajectory: any[];
  whatIfScenarios?: any[];
  lastUpdatedAt: string;
  createdAt: string;
}

export interface CreateDigitalTwinRequest {
  patientId: string;
  age?: number;
  gender?: string;
  ethnicity?: string;
  aiAnalysisConsent?: boolean;
  dataSharingConsent?: boolean;
}

export interface UpdateDigitalTwinRequest {
  medications?: any[];
  allergies?: any[];
  chronicConditions?: any[];
  labResults?: any[];
  vitalSigns?: any[];
  familyHistory?: any[];
  careTeam?: any[];
  healthGoals?: any[];
}

export interface WhatIfScenarioRequest {
  scenario: string;
  description: string;
}

export const digitalTwinService = {
  /**
   * Get digital twin for a patient
   */
  async getDigitalTwin(patientId: string): Promise<DigitalTwinData> {
    const response = await apiClient.get(`/digital-twin/${patientId}`);
    return response.data.data;
  },

  /**
   * Create a new digital twin
   */
  async createDigitalTwin(data: CreateDigitalTwinRequest): Promise<DigitalTwinData> {
    const response = await apiClient.post('/digital-twin', data);
    return response.data.data;
  },

  /**
   * Update digital twin data
   */
  async updateDigitalTwin(
    patientId: string,
    data: UpdateDigitalTwinRequest
  ): Promise<DigitalTwinData> {
    const response = await apiClient.put(`/digital-twin/${patientId}`, data);
    return response.data.data;
  },

  /**
   * Recalculate health scores
   */
  async recalculateScores(patientId: string): Promise<any> {
    const response = await apiClient.post(`/digital-twin/${patientId}/recalculate`);
    return response.data.data;
  },

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(patientId: string): Promise<any[]> {
    const response = await apiClient.post(`/digital-twin/${patientId}/recommendations`);
    return response.data.data.recommendations;
  },

  /**
   * Create a what-if scenario
   */
  async createWhatIfScenario(
    patientId: string,
    data: WhatIfScenarioRequest
  ): Promise<any> {
    const response = await apiClient.post(`/digital-twin/${patientId}/what-if`, data);
    return response.data.data;
  },

  /**
   * Get health trajectory
   */
  async getHealthTrajectory(patientId: string): Promise<any> {
    const response = await apiClient.get(`/digital-twin/${patientId}/trajectory`);
    return response.data.data;
  },

  /**
   * Get risk factors
   */
  async getRiskFactors(patientId: string): Promise<any> {
    const response = await apiClient.get(`/digital-twin/${patientId}/risk-factors`);
    return response.data.data;
  },
};
