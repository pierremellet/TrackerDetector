import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';
import { CookieCategories } from 'src/app/model';
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
  public cookieCategories: CookieCategories[] = [];

  constructor(public gql: GraphQLService, private toast: ToastService) { }

  ngOnInit(): void {
    const allApplicationsQuery = `{
      allApplications{
        id
        name
      }
      configuration {
        cookieCategories {
          id
          name
        }
      }
    }`;

    this.gql.sendQuery(allApplicationsQuery).pipe(
      map((resp: any) => resp.data)
    ).subscribe(data => {
      this.applications = data.allApplications;
      this.cookieCategories = data.configuration.cookieCategories;
    });
  }

  convertToTemplate(version: any, cookie: any, cookieCategoryId: number) {
    const query = `
    mutation {
      convertCookieInstanceToTemplate(versionId: ${version.id}, cookieInstanceId: ${cookie.id}, cookieCategoryId: ${cookieCategoryId}){
        id
      }
    }`;

    this.gql.sendQuery(query)
      .subscribe(() => {
        this.toast.show("Template Created !", `Cookie ${cookie.name} converted to template`);
        cookie.hide = true;
      });
  }

  csvExport(appId: any) {

    const report: string[] = [];

    (this.currentApplication.versions as any[]).forEach(version => {
      const versionName = version.name;
      version.report.driftCookies.forEach((c: any) => {
        report.push(`${versionName}, ${c.url}, ${c.name}, ${c.domain}`);
      })
    });

    var hiddenElement = document.createElement('a');

    hiddenElement.href = 'data:attachment/csv,' + encodeURI(report.join('\n'));
    hiddenElement.target = '_blank';
    hiddenElement.download = 'report.csv';
    hiddenElement.click();

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
              pageURL
            }
          }
        }
      }
    }`;

    this.gql.sendQuery(query).pipe(
      map(resp => resp.data.findApplication)
    ).subscribe(app => this.currentApplication = app);
  }

  groupByURL(driftCookies: any[]) {

    const res: {
      [pageURL: string]: any[]
    } = {};

    driftCookies.forEach(c => {
      if (!res[c.pageURL]) {
        res[c.pageURL] = []
      }
      res[c.pageURL].push(c);
    })

    return res;

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
