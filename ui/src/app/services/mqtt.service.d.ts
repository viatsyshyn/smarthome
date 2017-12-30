import {Observable} from 'rxjs/Observable';

export interface IMqttService {
  connect(): Promise<void>;

  pub(topic: string, message: any): void;

  on<T = any>(topic: string): Observable<[string, T]>;
}
