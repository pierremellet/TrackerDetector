import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.scss']
})
export class ApplicationListComponent implements OnInit {
  apps: any;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const queyString = `
    {
      allApplications{
        name
        id
      }
    }
    `;

    this.http.post('http://localhost:3333/graphql', {
      "query": queyString,
      "operationName": null,
      "variables": {}
    }).pipe(
      map((resp: any) => resp.data.allApplications)
    ).subscribe(apps => this.apps = apps)
  }

  nav(id: number){
    this.router.navigate([id], {relativeTo:this.route});

  }
 

}
