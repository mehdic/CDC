/**
 * Cold Chain Controller
 * REST API endpoints for cold chain monitoring management
 */

import { Router, Response, RequestHandler } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middleware/auth';
import { ColdChainService } from '../services/ColdChainService';
import { TemperatureAlertService } from '../services/TemperatureAlertService';

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
    this.router.post('/sensors/register', this.registerSensor.bind(this) as RequestHandler);

    this.router.get('/sensors/attention', this.getSensorsRequiringAttention.bind(this) as RequestHandler);

    // Temperature Readings
    this.router.post('/readings', this.recordTemperatureReading.bind(this) as RequestHandler);

    // Cold Chain Monitoring
    this.router.post('/monitoring/start', this.startMonitoring.bind(this) as RequestHandler);

    this.router.post('/monitoring/:monitoringId/complete', this.completeMonitoring.bind(this) as RequestHandler);

    this.router.get('/monitoring/delivery/:deliveryId', this.getDeliveryMonitoring.bind(this) as RequestHandler);

    // Alerts
    this.router.get('/alerts', this.getAlerts.bind(this) as RequestHandler);

    this.router.post('/alerts/:alertId/resolve', this.resolveAlert.bind(this) as RequestHandler);
  }

  private async registerSensor(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        performedBy: req.user?.userId || 'system',
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

  private async getSensorsRequiringAttention(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  private async recordTemperatureReading(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  private async startMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  private async completeMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  private async getDeliveryMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  private async getAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const alerts = this.alertService.getActiveAlerts();
      const stats = this.alertService.getAlertStatistics();

      res.json({ success: true, alerts, statistics: stats });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async resolveAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
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
