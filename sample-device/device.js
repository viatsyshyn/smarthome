let logger = console;
let mqtt = require('mqtt');

async function main() {
  let device_id = process.argv[2] || 'sample-device';
  let mqtt_host = process.argv[3] || 'mqtt://127.0.0.1:1883';
  let manifest = require('./data/manifest.json');

  logger.log(`Initialize ${device_id} @ ${mqtt_host}`);

  let client = mqtt.connect(mqtt_host)
    .on('connect', () => {
      client.subscribe(`${device_id}/desired/+`);

      logger.log('Initialized');

      // should publish manifest on first connect
      let manifest_content = JSON.stringify(manifest, null, 2);
      let lambdas = require('./lambdas');
      Object.keys(lambdas).forEach(name => {
        manifest_content = manifest_content.replace(`{{${name}}}`, lambdas[name].toString().replace(/\n/g, ''))
      });

      //console.log('MANIFEST:', manifest_content);

      client.publish(`${device_id}/manifest`, manifest_content);

      sendValues();
    })
    .on('message', (topic, message) => {
      logger.info('IN: ', topic, message.toString());

      manifest.mqtt.in.forEach(({name: p}) => {
        if (topic === `${device_id}/desired/${p}` && manifest.mqtt.out.some(x => x.name === p)) {
          client.publish(`${device_id}/reported/${p}`, message);
        }
      });
    });

  function sendValues() {
    manifest.mqtt.out.forEach((prop) => {
      if (!prop.monotone && Math.random() > .1) {
        return;
      }

      let value = Math.random() * (prop.expectedMax - prop.expectedMin) + prop.expectedMin;
      if (prop.scale === 'bit') {
        value = Math.round(value);
      }
      console.log('OUT: ', `${device_id}/reported/${prop.name}`, JSON.stringify(value));
      client.publish(`${device_id}/reported/${prop.name}`, JSON.stringify(value));
    });

    setTimeout(sendValues, Math.random() * 1000 * 60 * 1 + 60000);
  }
}

main()
  .catch(e => console.error(e));
