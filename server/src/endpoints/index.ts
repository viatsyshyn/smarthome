import {Container} from 'inversify';
import {DeviceEndpoints} from './devices';
import {Express} from 'express';
import {PersistenceEndpoints} from './persistence';
import {StatsEndpoints} from './stats';
import {ZonesEndpoints} from './zones';


export function register(kernel: Container, app: Express) {
  kernel.bind<DeviceEndpoints>(Symbol.for('devices')).to(DeviceEndpoints);
  kernel.get<DeviceEndpoints>(Symbol.for('devices')).register(app);

  kernel.bind<PersistenceEndpoints>(Symbol.for('persistance')).to(PersistenceEndpoints);
  kernel.get<PersistenceEndpoints>(Symbol.for('persistance')).register(app);

  kernel.bind<StatsEndpoints>(Symbol.for('stats')).to(StatsEndpoints);
  kernel.get<StatsEndpoints>(Symbol.for('stats')).register(app);

  kernel.bind<ZonesEndpoints>(Symbol.for('zones')).to(ZonesEndpoints);
  kernel.get<ZonesEndpoints>(Symbol.for('zones')).register(app);
}

export const APIs = [
  __dirname + '/devices.js',
  __dirname + '/zones.js',
  __dirname + '/persistence.js',
  __dirname + '/stats.js',
];
