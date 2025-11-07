"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typeorm_1 = require("typeorm");
const AuditTrailEntry_1 = require("../../../shared/models/AuditTrailEntry");
const router = (0, express_1.Router)();
router.get('/audit/entries', async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required to access audit entries',
            });
        }
        const allowedRoles = ['pharmacist', 'admin'];
        if (!allowedRoles.includes(currentUser.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only pharmacists and admins can access audit entries',
            });
        }
        const dataSource = req.dataSource || req.app.dataSource;
        if (!dataSource) {
            throw new Error('Database connection not available');
        }
        const { pharmacy_id, user_id, resource_type, resource_id, event_type, action, start_date, end_date, page = '1', limit = '50', sort = 'desc', } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (currentUser.role === 'pharmacist') {
            where.pharmacy_id = currentUser.primary_pharmacy_id;
        }
        else if (pharmacy_id) {
            where.pharmacy_id = pharmacy_id;
        }
        if (user_id) {
            where.user_id = user_id;
        }
        if (resource_type) {
            where.resource_type = resource_type;
        }
        if (resource_id) {
            where.resource_id = resource_id;
        }
        if (event_type) {
            where.event_type = event_type;
        }
        if (action && Object.values(AuditTrailEntry_1.AuditAction).includes(action)) {
            where.action = action;
        }
        if (start_date || end_date) {
            const startDateTime = start_date ? new Date(start_date) : new Date('1970-01-01');
            const endDateTime = end_date ? new Date(end_date) : new Date();
            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                return res.status(400).json({
                    error: 'Invalid date format',
                    message: 'start_date and end_date must be valid ISO 8601 dates',
                });
            }
            where.created_at = (0, typeorm_1.Between)(startDateTime, endDateTime);
        }
        const auditRepository = dataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const total = await auditRepository.count({ where });
        const entries = await auditRepository.find({
            where,
            order: {
                created_at: sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
            },
            skip,
            take: limitNum,
            relations: ['user', 'pharmacy'],
        });
        const totalPages = Math.ceil(total / limitNum);
        return res.status(200).json({
            data: entries,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                total_pages: totalPages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching audit entries:', error);
        if (error instanceof Error && error.message.includes('Database connection')) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Database connection not available',
            });
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve audit entries',
        });
    }
});
router.get('/audit/entries/:id', async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const allowedRoles = ['pharmacist', 'admin'];
        if (!allowedRoles.includes(currentUser.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only pharmacists and admins can access audit entries',
            });
        }
        const dataSource = req.dataSource || req.app.dataSource;
        if (!dataSource) {
            throw new Error('Database connection not available');
        }
        const { id } = req.params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                error: 'Invalid ID',
                message: 'Audit entry ID must be a valid UUID',
            });
        }
        const auditRepository = dataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const where = { id };
        if (currentUser.role === 'pharmacist') {
            where.pharmacy_id = currentUser.primary_pharmacy_id;
        }
        const entry = await auditRepository.findOne({
            where,
            relations: ['user', 'pharmacy'],
        });
        if (!entry) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Audit entry not found or access denied',
            });
        }
        return res.status(200).json(entry);
    }
    catch (error) {
        console.error('Error fetching audit entry:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve audit entry',
        });
    }
});
router.get('/audit/stats', async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const allowedRoles = ['pharmacist', 'admin'];
        if (!allowedRoles.includes(currentUser.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only pharmacists and admins can access audit statistics',
            });
        }
        const dataSource = req.dataSource || req.app.dataSource;
        if (!dataSource) {
            throw new Error('Database connection not available');
        }
        const { pharmacy_id, start_date, end_date } = req.query;
        let pharmacyId;
        if (currentUser.role === 'pharmacist') {
            pharmacyId = currentUser.primary_pharmacy_id;
        }
        else if (pharmacy_id) {
            pharmacyId = pharmacy_id;
        }
        else {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'pharmacy_id is required for admins',
            });
        }
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date
            ? new Date(start_date)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const auditRepository = dataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const total_events = await auditRepository.count({
            where: {
                pharmacy_id: pharmacyId,
                created_at: (0, typeorm_1.Between)(startDate, endDate),
            },
        });
        const eventsByType = await auditRepository
            .createQueryBuilder('audit')
            .select('audit.event_type', 'event_type')
            .addSelect('COUNT(*)', 'count')
            .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
            .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('audit.event_type')
            .orderBy('count', 'DESC')
            .getRawMany();
        const events_by_type = eventsByType.reduce((acc, row) => {
            acc[row.event_type] = parseInt(row.count, 10);
            return acc;
        }, {});
        const eventsByAction = await auditRepository
            .createQueryBuilder('audit')
            .select('audit.action', 'action')
            .addSelect('COUNT(*)', 'count')
            .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
            .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('audit.action')
            .getRawMany();
        const events_by_action = eventsByAction.reduce((acc, row) => {
            acc[row.action] = parseInt(row.count, 10);
            return acc;
        }, {});
        const eventsByUser = await auditRepository
            .createQueryBuilder('audit')
            .select('audit.user_id', 'user_id')
            .addSelect('COUNT(*)', 'count')
            .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
            .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('audit.user_id')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();
        const events_by_user = eventsByUser.map((row) => ({
            user_id: row.user_id,
            count: parseInt(row.count, 10),
        }));
        const eventsByResourceType = await auditRepository
            .createQueryBuilder('audit')
            .select('audit.resource_type', 'resource_type')
            .addSelect('COUNT(*)', 'count')
            .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
            .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('audit.resource_type')
            .getRawMany();
        const events_by_resource_type = eventsByResourceType.reduce((acc, row) => {
            acc[row.resource_type] = parseInt(row.count, 10);
            return acc;
        }, {});
        return res.status(200).json({
            total_events,
            events_by_type,
            events_by_action,
            events_by_user,
            events_by_resource_type,
            date_range: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Error fetching audit stats:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve audit statistics',
        });
    }
});
exports.default = router;
//# sourceMappingURL=audit.js.map