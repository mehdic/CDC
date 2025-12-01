/**
 * Template Service
 * Manage email/SMS templates and variable substitution
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CampaignTemplate, TemplateChannel } from '../entities/CampaignTemplate';

export interface CreateTemplateDTO {
  pharmacyId: string;
  name: string;
  description?: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  htmlContent?: string;
  variables: string[];
  metadata?: any;
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  htmlContent?: string;
  variables?: string[];
  isActive?: boolean;
  metadata?: any;
}

export class TemplateService {
  private templateRepository: Repository<CampaignTemplate>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(CampaignTemplate);
  }

  async createTemplate(dto: CreateTemplateDTO): Promise<CampaignTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      isActive: true,
      usageCount: 0,
    });

    return await this.templateRepository.save(template);
  }

  async getTemplateById(id: string): Promise<CampaignTemplate | null> {
    return await this.templateRepository.findOne({ where: { id } });
  }

  async getTemplatesByPharmacy(pharmacyId: string): Promise<CampaignTemplate[]> {
    return await this.templateRepository.find({
      where: { pharmacyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplatesByChannel(pharmacyId: string, channel: TemplateChannel): Promise<CampaignTemplate[]> {
    return await this.templateRepository.find({
      where: { pharmacyId, channel, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDTO): Promise<CampaignTemplate> {
    await this.templateRepository.update(id, dto);

    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await this.templateRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async renderTemplate(
    template: CampaignTemplate,
    variables: Record<string, any>,
  ): Promise<{ subject?: string; body: string }> {
    let subject = template.subject || '';
    let body = template.body;

    // Replace all variables with provided values
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacementValue = value !== null && value !== undefined ? String(value) : '';

      subject = subject.replace(new RegExp(placeholder, 'g'), replacementValue);
      body = body.replace(new RegExp(placeholder, 'g'), replacementValue);
    }

    // Check for unsubstituted variables and log warning
    const unsubstitutedVars = body.match(/{{[^}]+}}/g);
    if (unsubstitutedVars) {
      console.warn('Unsubstituted variables in template:', unsubstitutedVars);
    }

    return { subject: subject || undefined, body };
  }

  async renderHtmlTemplate(
    template: CampaignTemplate,
    variables: Record<string, any>,
  ): Promise<string> {
    if (!template.htmlContent) {
      throw new Error('HTML content not available for this template');
    }

    let html = template.htmlContent;

    // Replace all variables with provided values
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacementValue = value !== null && value !== undefined ? String(value) : '';

      html = html.replace(new RegExp(placeholder, 'g'), replacementValue);
    }

    return html;
  }

  async incrementUsageCount(templateId: string): Promise<CampaignTemplate> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.usageCount += 1;

    return await this.templateRepository.save(template);
  }

  async validateTemplate(template: CampaignTemplate): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.body || template.body.trim().length === 0) {
      errors.push('Template body is required');
    }

    if (
      template.channel === TemplateChannel.EMAIL ||
      template.channel === TemplateChannel.PUSH
    ) {
      if (!template.subject || template.subject.trim().length === 0) {
        errors.push('Subject is required for email and push templates');
      }
    }

    if (template.variables && template.variables.length > 0) {
      const bodyVars = template.body.match(/{{[^}]+}}/g) || [];
      const htmlVars = template.htmlContent ? template.htmlContent.match(/{{[^}]+}}/g) || [] : [];
      const allVars = [...new Set([...bodyVars, ...htmlVars])].map((v) =>
        v.replace(/{{|}}/g, ''),
      );

      const declaredVars = new Set(template.variables);
      for (const variable of allVars) {
        if (!declaredVars.has(variable)) {
          errors.push(`Variable {{${variable}}} is used but not declared`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async searchTemplates(pharmacyId: string, searchTerm: string): Promise<CampaignTemplate[]> {
    return await this.templateRepository
      .createQueryBuilder('template')
      .where('template.pharmacyId = :pharmacyId', { pharmacyId })
      .andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .orderBy('template.createdAt', 'DESC')
      .getMany();
  }

  async cloneTemplate(templateId: string, newName: string): Promise<CampaignTemplate> {
    const original = await this.getTemplateById(templateId);
    if (!original) {
      throw new Error('Template not found');
    }

    const clone = this.templateRepository.create({
      ...original,
      id: undefined,
      name: newName,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.templateRepository.save(clone);
  }
}
