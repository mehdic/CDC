/**
 * PDF Export Utility Component (T4-008)
 * Provides PDF generation functionality for orders and patient summaries
 * with print-friendly layouts
 */

import React from 'react';
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { exportOrderToPDF, exportPatientSummaryToPDF } from '../services/nurseApi';

interface PDFExportButtonProps {
  type: 'order' | 'patient';
  id: string;
  label?: string;
  variant?: 'text' | 'outlined' | 'contained';
  icon?: 'print' | 'pdf';
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  type,
  id,
  label,
  variant = 'outlined',
  icon = 'pdf',
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      let blob: Blob;
      let filename: string;

      if (type === 'order') {
        blob = await exportOrderToPDF(id);
        filename = `order-${id}.pdf`;
      } else {
        blob = await exportPatientSummaryToPDF(id);
        filename = `patient-${id}-summary.pdf`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'export PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        startIcon={
          loading ? (
            <CircularProgress size={20} />
          ) : icon === 'print' ? (
            <PrintIcon />
          ) : (
            <PdfIcon />
          )
        }
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? 'Export...' : label || 'Exporter PDF'}
      </Button>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          PDF exporté avec succès
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

/**
 * Bulk Export Component
 * Allows exporting multiple orders or patients at once
 */
interface BulkPDFExportProps {
  type: 'order' | 'patient';
  ids: string[];
  onComplete?: () => void;
}

export const BulkPDFExport: React.FC<BulkPDFExportProps> = ({ type, ids, onComplete }) => {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const handleBulkExport = async () => {
    if (ids.length === 0) {
      setError('Aucun élément sélectionné');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        let blob: Blob;
        let filename: string;

        if (type === 'order') {
          blob = await exportOrderToPDF(id);
          filename = `order-${id}.pdf`;
        } else {
          blob = await exportPatientSummaryToPDF(id);
          filename = `patient-${id}-summary.pdf`;
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        // Update progress
        setProgress(((i + 1) / ids.length) * 100);

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'export en masse');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
        onClick={handleBulkExport}
        disabled={loading || ids.length === 0}
      >
        {loading
          ? `Export... ${Math.round(progress)}%`
          : `Exporter ${ids.length} PDF${ids.length > 1 ? 's' : ''}`}
      </Button>

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default PDFExportButton;
