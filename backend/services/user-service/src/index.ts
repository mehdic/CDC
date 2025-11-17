/**
 * User Service
 * Main Express server for user management
 *
 * Endpoints:
 * - POST /api/users - Create new user
 * - GET /api/users/:id - Get user by ID
 * - PATCH /api/users/:id - Update user
 * - GET /api/users/search?email=... - Search users by email
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.USER_SERVICE_PORT || 4009;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Data Models
// ============================================================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'pharmacist' | 'doctor' | 'nurse' | 'patient' | 'delivery';
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

// In-memory storage
const users = new Map<string, User>();
let nextId = 1;

// ============================================================================
// Validation Functions
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidRole(role: string): role is User['role'] {
  return ['pharmacist', 'doctor', 'nurse', 'patient', 'delivery'].includes(role);
}

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

/**
 * GET /api/users/search?email=... - Search users by email
 * NOTE: This route must come BEFORE /api/users/:id to avoid conflicts
 */
app.get('/api/users/search', (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email query parameter is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Search for users with matching email (case-insensitive partial match)
    const matchingUsers = Array.from(users.values()).filter(user =>
      user.email.toLowerCase().includes(email.toLowerCase())
    );

    return res.status(200).json({
      count: matchingUsers.length,
      users: matchingUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search users',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/users - Create new user
 */
app.post('/api/users', (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, role, phone } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: email, firstName, lastName, role',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate role
    if (!isValidRole(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role. Must be one of: pharmacist, doctor, nurse, patient, delivery',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user with email already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString(),
      });
    }

    // Create new user
    const userId = String(nextId++);
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email,
      firstName,
      lastName,
      role,
      phone: phone || undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    users.set(userId, newUser);

    console.log(`✅ Created user: ${userId} (${email})`);

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/users/:id - Get user by ID
 */
app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = users.get(id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/users/:id - Update user
 */
app.patch('/api/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, phone, status } = req.body;

    const user = users.get(id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate role if provided
    if (role && !isValidRole(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role. Must be one of: pharmacist, doctor, nurse, patient, delivery',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status if provided
    if (status && !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid status. Must be one of: active, inactive, suspended',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if email is being changed to one that already exists
    if (email && email !== user.email) {
      const existingUser = Array.from(users.values()).find(u => u.email === email && u.id !== id);
      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update user fields
    const updatedUser: User = {
      ...user,
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      role: role || user.role,
      phone: phone !== undefined ? phone : user.phone,
      status: status || user.status,
      updatedAt: new Date().toISOString(),
    };

    users.set(id, updatedUser);

    console.log(`✅ Updated user: ${id} (${updatedUser.email})`);

    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't expose internal errors in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(500).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
  try {
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 User Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;
