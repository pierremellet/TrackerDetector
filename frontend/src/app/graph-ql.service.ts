import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ToastService } from './toast.service';

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
    }) 
  }

}
 