import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TunnelComponent } from './tunnel/tunnel.component';
import { HttpInfoListComponent } from './tunnel/http/http-status/http-info-list.component';

@NgModule({
  declarations: [AppComponent, TunnelComponent, HttpInfoListComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
