// Shell auto-detection: web browser, Android APK (Capacitor) or Windows EXE (Electron).
// The app picks the richest available BLE engine based on this.

import { Capacitor } from '@capacitor/core';
import type { Shell } from './types';

export function getShell(): Shell {
  if (typeof window !== 'undefined' && (window as unknown as { pointElectron?: unknown }).pointElectron) {
    return 'exe';
  }
  try {
    if (Capacitor.getPlatform() === 'android') return 'apk';
  } catch {
    /* not native */
  }
  return 'web';
}

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export const SHELL: Shell = getShell();

export const SHELL_LABEL: Record<Shell, string> = {
  web: 'Web (browser)',
  apk: 'Android APK (Capacitor)',
  exe: 'Windows EXE (Electron)',
};
