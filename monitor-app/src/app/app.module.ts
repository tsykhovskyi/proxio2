import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TunnelComponent } from './tunnel/tunnel.component';
import { HttpStatusListComponent } from './tunnel/http/http-status-list/http-status-list.component';
import { HttpPreviewComponent } from './tunnel/http/http-preview/http-preview.component';

@NgModule({
  declarations: [
    AppComponent,
    TunnelComponent,
    HttpStatusListComponent,
    HttpPreviewComponent,
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
