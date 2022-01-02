import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from './navbar/navbar.component';
import { CookieTemplateComponent } from './cookie-template/cookie-template.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ApplicationEditComponent } from './application-edit/application-edit.component';
import { ReactiveFormsModule } from '@angular/forms';
import { VersionListComponent } from './version-list/version-list.component';
import { VersionEditComponent } from './version-edit/version-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CookieTemplateComponent,
    ApplicationListComponent,
    PageNotFoundComponent,
    ApplicationEditComponent,
    VersionListComponent,
    VersionEditComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
