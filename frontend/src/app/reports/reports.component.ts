import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';
import { ToastService } from '../toast.service';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

  public applications: Array<any> = [];
  public currentApplication: any | undefined;
  public currentApplicationId: number | undefined = undefined;
  public logs: Array<string> = [];
  public socket: WebSocket | undefined = undefined;

  constructor(public gql: GraphQLService, private toast: ToastService) { }

  ngOnInit(): void {
    const allApplicationsQuery = `{
      allApplications{
        id
        name
      }
    }`;

    this.gql.sendQuery(allApplicationsQuery).pipe(
      map((resp: any) => resp.data.allApplications)
    ).subscribe(applications => this.applications = applications);
  };


  listenAppCookieMissingEvent(appId: number): WebSocket {
    const GRAPHQL_ENDPOINT = "ws://localhost:3000/graphql";

    const query = `subscription{appCookieNotFounded(appId: ${appId}) {name}}`;

    const GQL_CONNECTION_INIT = '{"type":"connection_init","payload":{"content-type":"application/json"}}	';
    const MESSAGE = `{"id":"1","type":"start","payload":{"query":"${query}","variables":{}}}`;


    var exampleSocket = new WebSocket(GRAPHQL_ENDPOINT, "graphql-ws");
    exampleSocket.onopen = function (event) {
      exampleSocket.send(GQL_CONNECTION_INIT);
      exampleSocket.send(MESSAGE);
    };

    exampleSocket.onmessage = (event: MessageEvent) => {
      console.log(event);
      if (event.type === "data") {
        if (this.logs.length >= 50) {
          this.logs.pop();
        }
        this.logs.push(event.data.payload);
      }
    };

    return exampleSocket;
  }

  convertToTemplate(version: any, cookie: any) {
    const query = `
    mutation {
      convertCookieInstanceToTemplate(versionId: ${version.id}, cookieInstanceId: ${cookie.id}){
        id
      }
    }`;

    this.gql.sendQuery(query)
    .subscribe(() => {
      this.toast.show("Template Created !", `Cookie ${cookie.name} converted to template`); 
      cookie.hide = true;
    });
  }

  update(appId: any) {
    const query = `{
      findApplication(id: ${appId}){
        versions {
          id
          name
          report {
            driftCookies {
              id
              name
              domain
              url
            }
          }
        }
      }
    }`;

    this.gql.sendQuery(query).pipe(
      map(resp => resp.data.findApplication)
    ).subscribe(app => this.currentApplication = app);
  }

  cleanUp(version: any) {
    const query = `
    mutation {
      deleteCookieInstancesForVersion(versionId: ${version.id})
    }`;

    this.gql.sendQuery(query).pipe(
      map(resp => resp.data.deleteCookieInstancesForVersion)
    ).subscribe(nb => {
      this.toast.show("Version cleanup", `${nb} cookies removed !`);
      version.report.driftCookies = [];
    });

  };

  onApplicationChange(event: any) {

    const appId = event.target.value as number;

    this.update(appId);
  }

}
