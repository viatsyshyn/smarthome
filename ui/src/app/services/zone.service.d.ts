export interface IZoneService {
  list(): Promise<string[]>;
  add(zone: string): Promise<string[]>;
  remove(zone: string): Promise<string[]>;
}
