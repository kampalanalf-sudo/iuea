// Live GPS fix for the scanning console (fused on Android via the Geolocation plugin).

import { Geolocation } from '@capacitor/geolocation';
import { isNative } from './shell';

export interface GeoFix {
  lat: number;
  lon: number;
  accuracy: number;
  ts: number;
}

let latest: GeoFix | null = null;
let watchId: string | number | null = null;

export function getFix(): GeoFix | null {
  return latest;
}

export async function startGeoWatch(): Promise<void> {
  if (watchId !== null) return;
  const onPos = (lat: number, lon: number, accuracy: number) => {
    latest = { lat, lon, accuracy, ts: Date.now() };
  };
  try {
    if (isNative()) {
      watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos) => {
        if (pos) onPos(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      });
      return;
    }
  } catch {
    /* fall back to browser API */
  }
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => onPos(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 3000 },
    );
  }
}

export function stopGeoWatch(): void {
  if (watchId === null) return;
  try {
    if (typeof watchId === 'string') {
      Geolocation.clearWatch({ id: watchId }).catch(() => undefined);
    } else {
      navigator.geolocation.clearWatch(watchId);
    }
  } catch {
    /* ignore */
  }
  watchId = null;
}
