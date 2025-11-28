/**
 * Request Validation Middleware
 * Validates request body against DTOs using class-validator
 */

import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function validateRequest<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors: ValidationError[] = await validate(dtoInstance as object);

    if (errors.length > 0) {
      const formattedErrors = errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
      }));

      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: formattedErrors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Replace req.body with validated DTO
    req.body = dtoInstance;
    next();
  };
}
