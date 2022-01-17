import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

  public applications: Array<any> = [];
  public currentApplicationId: number | undefined = undefined;
  public logs: Array<string> = [];
  public socket: WebSocket | undefined = undefined;

  constructor(public gql: GraphQLService) { }

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
        if(this.logs.length >= 50){
          this.logs.pop();
        }
        this.logs.push(event.data.payload);
      }
    };

    return exampleSocket;
  }

  onApplicationChange(event: any) {

    const appId = event.target.value as number;
    if (this.socket) {
      this.socket.close();
    }
    this.socket = this.listenAppCookieMissingEvent(appId);
  }

}
