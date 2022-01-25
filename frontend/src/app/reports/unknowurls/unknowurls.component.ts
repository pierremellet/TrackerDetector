import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';
import { ToastService } from 'src/app/toast.service';

@Component({
  selector: 'app-unknowurls',
  templateUrl: './unknowurls.component.html',
  styleUrls: ['./unknowurls.component.scss']
})
export class UnknowurlsComponent implements OnInit {

  urls: any[] = [];

  constructor(public gql: GraphQLService, private toast: ToastService) { }

  ngOnInit(): void {
    const query = `
    {
      allUnknowURLs{
        url
        created
      }
    }
    `

    this.gql.sendQuery(query).pipe(
      map((resp: any) => resp.data.allUnknowURLs)
    ).subscribe(res => this.urls = res);
  }

}
