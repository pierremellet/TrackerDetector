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

  public logs: Array<string> = [];
  public socket: WebSocket | undefined = undefined;

  constructor() { }

  ngOnInit(): void {
   
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


}
