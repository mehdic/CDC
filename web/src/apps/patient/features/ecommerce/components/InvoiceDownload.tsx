/**
 * InvoiceDownload Component
 * Button to download order invoice as PDF
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React, { useState } from 'react';
import { downloadInvoice } from '../services/orderService';

interface InvoiceDownloadProps {
  orderId: string;
  orderNumber: string;
  className?: string;
}

export function InvoiceDownload({
  orderId,
  orderNumber,
  className = '',
}: InvoiceDownloadProps): JSX.Element {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (): Promise<void> => {
    try {
      setDownloading(true);
      setError(null);

      const blob = await downloadInvoice(orderId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement de la facture');
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        data-testid="download-invoice-button"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {downloading ? 'Téléchargement...' : 'Télécharger la facture'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
