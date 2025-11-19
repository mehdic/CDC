/**
 * Validation Middleware
 * Validates request body against DTOs using class-validator
 */

import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * Validation middleware factory
 * Creates middleware that validates request body/query against a DTO class
 */
export function validateBody<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Transform plain object to DTO instance
    const dtoInstance = plainToInstance(dtoClass, req.body);

    // Validate the DTO
    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      skipMissingProperties: false, // Don't skip missing properties
    });

    if (errors.length > 0) {
      // Format validation errors
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      });
      return;
    }

    // Replace request body with validated DTO instance
    req.body = dtoInstance;
    next();
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Transform plain object to DTO instance
    const dtoInstance = plainToInstance(dtoClass, req.query, {
      enableImplicitConversion: true, // Enable automatic type conversion for query params
    });

    // Validate the DTO
    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: false, // Don't fail on extra query params
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      // Format validation errors
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      });
      return;
    }

    // Replace request query with validated DTO instance
    req.query = dtoInstance as any;
    next();
  };
}

/**
 * Validation middleware for route params
 */
export function validateParams<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Transform plain object to DTO instance
    const dtoInstance = plainToInstance(dtoClass, req.params);

    // Validate the DTO
    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      // Format validation errors
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      });
      return;
    }

    // Replace request params with validated DTO instance
    req.params = dtoInstance as any;
    next();
  };
}
