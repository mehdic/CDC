/**
 * useSearch Hook Tests
 * Tests search functionality with debouncing
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useSearch } from '../hooks/useSearch';
import * as ecommerceService from '../services/ecommerceService';

jest.mock('../services/ecommerceService');
jest.useFakeTimers();

const mockSearchResults = [
  { id: '1', name: 'Aspirin', price: 5.99 } as any,
  { id: '2', name: 'Ibuprofen', price: 7.99 } as any,
];

describe('useSearch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should not search with less than minimum characters', async () => {
    const { result } = renderHook(() => useSearch(2));

    act(() => {
      result.current.setQuery('a');
    });

    jest.runAllTimers();

    expect(ecommerceService.searchProducts).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
  });

  it('should debounce search queries', async () => {
    (ecommerceService.searchProducts as jest.Mock).mockResolvedValue({
      data: mockSearchResults,
      query: 'aspirin',
      count: 2,
    });

    const { result } = renderHook(() => useSearch(2));

    act(() => {
      result.current.setQuery('asp');
      jest.advanceTimersByTime(100);
      result.current.setQuery('aspi');
      jest.advanceTimersByTime(100);
      result.current.setQuery('aspir');
      jest.runAllTimers();
    });

    // Should only call once after debounce
    expect(ecommerceService.searchProducts).toHaveBeenCalledTimes(1);
    expect(ecommerceService.searchProducts).toHaveBeenCalledWith('aspir', 50);
  });

  it('should search when minimum characters reached', async () => {
    (ecommerceService.searchProducts as jest.Mock).mockResolvedValue({
      data: mockSearchResults,
      query: 'aspirin',
      count: 2,
    });

    const { result } = renderHook(() => useSearch(2));

    act(() => {
      result.current.setQuery('aspirin');
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).toEqual(mockSearchResults);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.query).toBe('aspirin');
  });

  it('should clear search', async () => {
    (ecommerceService.searchProducts as jest.Mock).mockResolvedValue({
      data: mockSearchResults,
      query: 'aspirin',
      count: 2,
    });

    const { result } = renderHook(() => useSearch(2));

    act(() => {
      result.current.setQuery('aspirin');
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
  });

  it('should handle search errors', async () => {
    const error = new Error('Search failed');
    (ecommerceService.searchProducts as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useSearch(2));

    act(() => {
      result.current.setQuery('test product');
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.results).toEqual([]);
  });

  it('should log search performance', async () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

    (ecommerceService.searchProducts as jest.Mock).mockResolvedValue({
      data: mockSearchResults,
      query: 'aspirin',
      count: 2,
    });

    const { result } = renderHook(() => useSearch(2));

    act(() => {
      result.current.setQuery('aspirin');
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Search for "aspirin" took')
    );

    consoleInfoSpy.mockRestore();
  });
});
