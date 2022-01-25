import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';
import { ToastService } from 'src/app/toast.service';

@Component({
  selector: 'app-applicationversion',
  templateUrl: './applicationversion.component.html',
  styleUrls: ['./applicationversion.component.scss']
})
export class ApplicationversionComponent implements OnInit {

  public applications: Array<any> = [];
  public currentApplication: any | undefined;
  public currentApplicationId: number | undefined = undefined;


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
