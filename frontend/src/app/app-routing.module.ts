import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApplicationEditComponent } from './application-edit/application-edit.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { ReportsComponent } from './reports/reports.component';
import { VersionEditComponent } from './version-edit/version-edit.component';

const routes: Routes = [
  {path: 'applications', component: ApplicationListComponent },
  {path: 'applications/:id', component: ApplicationEditComponent },
  {path: 'applications/:appId/versions/:verId', component: VersionEditComponent },
  {path: 'reports', component: ReportsComponent },
  {path: '**', redirectTo: '/applications', pathMatch: 'full' }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
