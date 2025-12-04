/**
 * Swagger Configuration
 * Configures Swagger/OpenAPI documentation for the API
 */

import { resolve } from 'path';

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger configuration options
 */
export const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'MetaPharm Connect API',
      version: '1.0.0',
      description: `
        Comprehensive REST API for MetaPharm Connect - A healthcare platform
        connecting pharmacists, doctors, nurses, delivery personnel, and patients.

        ## Features
        - Multi-role support (PHARMACIST, DOCTOR, NURSE, DELIVERY, PATIENT)
        - Healthcare integration (prescriptions, teleconsultation, e-Santé)
        - Security (JWT, MFA, HIN e-ID, encryption, audit logging)
        - Real-time features (messaging, notifications, delivery tracking)
        - HIPAA/GDPR compliance with Swiss healthcare regulations

        ## Authentication
        All protected endpoints require JWT Bearer token:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`

        ## Rate Limiting
        - General: 100 requests/minute per IP
        - Auth: 5 login attempts per 15 minutes (production)
        - Auth: 1000 login attempts per 15 minutes (development)

        ## Error Handling
        All errors return consistent JSON format with error codes for client handling.
      `,
      contact: {
        name: 'MetaPharm Support',
        email: 'api-support@metapharm.ch',
      },
      license: {
        name: 'Proprietary',
        url: 'https://metapharm.ch/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development (API Gateway)',
      },
      {
        url: 'https://api.metapharm.ch',
        description: 'Production API',
      },
      {
        url: 'https://staging.metapharm.ch',
        description: 'Staging API',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: `
            JWT Bearer token obtained from the /auth/login endpoint.

            Include in Authorization header:
            \`\`\`
            Authorization: Bearer <token>
            \`\`\`

            Tokens expire in:
            - Access token: 1 hour
            - Refresh token: 7 days
          `,
        },
        HINAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://hin-provider.ch/authorize',
              tokenUrl: 'https://hin-provider.ch/token',
              scopes: {
                'profile:read': 'Read user profile',
                'health:read': 'Read health data',
              },
            },
          },
          description: 'Swiss healthcare ID (HIN) OAuth2 authentication',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['error', 'message', 'code'],
          properties: {
            error: {
              type: 'string',
              description: 'HTTP error name',
              example: 'Bad Request',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
              example: 'Invalid email format',
            },
            code: {
              type: 'string',
              description: 'Machine-readable error code',
              example: 'INVALID_EMAIL',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              additionalProperties: true,
            },
          },
        },
        HealthResponse: {
          type: 'object',
          required: ['status', 'services', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy',
            },
            services: {
              type: 'object',
              properties: {
                apiGateway: { type: 'string', enum: ['up', 'down'] },
                authService: { type: 'string', enum: ['up', 'down'] },
                prescriptionService: { type: 'string', enum: ['up', 'down'] },
                inventoryService: { type: 'string', enum: ['up', 'down'] },
                orderService: { type: 'string', enum: ['up', 'down'] },
                messagingService: { type: 'string', enum: ['up', 'down'] },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'role', 'pharmacyId'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID (UUID)',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'pharmacist@metapharm.ch',
            },
            role: {
              type: 'string',
              enum: ['PHARMACIST', 'DOCTOR', 'NURSE', 'DELIVERY', 'PATIENT'],
              example: 'PHARMACIST',
            },
            firstName: {
              type: 'string',
              example: 'Jean',
            },
            lastName: {
              type: 'string',
              example: 'Dupont',
            },
            pharmacyId: {
              type: 'string',
              nullable: true,
              example: 'pharm-001',
            },
            phone: {
              type: 'string',
              example: '+41791234567',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Prescription: {
          type: 'object',
          required: ['id', 'patientId', 'createdAt', 'status'],
          properties: {
            id: {
              type: 'string',
              example: '650e8400-e29b-41d4-a716-446655440000',
            },
            patientId: {
              type: 'string',
              description: 'Patient ID',
            },
            doctorId: {
              type: 'string',
              description: 'Doctor who created prescription',
            },
            pharmacyId: {
              type: 'string',
              description: 'Pharmacy that will dispense',
            },
            medications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Amoxicilline' },
                  dosage: { type: 'string', example: '500mg' },
                  quantity: { type: 'integer', example: 10 },
                  instructions: {
                    type: 'string',
                    example: 'One tablet three times daily',
                  },
                },
              },
            },
            status: {
              type: 'string',
              enum: ['pending', 'dispensed', 'rejected', 'cancelled'],
              example: 'pending',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Cart: {
          type: 'object',
          required: ['id', 'userId', 'items', 'total'],
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            subtotal: {
              type: 'number',
              format: 'double',
            },
            tax: {
              type: 'number',
              format: 'double',
            },
            total: {
              type: 'number',
              format: 'double',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CartItem: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: {
              type: 'string',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
            },
            price: {
              type: 'number',
              format: 'double',
            },
            name: {
              type: 'string',
            },
          },
        },
        Order: {
          type: 'object',
          required: ['id', 'userId', 'status', 'total'],
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            },
            total: {
              type: 'number',
              format: 'double',
            },
            shippingAddress: {
              $ref: '#/components/schemas/Address',
            },
            trackingNumber: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Address: {
          type: 'object',
          required: ['street', 'city', 'postalCode', 'country'],
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
            state: { type: 'string' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Service health and status endpoints',
      },
      {
        name: 'Authentication',
        description:
          'User authentication, login, MFA, and session management',
      },
      {
        name: 'Prescriptions',
        description: 'Prescription management, validation, and processing',
      },
      {
        name: 'Teleconsultation',
        description:
          'Virtual consultations between healthcare professionals and patients',
      },
      {
        name: 'Inventory',
        description: 'Pharmacy inventory management and stock tracking',
      },
      {
        name: 'Orders & Cart',
        description: 'E-commerce order management and shopping cart',
      },
      {
        name: 'Notifications',
        description: 'Real-time notifications and alerts',
      },
      {
        name: 'Messaging',
        description: 'Inter-professional and patient communications',
      },
      {
        name: 'Delivery',
        description: 'Delivery tracking and logistics',
      },
      {
        name: 'Insurance',
        description: 'Insurance verification and claims',
      },
      {
        name: 'e-Santé',
        description: 'Swiss cantonal health records integration',
      },
    ],
  },
  apis: [
    resolve(__dirname, '../../services/api-gateway/src/index.ts'),
    resolve(__dirname, '../../services/auth-service/src/index.ts'),
    resolve(__dirname, '../../services/prescription-service/src/index.ts'),
    resolve(__dirname, '../../services/order-service/src/index.ts'),
  ],
};

/**
 * Generate OpenAPI/Swagger specs from JSDoc comments
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export const swaggerSpec = swaggerJsdoc(swaggerOptions) as Record<string, unknown>;

/**
 * Swagger UI options
 */
export const swaggerUiOptions = {
  swaggerOptions: {
    url: '/api-docs.json',
    urls: [
      {
        url: '/api-docs.json',
        name: 'MetaPharm Connect API v1',
      },
    ],
    deepLinking: true,
    presets: ['swagger-ui/dist/swagger-ui.js'],
    layout: 'BaseLayout',
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MetaPharm Connect API Documentation',
};
