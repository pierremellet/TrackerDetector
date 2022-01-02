import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GraphQLService {

  constructor(private http: HttpClient) { }

  sendQuery(queyString: string): Observable<any> {
    return this.http.post(environment.graphQLEndpoint, {
      "query": queyString,
      "operationName": null,
      "variables": {}
    });
  }

}
 