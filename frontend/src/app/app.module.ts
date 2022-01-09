import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from './navbar/navbar.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ApplicationEditComponent } from './application-edit/application-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VersionListComponent } from './version-list/version-list.component';
import { VersionEditComponent } from './version-edit/version-edit.component';
import { ReportsComponent } from './reports/reports.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ApplicationListComponent,
    PageNotFoundComponent,
    ApplicationEditComponent,
    VersionListComponent,
    VersionEditComponent,
    ReportsComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
