// Device compass heading capture.
// Live observations are tagged with the heading the console was pointing at the
// moment of sighting — the bearing's "source" is the operator's own fused compass
// (magnetometer + gyro), NOT AoA angle-of-arrival (which ordinary BLE cannot do).

let heading: number | null = null;
let accuracy: string | null = null;
let started = false;

function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function startHeadingWatch(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  const onAbs = (e: Event) => {
    const ev = e as DeviceOrientationEvent;
    if (typeof ev.alpha === 'number' && !isNaN(ev.alpha)) {
      heading = norm(360 - ev.alpha);
      accuracy = 'absolute';
    }
  };

  const onRel = (e: Event) => {
    const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
    if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
      heading = norm(ev.webkitCompassHeading); // iOS: already true-north referenced
      accuracy = 'webkit';
      return;
    }
    if (accuracy === null && ev.absolute && typeof ev.alpha === 'number' && !isNaN(ev.alpha)) {
      heading = norm(360 - ev.alpha);
      accuracy = 'absolute';
    }
  };

  window.addEventListener('deviceorientationabsolute', onAbs, true);
  window.addEventListener('deviceorientation', onRel, true);
}

export function getHeading(): number | null {
  return heading;
}

export function getHeadingAccuracy(): string | null {
  return accuracy;
}
