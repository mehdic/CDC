/**
 * DocumentManager Component
 * Upload and download medical documents
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { downloadDocument } from '../services/medicalRecordsService';
import { useMedicalRecords } from '../hooks/useMedicalRecords';
import { RecordType, DocumentData } from '../types';

export function DocumentManager() {
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<RecordType>(
    RecordType.OTHER
  );
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const { upload, uploading, uploadProgress, error: uploadError } =
    useDocumentUpload();
  const { records, loading, error: fetchError } = useMedicalRecords();

  const documentRecords = records.filter(
    (record) =>
      record.data &&
      typeof record.data === 'object' &&
      'fileName' in record.data
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!title) {
        setTitle(files[0].name);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      return;
    }

    try {
      await upload({
        file: selectedFile,
        recordType: documentType,
        title,
        description: description || null,
      });

      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setShowUploadForm(false);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDownload = async (recordId: string, fileName: string) => {
    try {
      const blob = await downloadDocument(recordId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="document-manager-loading">
        <div className="spinner" />
        <p>Loading documents...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="document-manager-error">
        <p>Error loading documents</p>
        <p className="error-message">{fetchError.message}</p>
      </div>
    );
  }

  return (
    <div className="document-manager">
      <div className="document-header">
        <h2>Medical Documents</h2>
        <button
          type="button"
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="upload-toggle-btn"
        >
          {showUploadForm ? 'Cancel Upload' : '+ Upload Document'}
        </button>
      </div>

      {showUploadForm && (
        <div className="upload-form-container">
          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="file-input">Select File:</label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
              />
              {selectedFile && (
                <p className="file-info">
                  Selected: {selectedFile.name} (
                  {formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="title-input">Title:</label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type-select">Document Type:</label>
              <select
                id="type-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as RecordType)}
              >
                <option value={RecordType.LAB_RESULT}>Lab Result</option>
                <option value={RecordType.PRESCRIPTION}>Prescription</option>
                <option value={RecordType.IMAGING}>Imaging</option>
                <option value={RecordType.CONSULTATION}>Consultation</option>
                <option value={RecordType.OTHER}>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description-input">Description (optional):</label>
              <textarea
                id="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this document"
                rows={3}
              />
            </div>

            {uploadError && (
              <div className="upload-error">
                <p>Upload failed: {uploadError.message}</p>
              </div>
            )}

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p>{uploadProgress}% uploaded</p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="upload-btn"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="documents-list">
        {documentRecords.length === 0 ? (
          <div className="documents-empty">
            <p>No documents uploaded</p>
            <p className="empty-subtitle">
              Upload medical documents, lab results, or prescriptions
            </p>
          </div>
        ) : (
          <div className="documents-grid">
            {documentRecords.map((record) => {
              const data = record.data as unknown as DocumentData;
              return (
                <div key={record.id} className="document-card">
                  <div className="document-icon">📄</div>
                  <div className="document-info">
                    <h3 className="document-title">{record.title}</h3>
                    {data && (
                      <>
                        <p className="document-filename">{data.fileName}</p>
                        <p className="document-size">
                          {formatFileSize(data.fileSize)}
                        </p>
                        <p className="document-date">
                          Uploaded: {formatDate(data.uploadedAt)}
                        </p>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      data && handleDownload(record.id, data.fileName)
                    }
                    className="download-btn"
                  >
                    Download
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="documents-summary">
        <p>Total Documents: {documentRecords.length}</p>
      </div>
    </div>
  );
}
