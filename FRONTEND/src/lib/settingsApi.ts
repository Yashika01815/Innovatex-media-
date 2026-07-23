import { apiClient } from '@/lib/apiClient';

/**
 * SOURCE: src/modules/settings/settings.service.js
 * GET /api/settings returns all 10 tabs in one call; this only types the
 * slice AI Qualification needs. The Settings page itself (when migrated)
 * will get its own fuller type covering all 10 tabs.
 */
interface SettingsBundle {
  qualification: {
    questions: string[];
  };
}

export const settingsApi = {
  /**
   * getQualificationQuestions -- real, tenant-configurable discovery
   * questions (Settings > Qualification Questions tab). Falls back
   * server-side to DEFAULT_QUALIFICATION_QUESTIONS if the tenant hasn't
   * customized them yet -- never hardcoded on the frontend.
   */
  getQualificationQuestions: () =>
    apiClient.get<SettingsBundle>('/settings').then((r) => r.qualification.questions),
};