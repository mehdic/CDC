/**
 * Redux Hooks
 * Type-safe hooks for Redux
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { RootState, AppDispatch } from '../store';

/**
 * Type-safe useDispatch hook
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Type-safe useSelector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
