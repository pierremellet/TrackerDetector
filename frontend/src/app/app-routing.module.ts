import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApplicationEditComponent } from './application-edit/application-edit.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { UnknowcookiesComponent } from './reports/unknowcookies/unknowcookies.component';
import { ReportsComponent } from './reports/reports.component';
import { UnknowurlsComponent } from './reports/unknowurls/unknowurls.component';
import { CookieCategoriesComponent } from './settings/cookie-categories/cookie-categories.component';
import { DomainsComponent } from './settings/domains/domains.component';
import { SettingsComponent } from './settings/settings.component';
import { VersionEditComponent } from './version-edit/version-edit.component';

const routes: Routes = [
  { path: 'applications', component: ApplicationListComponent },
  { path: 'applications/:id', component: ApplicationEditComponent },
  { path: 'applications/:appId/versions/:verId', component: VersionEditComponent },
  {
    path: 'analysis', component: ReportsComponent, children: [
      { path: '', redirectTo: 'applications', pathMatch: 'full' },
      {
        path: 'unknowcookies',
        component: UnknowcookiesComponent,
      },
      {
        path: 'unknowcookies/:appId',
        component: UnknowcookiesComponent,
      },
      {
        path: 'unknowurls',
        component: UnknowurlsComponent,
      },
    ],
  },
  {
    path: 'settings', component: SettingsComponent, children: [
      { path: '', redirectTo: 'cookies', pathMatch: 'full' },
      {
        path: 'cookies',
        component: CookieCategoriesComponent,
      },
      {
        path: 'domains',
        component: DomainsComponent,
      },
    ],
  },
  { path: '**', redirectTo: '/applications', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
