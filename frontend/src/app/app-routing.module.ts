import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApplicationEditComponent } from './application-edit/application-edit.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { CookieTemplateComponent } from './cookie-template/cookie-template.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { VersionEditComponent } from './version-edit/version-edit.component';

const routes: Routes = [
  {path: 'applications', component: ApplicationListComponent },
  {path: 'applications/new', component: ApplicationEditComponent },
  {path: 'applications/:id', component: ApplicationEditComponent },
  {path: 'applications/:appId/versions/:id', component: VersionEditComponent },
  {path: 'cookie-templates', component: CookieTemplateComponent },
  {path: '**', component: PageNotFoundComponent }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
