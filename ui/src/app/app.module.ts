import {NgModule} from '@angular/core';

import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ChartsModule} from 'ng2-charts';
import {MaterialModule} from './lib/material.module';

const modules = [
  BrowserAnimationsModule,
  HttpModule,
  BrowserModule,
  MaterialModule,
  FormsModule,
  ReactiveFormsModule,
  ChartsModule,
];

import {
  BatteryLevelComponent,
  DoubleValueComponent,
  IconDeviceComponent,
  SingleValueComponent,
  TimeSinceComponent,
  ValueScaleComponent,
  ScaleSetComponent,
} from './components';

const plugins = [
  BatteryLevelComponent,
  DoubleValueComponent,
  IconDeviceComponent,
  SingleValueComponent,
  TimeSinceComponent,
  ValueScaleComponent,
  ScaleSetComponent,
];

import 'hammerjs';

import '@angular/material/prebuilt-themes/deeppurple-amber.css';
import './app.sass';


import {DashboardComponent} from './pages/dashboard.component';
import {DevicesComponent} from './pages/devices.component';

const pages = [
  DashboardComponent,
  DevicesComponent,
];

import {InputDisableDirective} from './directives/input-disable.directive';
import {DraggableDirective} from './directives/draggable.directive';

const directives = [
  InputDisableDirective,
  DraggableDirective,
];


import {DeviceSettingsDialog} from './pages/device-settings.dialog';
import {DeviceStatsDialog} from './pages/device-stats.dialog';

const dialogs = [
  DeviceSettingsDialog,
  DeviceStatsDialog,
];


import {DeviceService} from './services/device.service';
import {ZoneService} from './services/zone.service';
import {CacheService} from './services/cache.service';
import {StorageService} from './services/storage.service';
import {MqttService} from './services/mqtt.service';
import {StatsService} from './services/stats.service';

const services = [
  DeviceService,
  ZoneService,
  CacheService,
  StorageService,
  MqttService,
  StatsService
];


import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {WidgetsModule} from './widgets/widgets.module';

@NgModule({
  imports: [
    ...modules,

    AppRoutingModule,
    WidgetsModule,
  ],
  declarations: [
    AppComponent,

    // components
    ...plugins,

    // pages
    ...pages,

    // directives
    ...directives,

    // dialogs
    ...dialogs,
  ],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    ...dialogs,
  ],
  providers: [
    ...services,
  ]
})
export class AppModule { }
