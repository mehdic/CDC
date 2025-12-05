/**
 * Cold Chain Service
 * Manages temperature monitoring and compliance for sensitive medication deliveries
 * Implements Swissmedic cold chain requirements
 */

import { getRepository, Repository } from 'typeorm';
import { ColdChainMonitoring, ColdChainStatus } from '../../../../shared/models/ColdChainMonitoring';
import { TemperatureSensor, SensorStatus } from '../../../../shared/models/TemperatureSensor';
import { Delivery } from '../../../../shared/models/Delivery';
import { Product } from '../../../../shared/models/Product';

interface TemperatureSensorReading {
  sensorId: string;
  temperature: number;
  humidity?: number;
  timestamp: Date;
  batteryLevel?: number;
}

export class ColdChainService {
  private coldChainRepository: Repository<ColdChainMonitoring>;
  private sensorRepository: Repository<TemperatureSensor>;
  private deliveryRepository: Repository<Delivery>;
  private productRepository: Repository<Product>;

  constructor() {
    this.coldChainRepository = getRepository(ColdChainMonitoring);
    this.sensorRepository = getRepository(TemperatureSensor);
    this.deliveryRepository = getRepository(Delivery);
    this.productRepository = getRepository(Product);
  }

  async registerSensor(params: {
    serialNumber: string;
    model?: string;
    manufacturer?: string;
    driverId?: string;
    vehicleId?: string;
    performedBy: string;
  }): Promise<{ success: boolean; sensor?: TemperatureSensor; errors: string[] }> {
    const errors: string[] = [];
    try {
      const existing = await this.sensorRepository.findOne({ where: { serial_number: params.serialNumber } } as any);
      if (existing) {
        errors.push(`Sensor with serial number ${params.serialNumber} already exists`);
        return { success: false, errors };
      }

      const sensor = TemperatureSensor.create({
        serialNumber: params.serialNumber,
        model: params.model,
        manufacturer: params.manufacturer,
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        calibrationDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      const savedSensor = await this.sensorRepository.save(sensor);
      return { success: true, sensor: savedSensor, errors: [] };
    } catch (error) {
      errors.push(`Sensor registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  async recordReading(reading: TemperatureSensorReading): Promise<{
    success: boolean;
    alerts: any[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const alerts: any[] = [];

    try {
      const sensor = await this.sensorRepository.findOne({ where: { id: reading.sensorId } } as any);
      if (!sensor) {
        errors.push(`Sensor ${reading.sensorId} not found`);
        return { success: false, alerts, errors };
      }

      sensor.last_reading_temperature = reading.temperature;
      sensor.last_reading_at = reading.timestamp;
      sensor.last_sync_at = new Date();
      sensor.total_readings += 1;
      if (reading.batteryLevel !== undefined) {
        sensor.battery_level = reading.batteryLevel;
      }
      sensor.failed_readings_count = 0;

      await this.sensorRepository.save(sensor);

      const monitorings = await this.coldChainRepository.find({
        where: { sensor_id: reading.sensorId, completed_at: null },
      });

      for (const monitoring of monitorings) {
        if (!monitoring.readings) monitoring.readings = [];
        monitoring.readings.push({
          timestamp: reading.timestamp,
          temperature: reading.temperature,
          humidity: reading.humidity,
          sensorId: reading.sensorId,
        });

        monitoring.current_temperature = reading.temperature;
        monitoring.last_reading_at = reading.timestamp;

        const withinRange = reading.temperature >= monitoring.min_temperature &&
                           reading.temperature <= monitoring.max_temperature;

        if (!withinRange) {
          monitoring.status = ColdChainStatus.BREACH;
          monitoring.breach_count += 1;
          monitoring.last_breach_at = reading.timestamp;
          alerts.push({
            monitoringId: monitoring.id,
            temperature: reading.temperature,
            min: monitoring.min_temperature,
            max: monitoring.max_temperature,
            severity: 'critical',
          });
        } else if (Math.abs(reading.temperature - monitoring.max_temperature) < 1 ||
                   Math.abs(reading.temperature - monitoring.min_temperature) < 1) {
          if (monitoring.status !== ColdChainStatus.BREACH) {
            monitoring.status = ColdChainStatus.WARNING;
          }
          alerts.push({
            monitoringId: monitoring.id,
            temperature: reading.temperature,
            severity: 'warning',
          });
        } else {
          if (monitoring.status === ColdChainStatus.WARNING) {
            monitoring.status = ColdChainStatus.NORMAL;
          }
        }

        await this.coldChainRepository.save(monitoring);
      }

      return { success: true, alerts, errors: [] };
    } catch (error) {
      errors.push(`Recording error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, alerts, errors };
    }
  }

  async startMonitoring(params: {
    deliveryId: string;
    productId: string;
    sensorId: string;
    minTemperature: number;
    maxTemperature: number;
  }): Promise<{ success: boolean; monitoring?: ColdChainMonitoring; errors: string[] }> {
    const errors: string[] = [];
    try {
      const sensor = await this.sensorRepository.findOne({ where: { id: params.sensorId } } as any);
      if (!sensor) {
        errors.push(`Sensor ${params.sensorId} not found`);
        return { success: false, errors };
      }

      if (!sensor.isOperational()) {
        errors.push(`Sensor ${params.sensorId} is not operational`);
        return { success: false, errors };
      }

      if (!sensor.isCalibrationCurrent()) {
        errors.push(`Sensor ${params.sensorId} calibration is not current`);
        return { success: false, errors };
      }

      const monitoring = ColdChainMonitoring.create({
        deliveryId: params.deliveryId,
        productId: params.productId,
        sensorId: params.sensorId,
        minTemperature: params.minTemperature,
        maxTemperature: params.maxTemperature,
      });

      const savedMonitoring = await this.coldChainRepository.save(monitoring);
      return { success: true, monitoring: savedMonitoring, errors: [] };
    } catch (error) {
      errors.push(`Monitoring start error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  async completeMonitoring(monitoringId: string): Promise<{
    success: boolean;
    monitoring?: ColdChainMonitoring;
    errors: string[];
  }> {
    const errors: string[] = [];
    try {
      const monitoring = await this.coldChainRepository.findOne({ where: { id: monitoringId } } as any);
      if (!monitoring) {
        errors.push(`Monitoring record ${monitoringId} not found`);
        return { success: false, errors };
      }

      monitoring.completed_at = new Date();

      if (monitoring.breach_count > 0) {
        monitoring.integrity_compromised = true;
        monitoring.integrity_check_at = new Date();
        monitoring.compliance_notes = `Delivery had ${monitoring.breach_count} temperature breach(es).`;
      }

      const savedMonitoring = await this.coldChainRepository.save(monitoring);
      return { success: true, monitoring: savedMonitoring, errors: [] };
    } catch (error) {
      errors.push(`Completion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  async getMonitoringHistory(deliveryId: string): Promise<{
    success: boolean;
    monitorings: ColdChainMonitoring[];
    errors: string[];
  }> {
    const errors: string[] = [];
    try {
      const monitorings = await this.coldChainRepository.find({
        where: { delivery_id: deliveryId },
        order: { created_at: 'DESC' },
      });
      return { success: true, monitorings, errors: [] };
    } catch (error) {
      errors.push(`History retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, monitorings: [], errors };
    }
  }

  async getSensorsRequiringAttention(): Promise<{
    success: boolean;
    sensors: TemperatureSensor[];
    errors: string[];
  }> {
    const errors: string[] = [];
    try {
      const sensors = await this.sensorRepository.find();
      const needAttention = sensors.filter(s => s.needsAttention());
      return { success: true, sensors: needAttention, errors: [] };
    } catch (error) {
      errors.push(`Query error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, sensors: [], errors };
    }
  }
}
