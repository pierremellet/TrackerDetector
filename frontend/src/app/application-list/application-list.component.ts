import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';

@Component({
  selector: 'app-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.scss']
})
export class ApplicationListComponent implements OnInit {
  apps: any;

  constructor(private gql: GraphQLService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const queyString = `
    {
      allApplications{
        name
        id
      }
    }
    `;

    this.gql.sendQuery(queyString).pipe(
      map((resp: any) => resp.data.allApplications)
    ).subscribe(apps => this.apps = apps)
  }

  createApplication(){
    const queyString = `
    mutation{
      createApplication(appName: "My New Application"){
        id
      }
    }
    `;

    this.gql.sendQuery(queyString).pipe(
      map((resp:any) => resp.data.createApplication)
    ).subscribe(app => {
      this.router.navigate(["/applications", app.id])
    })
  }
 

}
