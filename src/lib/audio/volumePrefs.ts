// Préférences de mixage sauvegardées côté client uniquement (section 4.3 :
// "stockée côté client"), indexées par nom affiché plutôt que par identité de
// session (celle-ci change à chaque connexion).

const STORAGE_KEY = "zoomie:volume-prefs";

interface StoredPrefs {
  [displayName: string]: { percent: number; muted: boolean };
}

function readAll(): StoredPrefs {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getStoredVolume(displayName: string) {
  const all = readAll();
  return all[baseName(displayName)] ?? { percent: 100, muted: false };
}

export function setStoredVolume(displayName: string, percent: number, muted: boolean) {
  const all = readAll();
  all[baseName(displayName)] = { percent, muted };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function baseName(displayName: string) {
  return displayName.split("#")[0];
}
