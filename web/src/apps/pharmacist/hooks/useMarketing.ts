/**
 * Marketing Hooks
 * Custom React hooks for campaign, promotion, and template management
 */

import { useState, useCallback, useEffect } from 'react';
import {
  CampaignResponse,
  PromotionResponse,
  TemplateResponse,
  CampaignAnalyticsResponse,
} from '../../../shared/types/marketing.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface UseMarketingReturn {
  campaigns: CampaignResponse[];
  promotions: PromotionResponse[];
  templates: TemplateResponse[];
  loading: boolean;
  error: string | null;
  createCampaign: (data: any) => Promise<CampaignResponse>;
  updateCampaign: (id: string, data: any) => Promise<CampaignResponse>;
  deleteCampaign: (id: string) => Promise<void>;
  executeCampaign: (id: string) => Promise<void>;
  getCampaignAnalytics: (id: string) => Promise<CampaignAnalyticsResponse>;
  createPromotion: (data: any) => Promise<PromotionResponse>;
  updatePromotion: (id: string, data: any) => Promise<PromotionResponse>;
  deletePromotion: (id: string) => Promise<void>;
  validatePromoCode: (code: string, amount?: number) => Promise<any>;
  createTemplate: (data: any) => Promise<TemplateResponse>;
  updateTemplate: (id: string, data: any) => Promise<TemplateResponse>;
  deleteTemplate: (id: string) => Promise<void>;
  renderTemplate: (id: string, variables: Record<string, any>) => Promise<any>;
  refreshCampaigns: () => Promise<void>;
  refreshPromotions: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
}

export function useMarketing(pharmacyId: string): UseMarketingReturn {
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Campaign Functions
  // ============================================================================

  const createCampaign = useCallback(
    async (data: any): Promise<CampaignResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/pharmacies/${pharmacyId}/campaigns`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to create campaign');
        }

        const campaign = await response.json();
        setCampaigns((prev) => [campaign, ...prev]);
        return campaign;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pharmacyId],
  );

  const updateCampaign = useCallback(
    async (id: string, data: any): Promise<CampaignResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update campaign');
        }

        const campaign = await response.json();
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? campaign : c)),
        );
        return campaign;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeCampaign = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/campaigns/${id}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to execute campaign');
      }

      await refreshCampaigns();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCampaignAnalytics = useCallback(
    async (id: string): Promise<CampaignAnalyticsResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/campaigns/${id}/analytics`);

        if (!response.ok) {
          throw new Error('Failed to get campaign analytics');
        }

        return await response.json();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ============================================================================
  // Promotion Functions
  // ============================================================================

  const createPromotion = useCallback(
    async (data: any): Promise<PromotionResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/pharmacies/${pharmacyId}/promotions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to create promotion');
        }

        const promotion = await response.json();
        setPromotions((prev) => [promotion, ...prev]);
        return promotion;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pharmacyId],
  );

  const updatePromotion = useCallback(
    async (id: string, data: any): Promise<PromotionResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/promotions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update promotion');
        }

        const promotion = await response.json();
        setPromotions((prev) =>
          prev.map((p) => (p.id === id ? promotion : p)),
        );
        return promotion;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deletePromotion = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/promotions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete promotion');
      }

      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validatePromoCode = useCallback(async (code: string, amount?: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/promotions/validate/${code}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        },
      );

      if (!response.ok) {
        throw new Error('Invalid promotion code');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // Template Functions
  // ============================================================================

  const createTemplate = useCallback(
    async (data: any): Promise<TemplateResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/pharmacies/${pharmacyId}/templates`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to create template');
        }

        const template = await response.json();
        setTemplates((prev) => [template, ...prev]);
        return template;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pharmacyId],
  );

  const updateTemplate = useCallback(
    async (id: string, data: any): Promise<TemplateResponse> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update template');
        }

        const template = await response.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? template : t)),
        );
        return template;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const renderTemplate = useCallback(
    async (id: string, variables: Record<string, any>) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/templates/${id}/render`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to render template');
        }

        return await response.json();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ============================================================================
  // Refresh Functions
  // ============================================================================

  const refreshCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/pharmacies/${pharmacyId}/campaigns`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      setCampaigns(await response.json());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  const refreshPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/pharmacies/${pharmacyId}/promotions`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }

      setPromotions(await response.json());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  const refreshTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/pharmacies/${pharmacyId}/templates`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      setTemplates(await response.json());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  // Load initial data on mount
  useEffect(() => {
    refreshCampaigns();
    refreshPromotions();
    refreshTemplates();
  }, [refreshCampaigns, refreshPromotions, refreshTemplates]);

  return {
    campaigns,
    promotions,
    templates,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    executeCampaign,
    getCampaignAnalytics,
    createPromotion,
    updatePromotion,
    deletePromotion,
    validatePromoCode,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate,
    refreshCampaigns,
    refreshPromotions,
    refreshTemplates,
  };
}

export default useMarketing;
