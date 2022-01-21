import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-application-edit',
  templateUrl: './application-edit.component.html',
  styleUrls: ['./application-edit.component.scss']
})
export class ApplicationEditComponent implements OnInit {

  appForm = new FormGroup({
    appName: new FormControl('', [Validators.required])
  });

  id: string | null = "";
  app: any;
  currentVersion: any;

  constructor(private gql: GraphQLService, private route: ActivatedRoute, private toast: ToastService,  private router: Router) {
  }

  deleteApp() {
    if (window.confirm(`Delete application ${this.app.name} ?`)) {

      const queyString = `
      mutation {
        deleteApplication(appId: "${this.app.id}")
      }`;
  
      this.gql.sendQuery(queyString)
        .pipe(
          map((resp: any) => resp.data.createApplication)
        ).subscribe(app => {
          console.log(app);
          this.router.navigate(['/applications'])
        })
    }
  }

  submit() {
    const queyString = `
    mutation {
      updateApplication(appId: ${this.app.id}, appName: "${this.appForm.get('appName')?.value}"){
        id
        name
      }
    }`;

    this.gql.sendQuery(queyString)
      .pipe(
        map((resp: any) => resp.data.createApplication)
      ).subscribe(() => {
        this.toast.show('Application', 'Updated !');
      });
  }

  update(id: number) {
    if (id) {
      const queyString = `
        {
          findApplication(id: ${id}){
            id
            name
            versions {
              id
              name
              enable
            }
          }
        }`;
      this.gql.sendQuery(queyString).pipe(
        map((resp: any) => resp.data.findApplication)
      ).subscribe(app => {
        this.app = app;
        this.appForm.get('appName')?.setValue(app.name);
       })
    }
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam)
      this.update(parseInt(idParam, 10));
  }

  createVersion() {
    const queyString = `
      mutation {
        createApplicationVersion(appId: ${this.app.id},  versionName: "new") {
             id
            name
            enable
        }
      }
    `;
    this.gql.sendQuery(queyString).pipe(
      map(r => r.data.createApplicationVersion),
      tap(v => this.app.versions.push(v))
    ).subscribe();
  }

  goToVersion(id: number) {
    this.router.navigate(['/applications', this.app.id, 'versions', id]);
  }


}
