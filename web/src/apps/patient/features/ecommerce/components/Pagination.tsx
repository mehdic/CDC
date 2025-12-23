/**
 * Pagination Component
 * Handles pagination controls
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React from 'react';
import '../styles/Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  isLoading = false,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const pages = [];
  const maxPagesToShow = 5;
  const halfPages = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfPages);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !isLoading) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="pagination" data-testid="pagination">
      <div className="pagination__info">
        <p className="pagination__results-info">
          Showing {startItem} to {endItem} of {total} results
        </p>
      </div>

      <div className="pagination__controls">
        <button
          className="pagination__button pagination__button--prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          data-testid="pagination-prev"
          aria-label="Previous page"
        >
          ← Previous
        </button>

        <div className="pagination__pages">
          {startPage > 1 && (
            <>
              <button
                className={`pagination__page ${currentPage === 1 ? 'pagination__page--active' : ''}`}
                onClick={() => handlePageChange(1)}
                disabled={isLoading}
                data-testid="pagination-page-1"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="pagination__ellipsis">...</span>
              )}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              className={`pagination__page ${currentPage === page ? 'pagination__page--active' : ''}`}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              data-testid={`pagination-page-${page}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="pagination__ellipsis">...</span>
              )}
              <button
                className={`pagination__page ${currentPage === totalPages ? 'pagination__page--active' : ''}`}
                onClick={() => handlePageChange(totalPages)}
                disabled={isLoading}
                data-testid={`pagination-page-${totalPages}`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          className="pagination__button pagination__button--next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          data-testid="pagination-next"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
};
