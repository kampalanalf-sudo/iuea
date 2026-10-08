// BLE scan engine.
// APK (Capacitor) shell: @capacitor-community/bluetooth-le — unfiltered scan, every
// packet, real MAC addresses, complete AD structures.
// Web shell: navigator.bluetooth.requestLEScan (Chrome/Edge, HTTPS or localhost,
// experimental flag may be required). No simulated devices — errors are shown, never faked.

import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import type { Observation } from './types';
import { hashStr, rssiToDistance, toHex } from './util';

export type AdvHandler = (partial: Omit<Observation, 'id' | 'ts' | 'source'>) => void;

interface AdvInput {
  deviceId?: string;
  address?: string;
  name?: string;
  rssi: number;
  txPower?: number;
  manufacturerData?: unknown;
  serviceData?: unknown;
}

/** Normalise manufacturer/service data shapes (Map, object-of-DataView, bare DataView). */
function dataViewEntries(v: unknown): Array<[number | string, DataView]> {
  if (!v) return [];
  try {
    if (v instanceof Map) {
      return Array.from(v.entries()).filter(([, dv]) => dv instanceof DataView);
    }
    if (v instanceof DataView) return [[0, v]];
    if (typeof v === 'object') {
      return Object.entries(v as Record<string, DataView>).filter(([, dv]) => dv instanceof DataView);
    }
  } catch {
    /* fall through */
  }
  return [];
}

function numKey(k: number | string): number {
  if (typeof k === 'number') return k;
  return parseInt(String(k).replace(/^0x/i, ''), 16) || 0;
}

/** Parse one advertisement into observation fields (iBeacon / Eddystone aware). */
export function parseAdvertisement(a: AdvInput, pathLossN = 2, measuredPower = -59): Omit<Observation, 'id' | 'ts' | 'source'> {
  const o: Omit<Observation, 'id' | 'ts' | 'source'> = { rssi: a.rssi };
  if (a.name) o.name = a.name;
  if (a.deviceId) o.deviceId = a.deviceId;
  if (a.address) o.address = a.address;
  if (typeof a.txPower === 'number' && isFinite(a.txPower)) o.txPower = a.txPower;

  const payloadParts: string[] = [];

  for (const [cid, dv] of dataViewEntries(a.manufacturerData)) {
    const id = numKey(cid);
    payloadParts.push(`m${id.toString(16)}:${toHex(dv, 0, Math.min(dv.byteLength, 31))}`);
    // iBeacon: Apple 0x004C, type 0x02, len 0x19, uuid(16) major(2) minor(2) txPower(1)
    if (id === 0x004c && dv.byteLength >= 23 && dv.getUint8(0) === 0x02 && dv.getUint8(1) === 0x19) {
      o.ibeacon = {
        uuid: toHex(dv, 2, 16),
        major: dv.getUint16(18, false),
        minor: dv.getUint16(20, false),
      };
      o.txPower = dv.getInt8(22);
    }
  }

  for (const [sid, dv] of dataViewEntries(a.serviceData)) {
    const id = numKey(sid);
    payloadParts.push(`s${id.toString(16)}:${toHex(dv, 0, Math.min(dv.byteLength, 31))}`);
    // Eddystone UID frame (0x00) on service 0xFEAA: txPower(1) namespace(10) instance(6)
    if (id === 0xfeaa && dv.byteLength >= 17 && dv.getUint8(0) === 0x00) {
      o.txPower = dv.getInt8(1);
      o.eddystone = { namespace: toHex(dv, 2, 10), instance: toHex(dv, 12, 6) };
    }
  }

  if (payloadParts.length > 0) {
    const payload = payloadParts.join('|');
    o.manufacturer = payload.length > 200 ? payload.slice(0, 200) + '…' : payload;
    o.payloadHash = hashStr(payload);
  }

  o.dist = rssiToDistance(a.rssi, o.txPower, pathLossN || 2) || rssiToDistance(a.rssi, measuredPower, pathLossN || 2);
  return o;
}

export class BleScanner {
  private running = false;
  private webScan: { stop: () => Promise<void> } | null = null;
  private webListener: ((ev: Event) => void) | null = null;
  private webBt: EventTarget | null = null;
  private handler: AdvHandler = () => undefined;

