import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.proxicore.point',
  appName: 'ProxiCore POINT',
  webDir: 'dist',
  backgroundColor: '#0b1219',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    Geolocation: {
      // Android 12+ permission rationale shown by the OS prompt
      androidForegroundService: {
        notificationTitle: 'POINT live scan',
        notificationText: 'Recording BLE advertisements + GPS',
      },
    },
  },
};

export default config;
