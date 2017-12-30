import { enableProdMode, isDevMode } from '@angular/core';

if (window.location.hostname !== 'localhost') {
  enableProdMode();
}
if (isDevMode()) {
  console.log('%cWARNING! DEV MODE', 'color: red; font-size: 64px;');
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

window.addEventListener('WebComponentsReady', event => {
  window.removeEventListener('WebComponentsReady', null);
  console.log('WebComponentsReady');
  const options = { providers: [] };
  platformBrowserDynamic().bootstrapModule(AppModule, options);
});
