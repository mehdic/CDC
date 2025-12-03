/**
 * Vaccination Controller
 * API route handlers for vaccination service endpoints
 */

import { Request, Response } from 'express';
import { VaccinationService } from '../services/vaccination.service';
import { AvailabilityService } from '../services/availability.service';

export class VaccinationController {
  constructor(
    private vaccinationService: VaccinationService,
    private availabilityService: AvailabilityService
  ) {}

  /**
   * POST /api/v1/pharmacies/:id/vaccination-slots/templates
   */
  async createSlotTemplate(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.params.id;
      const data = { ...req.body, pharmacy_id: pharmacyId };

      const template = await this.vaccinationService.createSlotTemplate(data);

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/pharmacies/:id/vaccination-slots/templates
   */
  async getPharmacyTemplates(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.params.id;
      const includeInactive = req.query.include_inactive === 'true';

      const templates = await this.vaccinationService.getPharmacySlotTemplates(
        pharmacyId,
        includeInactive
      );

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/v1/vaccination-slots/templates/:id
   */
  async updateSlotTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;

      const template = await this.vaccinationService.updateSlotTemplate(
        templateId,
        req.body
      );

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/v1/vaccination-slots/templates/:id
   */
  async deleteSlotTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;

      await this.vaccinationService.deleteSlotTemplate(templateId);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/vaccination-slots/templates/:id/generate
   */
  async generateSlots(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      const { start_date, end_date } = req.body;

      const slots = await this.vaccinationService.generateSlotsFromTemplate(
        templateId,
        new Date(start_date),
        new Date(end_date)
      );

      res.status(201).json({
        success: true,
        data: slots,
        count: slots.length,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/pharmacies/:id/vaccination-slots/availability
   */
  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.params.id;
      const { vaccine_type, start_date, end_date, only_available } = req.query;

      const filters = {
        pharmacy_id: pharmacyId,
        vaccine_type: vaccine_type as any,
        start_date: new Date(start_date as string),
        end_date: new Date(end_date as string),
        only_available: only_available === 'true',
      };

      const slots = await this.availabilityService.getAvailableSlots(filters);

      res.status(200).json({
        success: true,
        data: slots,
        count: slots.length,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/pharmacies/:id/vaccination-slots/calendar
   */
  async getCalendar(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.params.id;
      const { start_date, end_date } = req.query;

      const calendar = await this.availabilityService.getPharmacyCalendar(
        pharmacyId,
        new Date(start_date as string),
        new Date(end_date as string)
      );

      res.status(200).json({
        success: true,
        data: calendar,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/vaccination-slots/:id/book
   */
  async bookSlot(req: Request, res: Response): Promise<void> {
    try {
      const slotId = req.params.id;
      const data = { ...req.body, slot_id: slotId };

      const booking = await this.vaccinationService.createBooking(data);

      res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/vaccination-bookings
   */
  async listBookings(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        pharmacy_id: req.query.pharmacy_id as string,
        patient_id: req.query.patient_id as string,
        status: req.query.status as any,
        start_date: req.query.start_date
          ? new Date(req.query.start_date as string)
          : undefined,
        end_date: req.query.end_date
          ? new Date(req.query.end_date as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await this.vaccinationService.listBookings(filters);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/v1/vaccination-bookings/:id
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      const booking = await this.vaccinationService.cancelBooking(
        bookingId,
        req.body
      );

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/v1/vaccination-bookings/:id/reschedule
   */
  async rescheduleBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      const booking = await this.vaccinationService.rescheduleBooking(
        bookingId,
        req.body
      );

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/vaccination-bookings/:id/check-in
   */
  async checkInBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      const booking = await this.vaccinationService.checkInBooking(bookingId);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/pharmacies/:id/vaccination-stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.params.id;
      const month = req.query.month ? new Date(req.query.month as string) : undefined;

      const stats = await this.availabilityService.getPharmacyStats(
        pharmacyId,
        month
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}
