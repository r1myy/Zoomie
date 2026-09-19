// Périphériques audio/vidéo par défaut (section 4.6 du cahier des charges),
// sauvegardés côté client — un choix de micro/caméra est propre à
// l'appareil utilisé, pas au compte.

const AUDIO_KEY = "zoomie:preferred-audio-device";
const VIDEO_KEY = "zoomie:preferred-video-device";

export function getPreferredAudioDevice(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUDIO_KEY);
}

export function getPreferredVideoDevice(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(VIDEO_KEY);
}

export function setPreferredAudioDevice(deviceId: string) {
  window.localStorage.setItem(AUDIO_KEY, deviceId);
}

export function setPreferredVideoDevice(deviceId: string) {
  window.localStorage.setItem(VIDEO_KEY, deviceId);
}
