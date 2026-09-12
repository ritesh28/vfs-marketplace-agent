/** Browser events shared across chat / DB / provider controls. */

export const PROVIDER_SETTINGS_CHANGED_EVENT = "vfs-provider-settings-changed";
export const DB_REFRESH_EVENT = "vfs-db-refresh";

export function notifyProviderSettingsChanged(): void {
	if (typeof window === "undefined") {
		return;
	}
	window.dispatchEvent(new Event(PROVIDER_SETTINGS_CHANGED_EVENT));
}

export function requestDbRefresh(): void {
	if (typeof window === "undefined") {
		return;
	}
	window.dispatchEvent(new Event(DB_REFRESH_EVENT));
}
