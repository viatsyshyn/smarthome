import {Observable} from 'rxjs/Observable';

export interface IDevice {
  title: string;
  device: string;
  zone: string;
  manifest: IManifest;
  settings?: any;
}

export type Scale = 'bit' | 'RYG' | 'timestamp' | string;

interface IDevicePropertyBase {
  name: string;
  scale: Scale | null;
  title: string;
}

export interface IDevicePropertyOut extends IDevicePropertyBase {
  expectedMin?: number;
  expectedMax?: number;
  precision?: 0 | 1 | 2 | 3 | 4 | 5;
  sign?: boolean;
  monotone?: boolean;
}

export interface IDevicePropertyIn extends IDevicePropertyBase {
  min?: number;
  max?: number;
  passive?: boolean;
}

export interface IDeviceRuntime {
  getProp<T = any>(key: string): Promise<T>;
  getAllSettings<T = any>(): Promise<T>;
  getSetting<T = any>(key: string): Promise<T>;
  setSetting<T = any>(key: string, value: T): Promise<T>;
  onDeviceState<T = any>(): Observable<T>;
  sendState<T>(state: T): void;
}

interface IDevicePropertyLambda extends IDevicePropertyOut {
  lambda?: string
}

export interface IDeviceWidget {
  prime: string | IDevicePropertyOut | IDevicePropertyLambda,
  secondary?: string | IDevicePropertyOut | IDevicePropertyLambda,
  state?: string | IDevicePropertyOut | IDevicePropertyLambda
}

export interface IManifestv1 {
  version: 1 | '1' | '1.0';
  device: string;
  description: string;
  icons: {
    16: string;
    32: string;
    48: string;
    64: string;
    128: string;
  },
  mqtt: {
    idlePeriodSec: number,
    out: IDevicePropertyOut[],
    in: IDevicePropertyIn[]
  },
  ui: {
    icon: IDeviceWidget[],
    devices: IDeviceWidget[]
  }
}

export type IManifest = IManifestv1;

export interface IDeviceService {
  list(): Promise<IDevice[]>;
  forget(device: string): Promise<void>;
}
