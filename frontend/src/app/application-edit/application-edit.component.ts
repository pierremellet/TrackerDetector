import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';

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

  constructor(private gql: GraphQLService, private route: ActivatedRoute, private router: Router) {
  }

  show(event: any) {
    console.log(event);
  }

  submit() {
    const queyString = `
    mutation {
      createApplication(appName: "${this.appForm.get('appName')?.value}"){
        id
        name
      }
    }`;

    this.gql.sendQuery(queyString)
      .pipe(
        map((resp: any) => resp.data.createApplication)
      ).subscribe(app => {
        this.router.navigate(['/applications', app.id, 'view'])
      })
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
        }
      }
    `;
    this.gql.sendQuery(queyString).pipe(
      map(r => r.data.createApplication),
      tap(v => this.app.versions = v.versions)
    ).subscribe();
  }

  goToVersion(id: number){
    this.router.navigate(['/application', this.app.id, 'versions', id]);
  }


}
