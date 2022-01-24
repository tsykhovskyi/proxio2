import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TunnelComponent } from './tunnel/tunnel.component';
import { HttpStatusListComponent } from './tunnel/http/http-status-list/http-status-list.component';
import { MessageComponent } from './tunnel/http/preview/message/message.component';
import { JsonComponent } from './tunnel/http/preview/message/body/json/json.component';
import { HttpPreviewComponent } from './tunnel/http/preview/preview.component';
import { HeadersComponent } from './tunnel/http/preview/message/headers/headers.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BodyComponent } from './tunnel/http/preview/message/body/body.component';
import { ImageComponent } from './tunnel/http/preview/message/body/image/image.component';

@NgModule({
  declarations: [
    AppComponent,
    TunnelComponent,
    HttpStatusListComponent,
    HttpPreviewComponent,
    MessageComponent,
    JsonComponent,
    HeadersComponent,
    BodyComponent,
    ImageComponent,
  ],
  imports: [BrowserModule, NgbModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
