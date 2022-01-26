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

  public urls: any[] = [];
  public applications: Array<any> = [];
  public currentAppId: number | undefined;
  public currentVersionId: number | undefined;
  public appVersions: any[] | undefined;
  public currentURL: any;

  constructor(public gql: GraphQLService, private toast: ToastService) { }

  ngOnInit(): void {
    const query = `
    {
      allUnknowURLs{
        id
        url
        created
      }
      allApplications{
        id
        name
      }
    }
    `

    this.gql.sendQuery(query).pipe(
      map((resp: any) => resp.data)
    ).subscribe(res => {
      this.urls = res.allUnknowURLs;
      this.applications = res.allApplications;
    });
  }

  onApplicationChange(event: any) {
    this.currentAppId = event.target.value as number;
    this.getVersion(this.currentAppId);
  }

  onVersionChange(event: any) {
    this.currentVersionId = event.target.value as number;
  }

  getVersion(appId: number) {
    const query = `
    {
      findApplication(id: ${appId}){
        versions{
          id
          name
        }
      }
    }
    `

    this.gql.sendQuery(query)
      .pipe(map(res => res.data.findApplication.versions))
      .subscribe(versions => {
        this.appVersions = versions;
        console.log(this.appVersions);
      });
  }

  currentUnknowURL(url: any) {
    this.currentURL = url;
  }

  linkURLToVersion(appId: any, versionId: any, url: any) {
    console.log(url);
    const query =
      `
      mutation {
        linkApplicationURLToVersion(versionId: ${versionId}, appURLId: ${url.id}){
          id
        }
      }
    `;

    this.gql.sendQuery(query).subscribe(res => {
      this.ngOnInit();
    })
  }

}
