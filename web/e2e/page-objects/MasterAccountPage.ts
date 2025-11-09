import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Master Account Management Page Object
 *
 * Encapsulates interactions with master account management features.
 */
export class MasterAccountPage extends BasePage {
  readonly pageTitle: Locator;
  readonly addUserButton: Locator;
  readonly userList: Locator;
  readonly locationsTab: Locator;
  readonly settingsTab: Locator;
  readonly auditLogTab: Locator;
  readonly mfaSetupButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /compte principal|master account/i });
    this.addUserButton = page.getByRole('button', { name: /ajouter utilisateur|add user/i });
    this.userList = page.locator('[data-testid="user-list"]');
    this.locationsTab = page.getByRole('tab', { name: /emplacements|locations/i });
    this.settingsTab = page.getByRole('tab', { name: /paramètres|settings/i });
    this.auditLogTab = page.getByRole('tab', { name: /journal d'audit|audit log/i });
    this.mfaSetupButton = page.getByRole('button', { name: /configurer mfa|setup mfa/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/account/master');
    await this.expectPageLoaded();
  }

  async addSubPharmacist(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  }): Promise<void> {
    await this.addUserButton.click();

    await this.page.getByLabel(/email/i).fill(userData.email);
    await this.page.getByLabel(/prénom|first name/i).fill(userData.firstName);
    await this.page.getByLabel(/nom|last name/i).fill(userData.lastName);
    await this.page.getByLabel(/rôle|role/i).selectOption(userData.role);

    for (const permission of userData.permissions) {
      await this.page.locator(`[data-testid="permission-${permission}"]`).check();
    }

    await this.page.getByRole('button', { name: /créer|create/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async assignPermissions(userId: string, permissions: string[]): Promise<void> {
    await this.page.locator(`[data-testid="user-${userId}"]`).click();
    await this.page.getByRole('button', { name: /modifier permissions|edit permissions/i }).click();

    for (const permission of permissions) {
      await this.page.locator(`[data-testid="permission-${permission}"]`).check();
    }

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async viewPharmacyLocations(): Promise<void> {
    await this.locationsTab.click();
    await expect(this.page.locator('[data-testid="locations-list"]')).toBeVisible();
  }

  async setupMFA(): Promise<void> {
    await this.mfaSetupButton.click();
    await expect(this.page.locator('[data-testid="mfa-qr-code"]')).toBeVisible();
  }

  async viewAuditLog(): Promise<void> {
    await this.auditLogTab.click();
    await expect(this.page.locator('[data-testid="audit-log-table"]')).toBeVisible();
  }

  async updateAccountSettings(settings: { [key: string]: string }): Promise<void> {
    await this.settingsTab.click();

    for (const [key, value] of Object.entries(settings)) {
      await this.page.getByLabel(new RegExp(key, 'i')).fill(value);
    }

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.userList).toBeVisible();
  }

  async expectUserInList(userId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="user-${userId}"]`)).toBeVisible();
  }
}
