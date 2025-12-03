/**
 * Cold Chain Controller
 * REST API endpoints for cold chain monitoring management
 */

import { Router, Request, Response } from 'express';
import { ColdChainService } from '../services/ColdChainService';
import { TemperatureAlertService } from '../services/TemperatureAlertService';

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export class ColdChainController {
  private router: Router;
  private coldChainService: ColdChainService;
  private alertService: TemperatureAlertService;

  constructor() {
    this.router = Router();
    this.coldChainService = new ColdChainService();
    this.alertService = new TemperatureAlertService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Sensor Management
    this.router.post('/sensors/register', (req: AuthRequest, res: Response) =>
      this.registerSensor(req, res)
    );

    this.router.get('/sensors/attention', (req: AuthRequest, res: Response) =>
      this.getSensorsRequiringAttention(req, res)
    );

    // Temperature Readings
    this.router.post('/readings', (req: AuthRequest, res: Response) =>
      this.recordTemperatureReading(req, res)
    );

    // Cold Chain Monitoring
    this.router.post('/monitoring/start', (req: AuthRequest, res: Response) =>
      this.startMonitoring(req, res)
    );

    this.router.post('/monitoring/:monitoringId/complete', (req: AuthRequest, res: Response) =>
      this.completeMonitoring(req, res)
    );

    this.router.get('/monitoring/delivery/:deliveryId', (req: AuthRequest, res: Response) =>
      this.getDeliveryMonitoring(req, res)
    );

    // Alerts
    this.router.get('/alerts', (req: AuthRequest, res: Response) =>
      this.getAlerts(req, res)
    );

    this.router.post('/alerts/:alertId/resolve', (req: AuthRequest, res: Response) =>
      this.resolveAlert(req, res)
    );
  }

  private async registerSensor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { serialNumber, model, manufacturer, driverId, vehicleId } = req.body;

      if (!serialNumber) {
        res.status(400).json({ error: 'Serial number is required' });
        return;
      }

      const result = await this.coldChainService.registerSensor({
        serialNumber,
        model,
        manufacturer,
        driverId,
        vehicleId,
        performedBy: req.user?.id || 'system',
      });

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.status(201).json({ success: true, sensor: result.sensor });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getSensorsRequiringAttention(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await this.coldChainService.getSensorsRequiringAttention();

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.json({ success: true, sensors: result.sensors, count: result.sensors.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async recordTemperatureReading(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sensorId, temperature, humidity, timestamp, batteryLevel } = req.body;

      if (!sensorId || temperature === undefined) {
        res.status(400).json({ error: 'sensorId and temperature are required' });
        return;
      }

      const result = await this.coldChainService.recordReading({
        sensorId,
        temperature,
        humidity,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        batteryLevel,
      });

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.json({ success: true, alerts: result.alerts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async startMonitoring(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { deliveryId, productId, sensorId, minTemperature, maxTemperature } = req.body;

      if (!deliveryId || !productId || !sensorId) {
        res.status(400).json({ error: 'deliveryId, productId, and sensorId are required' });
        return;
      }

      if (minTemperature === undefined || maxTemperature === undefined) {
        res.status(400).json({ error: 'minTemperature and maxTemperature are required' });
        return;
      }

      const result = await this.coldChainService.startMonitoring({
        deliveryId,
        productId,
        sensorId,
        minTemperature,
        maxTemperature,
      });

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.status(201).json({ success: true, monitoring: result.monitoring });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async completeMonitoring(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { monitoringId } = req.params;

      const result = await this.coldChainService.completeMonitoring(monitoringId);

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.json({ success: true, monitoring: result.monitoring });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getDeliveryMonitoring(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { deliveryId } = req.params;

      const result = await this.coldChainService.getMonitoringHistory(deliveryId);

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.json({ success: true, monitorings: result.monitorings, count: result.monitorings.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = this.alertService.getActiveAlerts();
      const stats = this.alertService.getAlertStatistics();

      res.json({ success: true, alerts, statistics: stats });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async resolveAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;

      const result = await this.alertService.resolveAlert(alertId);

      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.json({ success: true, alert: result.alert });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
