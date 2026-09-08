/**
 * Lightweight, dictionary-based translation for the app shell and landing
 * page. This is NOT full app-wide localization — form validation messages,
 * most page body copy, and emails remain English-only. It covers navigation,
 * common actions, and headline copy, which is what a user actually sees
 * most of the time while using the app. Locale is a per-user preference
 * (UserPreference.locale), applied server-side — there's no per-URL
 * routing (no /fr/, /es/ paths).
 */
export type Locale = "EN" | "FR" | "ES";

export const LOCALE_LABELS: Record<Locale, string> = {
  EN: "English",
  FR: "Français",
  ES: "Español",
};

const dictionaries = {
  EN: {
    nav_dashboard: "Dashboard",
    nav_transactions: "Transactions",
    nav_budgets: "Budgets",
    nav_savings_goals: "Savings Goals",
    nav_reports: "Reports",
    nav_recurring: "Recurring",
    nav_categories: "Categories",
    nav_accounts: "Accounts",
    nav_investments: "Investments",
    nav_household: "Household",
    nav_tools: "Tools",
    nav_settings: "Settings",
    sign_out: "Sign out",
    action_add: "Add",
    action_edit: "Edit",
    action_delete: "Delete",
    action_save: "Save",
    action_cancel: "Cancel",
    dashboard_title: "Dashboard",
    dashboard_description: "Your financial overview",
  },
  FR: {
    nav_dashboard: "Tableau de bord",
    nav_transactions: "Transactions",
    nav_budgets: "Budgets",
    nav_savings_goals: "Objectifs d'épargne",
    nav_reports: "Rapports",
    nav_recurring: "Récurrent",
    nav_categories: "Catégories",
    nav_accounts: "Comptes",
    nav_investments: "Investissements",
    nav_household: "Foyer",
    nav_tools: "Outils",
    nav_settings: "Paramètres",
    sign_out: "Se déconnecter",
    action_add: "Ajouter",
    action_edit: "Modifier",
    action_delete: "Supprimer",
    action_save: "Enregistrer",
    action_cancel: "Annuler",
    dashboard_title: "Tableau de bord",
    dashboard_description: "Votre aperçu financier",
  },
  ES: {
    nav_dashboard: "Panel",
    nav_transactions: "Transacciones",
    nav_budgets: "Presupuestos",
    nav_savings_goals: "Metas de ahorro",
    nav_reports: "Informes",
    nav_recurring: "Recurrentes",
    nav_categories: "Categorías",
    nav_accounts: "Cuentas",
    nav_investments: "Inversiones",
    nav_household: "Hogar",
    nav_tools: "Herramientas",
    nav_settings: "Configuración",
    sign_out: "Cerrar sesión",
    action_add: "Añadir",
    action_edit: "Editar",
    action_delete: "Eliminar",
    action_save: "Guardar",
    action_cancel: "Cancelar",
    dashboard_title: "Panel",
    dashboard_description: "Tu resumen financiero",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type DictionaryKey = keyof (typeof dictionaries)["EN"];

export function t(locale: Locale, key: DictionaryKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries.EN[key];
}

export function translateNavItems(locale: Locale, items: { href: string; label: string; key: DictionaryKey }[]) {
  return items.map((item) => ({ href: item.href, label: t(locale, item.key) }));
}
