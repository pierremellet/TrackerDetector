import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';
import { LogoService } from 'src/app/logo.service';
import { CookieCategories } from 'src/app/model';
import { ToastService } from 'src/app/toast.service';

declare var bootstrap: any;
@Component({
  selector: 'app-unknowcookies',
  templateUrl: './unknowcookies.component.html',
  styleUrls: ['./unknowcookies.component.scss']
})
export class UnknowcookiesComponent implements OnInit {

  public applications: Array<any> = [];
  public currentApplication: any | undefined;
  public currentApplicationId: number | undefined = undefined;
  public cookieCategories: CookieCategories[] = [];
  currentURLs: any[] = [];

  constructor(public gql: GraphQLService, private toast: ToastService, public logoService : LogoService) { }

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

  secondsToMinutes(sec: number): number {
    return Math.trunc(sec / 60)
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
              duration
              pageURL
              ressourceURLs {
                url
                initiator
              }
              information {
                platform
                category
                retentionPeriod
                description 
                dataController
                gdpr
              }
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

  openModal(urls: string[]) {
    this.currentURLs = urls;
    const modal = new bootstrap.Modal(document.getElementById('modal'));
    modal.toggle();
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
