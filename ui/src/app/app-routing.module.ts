import { NgModule, isDevMode } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DashboardComponent } from './pages/dashboard.component';
import { DevicesComponent } from './pages/devices.component';

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        pathMatch: 'full',
        component: DashboardComponent
      },
      {
        path: 'devices',
        pathMatch: 'full',
        component: DevicesComponent
      }
    ],
      { enableTracing: isDevMode() }
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
