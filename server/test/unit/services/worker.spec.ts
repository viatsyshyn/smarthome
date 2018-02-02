import 'reflect-metadata';
import {describe, it, beforeEach} from 'mocha';
import {expect, use as chaiUse} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chaiUse(chaiAsPromised);

import {Worker} from '../../../src/services/worker';
import {ICache, ILogger, IPubSub, IStorage} from '../../../src/models';
import {IDeviceSetting, IEvent, ITimestamped} from "../../../src/models/storage";
import {TMessageHandler} from "../../../src/models/pubsub";
import {IEvaluator} from "../../../src/services/evalutor";

describe('unit/services/worker.tests', () => {
  let worker;

  function NullLoggerFactory(): ILogger {
    return {
      log: () => {},
      info: () => {},
      error: () => {}
    }
  }

  let storage: IDeviceSetting<any>[] = [];
  let log: IEvent[] = [];
  const storageStub = {
    set: <T = any>(device: string, key: string, value: T): Promise<void> => {
      const r = storage.filter(x => x.device === device && x.key === key);
      if (r.length) {
        r[0].data = value;
      } else {
        storage.push({device, key, data: value});
      }

      return Promise.resolve();
    },

    get: <T = any>(device: string, key: string, def?: T): Promise<T> => {
      return Promise.resolve((storage.filter(x => x.device === device && x.key === key)[0] || {data: def}).data);
    },

    querySync: (device: string | undefined, key: string | undefined) => storage.filter(x => (x.device === device || device === undefined) && (x.key === key || key === undefined)),

    query: <T = any>(device: string | undefined, key: string | undefined): Promise<IDeviceSetting<T>[]> => {
      return Promise.resolve(storageStub.querySync(device, key));
    },

    log: <T = any>(event: IEvent<T>): Promise<void> => {
      log.push(event);
      return Promise.resolve();
    },

    all: (device: string): Promise<object> => {
      this.query(device, undefined);
      return Promise.resolve({});
    },

    stats: <T extends ITimestamped>(device: string,
      property: string | undefined,
      since: Date,
      till: Date,
      interval: number,
      props: any[]): Promise<T[]> => {
      return Promise.resolve([]);
    },

    remove: (device: string): Promise<void> => {
      return Promise.resolve();
    }
  };

  let cache = {};
  const cacheStub: ICache = {
    get: <T = any>(key: string, def: T = null): Promise<T> => {
      return Promise.resolve(cache.hasOwnProperty(key) ? cache[key] : def);
    },
    set: <T = any>(key: string, value: T): Promise<T> => {
      cache[key] = value;
      return Promise.resolve(value);
    }
  };

  let subscriptions = [];
  let publications = [];
  const pubsubStub: IPubSub = {
    sub: <T = any>(topic: string, cb: TMessageHandler<T>): IPubSub => {
      subscriptions.push([topic, cb]);
      return this;
    },
    pub: <T = any>(topic: string, msg: T): IPubSub => {
      publications.push([topic, msg]);
      return this;
    }
  };

  let evaluations = [];
  const evaluatorStub: IEvaluator = {
    eval: <T>(device: string, lambda: string, value: any): Promise<T> => {
      evaluations.push([device, lambda, value]);
      return Promise.resolve();
    }
  };

  let testDeviceManifest: any;
  beforeEach(async (): Promise<void> => {
    storage = [];
    log = [];
    cache = {};
    subscriptions = [];
    publications = [];
    evaluations = [];

    storage.push({
      device: 'test-device',
      key: 'manifest',
      data: (testDeviceManifest = {
        version: 1,
        title: "test device",
        mqtt: {
          "out": [],
          "in": []
        },
        ui: {
          icon: [],
          devices: []
        }
      })
    });

    worker = new Worker(NullLoggerFactory, storageStub, cacheStub, pubsubStub, evaluatorStub);

    await worker.start();
  });

  it('subscribe to expected topics', () => {
    expect(subscriptions.length).to.be.equal(4);

    const subs = subscriptions.map(([topic]) => topic);
    expect(subs).to.include('+/manifest');
    expect(subs).to.include('+/reported/+');
    expect(subs).to.include('+/desired/+');
    expect(subs).to.include('+/updated/+');
  });

  it('register device and update last-updated ts', async (): Promise<void> => {
    let deviceSub = subscriptions.filter(([topic]) => topic === '+/manifest')[0];
    expect(deviceSub).to.be.not.undefined;

    let [, cb] = deviceSub;
    expect(cb).to.be.not.undefined;

    await cb({version: 1, title: 'test device'}, 'other-device/manifest');

    let props = storageStub.querySync('other-device', undefined);
    expect(props.length).to.be.equal(3);
    expect(new Date().getTime() - cache['other-device::last-updated']).below(1000);
  });

  it('log reported state', async(): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/reported/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    await cb(2, 'test-device/reported/test-prop');

    expect(log.length).eq(1);
    expect(log[0].device).eq('test-device');
    expect(log[0].property).eq('test-prop');
    expect(log[0].message).eq(2);
  });

  it('cache property state and update last-updated ts', async (): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/reported/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    await cb(2, 'test-device/reported/test-prop');

    const propValue = cache['test-device::test-prop'];
    expect(propValue).eq(2);

    const lastUpdated = cache['test-device::last-updated'];
    expect(lastUpdated).not.undefined;
    expect(new Date().getTime() - lastUpdated).below(1000);
  });

  it('republish to zone', async (): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/reported/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    storage.push({
      device: 'test-device',
      key: 'zone',
      data: 'test-zone'
    }, {
      device: 'test-device',
      key: 'republish',
      data: {
        "test-prop": "repub-prop"
      }
    });

    await cb(2, 'test-device/reported/test-prop');

    const pub = publications.filter(([topic]) => topic === 'test-zone/updated/repub-prop')[0];
    expect(pub).not.undefined;

    const [, msg] = pub;
    expect(msg).eq(2);
  });

  it('execute property lambda', async (): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/reported/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    testDeviceManifest.mqtt.out.push({
      name: 'test-prop',
      lambda: 'test-lambda'
    });

    await cb(2, 'test-device/reported/test-prop');

    expect(evaluations.length).eq(1);

    const [device, lambda, msg] = evaluations[0];
    expect(msg).eq(2);
    expect(lambda).eq('test-lambda');
    expect(device).eq('test-device');
  });

  it('log desired state', async (): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/desired/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    await cb(2, 'test-device/desired/test-prop');

    expect(log.length).eq(1);
    expect(log[0].device).eq('test-device');
    expect(log[0].property).eq('test-prop');
    expect(log[0].message).eq(2);
  });

  it('report state for virtual props', async (): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/desired/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    testDeviceManifest.mqtt.in.push({
      name: 'test-prop',
      virtual: true
    });

    await cb(2, 'test-device/desired/test-prop');

    const pub = publications.filter(([topic]) => topic === 'test-device/reported/test-prop')[0];
    expect(pub).not.undefined;

    const [, msg] = pub;
    expect(msg).eq(2);
  });

  it('desire state for zone listen', async (): Promise<void> => {
    let reportedSub = subscriptions.filter(([topic]) => topic === '+/updated/+')[0];
    expect(reportedSub).not.undefined;

    let [, cb] = reportedSub;
    expect(cb).not.undefined;

    storage.push({
      device: '*',
      key: 'zones',
      data: ['test-zone']
    }, {
      device: 'test-device',
      key: 'zone',
      data: 'test-zone'
    }, {
      device: 'test-device',
      key: 'listen',
      data: {
        "test-prop": "repub-prop"
      }
    });

    await cb(2, 'test-zone/updated/repub-prop');

    const pub = publications.filter(([topic]) => topic === 'test-device/desired/test-prop')[0];
    expect(pub).not.undefined;

    const [, msg] = pub;
    expect(msg).eq(2);
  });
});
