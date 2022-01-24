import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TunnelComponent } from './tunnel/tunnel.component';
import { HttpStatusListComponent } from './tunnel/http/http-status-list/http-status-list.component';
import { MessageComponent } from './tunnel/http/preview/message/message.component';
import { JsonComponent } from './tunnel/http/preview/message/body/json/json.component';
import { HttpPreviewComponent } from './tunnel/http/preview/preview.component';
import { HeadersComponent } from './tunnel/http/preview/message/headers/headers.component';

@NgModule({
  declarations: [
    AppComponent,
    TunnelComponent,
    HttpStatusListComponent,
    HttpPreviewComponent,
    MessageComponent,
    JsonComponent,
    HeadersComponent,
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