  get isRunning(): boolean {
    return this.running;
  }

  private isAndroid(): boolean {
    try {
      return Capacitor.getPlatform() === 'android';
    } catch {
      return false;
    }
  }

  async start(handler: AdvHandler): Promise<void> {
    if (this.running) return;
    this.handler = handler;
    if (this.isAndroid()) {
      await this.startNative();
    } else {
      await this.startWeb();
    }
    this.running = true;
  }

  private async startNative(): Promise<void> {
    try {
      await BleClient.initialize();
    } catch (e) {
      throw new Error(`BLE initialisation failed (${(e as Error).message}). Enable Bluetooth and grant nearby-device permission.`);
    }
    try {
      await BleClient.requestLEScan({}, (result) => {
        // Plugin shape: rssi/txPower are TOP-LEVEL on the scan result on Android;
        // parsed AD structures live under result.advertisement. Read both defensively.
        const r = result as unknown as {
          device?: { deviceId?: string; name?: string };
          localName?: string;
          rssi?: number;
          txPower?: number;
          manufacturerData?: unknown;
          serviceData?: unknown;
          advertisement?: {
            localName?: string;
            rssi?: number;
            txPower?: number;
            manufacturerData?: unknown;
            serviceData?: unknown;
          };
        };
        const a = r.advertisement ?? {};
        const rssi = typeof r.rssi === 'number' ? r.rssi : typeof a.rssi === 'number' ? a.rssi : NaN;
        if (!isFinite(rssi)) return; // never emit placeholder RSSI values
        this.handler(
          parseAdvertisement({
            deviceId: r.device?.deviceId,
            address: r.device?.deviceId,
            name: r.device?.name ?? a.localName ?? r.localName,
            rssi,
            txPower: typeof a.txPower === 'number' ? a.txPower : typeof r.txPower === 'number' ? r.txPower : undefined,
            manufacturerData: a.manufacturerData ?? r.manufacturerData,
            serviceData: a.serviceData ?? r.serviceData,
          }),
        );
      });
    } catch (e) {
      throw new Error(`Scan request rejected: ${(e as Error).message}`);
    }
  }

  private async startWeb(): Promise<void> {
    const bt = (navigator as unknown as { bluetooth?: { requestLEScan?: (o: object) => Promise<{ stop: () => Promise<void> }> } }).bluetooth;
    if (!bt) {
      throw new Error('Web Bluetooth is unavailable in this browser. Use Chrome/Edge over HTTPS (or the APK/EXE build).');
    }
    if (!bt.requestLEScan) {
      throw new Error('requestLEScan is missing. Enable chrome://flags → Experimental Web Platform features, or use the APK build for full scanning.');
    }
    try {
      this.webScan = await bt.requestLEScan({ acceptAllAdvertisements: true });
    } catch (e) {
      throw new Error(`LE scan denied: ${(e as Error).message}. Grant the Bluetooth permission prompt.`);
    }
    this.webBt = bt as unknown as EventTarget;
    this.webListener = (ev: Event) => {
      const e = ev as unknown as {
        device?: { id?: string; name?: string };
        name?: string;
        rssi?: number;
        txPower?: number;
        manufacturerData?: unknown;
        serviceData?: unknown;
      };
      if (typeof e.rssi !== 'number' || !isFinite(e.rssi)) return; // never emit placeholder RSSI
      this.handler(
        parseAdvertisement({
          deviceId: e.device?.id,
          name: e.device?.name ?? e.name,
          rssi: e.rssi,
          txPower: e.txPower,
          manufacturerData: e.manufacturerData,
          serviceData: e.serviceData,
        }),
      );
    };
    this.webBt.addEventListener('advertisementreceived', this.webListener);
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    try {
      if (this.webScan) await this.webScan.stop();
    } catch {
      /* ignore */
    }
    if (this.webListener) {
      try {
        this.webBt?.removeEventListener('advertisementreceived', this.webListener);
      } catch {
        /* ignore */
      }
      this.webListener = null;
      this.webBt = null;
    }
    if (this.isAndroid()) {
      try {
        await BleClient.stopLEScan();
      } catch {
        /* ignore */
      }
    }
  }
}

export const scanner = new BleScanner();
