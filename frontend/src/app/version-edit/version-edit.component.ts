import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';
import { Domain, CookieCategories } from '../model';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-version-edit',
  templateUrl: './version-edit.component.html',
  styleUrls: ['./version-edit.component.scss']
})
export class VersionEditComponent implements OnInit {


  appId: number | undefined;
  verId: number | undefined;
  version: any;
  applicationName: any;
  loading = false;
  domains: Domain[] = [];
  cookieCategories: CookieCategories[] = [];


  constructor(private route: ActivatedRoute, private router: Router, private gql: GraphQLService, private toast: ToastService) { }

  addURL() {
    this.version.urls.push({
      id: undefined,
      domain: {
        id: undefined
      },
      path: "/"
    })
  }

  addCookie() {
    this.version.cookies.push({
      id: undefined,
      nameRegex: ".*",
      category: {
        id: undefined
      },
    })
  }

  remove(element: any) {
    element['disabled'] = true;
  }
  delete(version: any) {
    if (window.confirm(`Delete application version : ${version.name} ?`)) {

      const query = `
      mutation{
        deleteApplicationVersion(versionId: ${version.id}){
          id
        }
      }
    `;

      this.gql.sendQuery(query).subscribe(() => this.router.navigate(['/applications', this.appId]))
    }
  }

  ngOnInit(): void {
    const appIdParam = this.route.snapshot.paramMap.get('appId');
    const verIdParam = this.route.snapshot.paramMap.get('verId');

    if (appIdParam && verIdParam) {
      this.appId = parseInt(appIdParam, 10);
      this.verId = parseInt(verIdParam, 10);
    }

    const query = `
    {
      configuration {
        domains {
          id
          name
        }
        cookieCategories {
          id
          name
        }
      }
      findApplication(id: ${this.appId}){
        id
        name
        versions(filter: ${this.verId}){
          id
          name
          enable
          urls{
            id
            path
            domain{
              id
              name
            }
            type
          }
          cookies{
            id
            nameRegex
            domain
            path
            httpOnly
            hostOnly
            secure
            session
            category{
              id
              name
            }
          }
        }
      }
    }
    `
    this.gql.sendQuery(query)
      .pipe(map(r => r.data))
      .subscribe(data => {
        this.applicationName = data.findApplication.name;
        this.version = data.findApplication.versions[0];
        this.domains = data.configuration.domains;
        this.cookieCategories = data.configuration.cookieCategories;
      })

  }


  save() {
    this.loading = true;

    const urlsString = this.version.urls.map((url: any) => {
      var idStr = "";
      if (url.id) {
        idStr = `id:${url.id}`
      }
      return `{
          ${idStr}
          path:"${url.path}"
          domainId: ${url.domain.id}
          type:"${url.type}"
          disabled: ${url.disabled || false}
        }`
    });

    const cookiesString = this.version.cookies.map((cookie: any) => {
      var idStr = "";
      if (cookie.id) {
        idStr = `id:${cookie.id}`
      }
      return `{
          ${idStr}
          nameRegex:"${cookie.nameRegex}"
          httpOnly: ${cookie.httpOnly}
          disabled: ${cookie.disabled || false}
          domain: "${cookie.domain}"
          path: "${cookie.path}"
          hostOnly: ${cookie.hostOnly}
          secure: ${cookie.secure}
          session: ${cookie.session}
          category: ${cookie.category.id}
        }`
    });

    const query = `
    mutation {
      updateApplicationVersion(version: {
        id : ${this.verId}
        name: "${this.version.name}"
        enable: ${this.version.enable}
        urls: [${urlsString.join(',')}]
        cookies: [${cookiesString.join(',')}]
      }){
        id
        name
        enable
        urls{
          id
          path
          domain{
            id
            name
          }
          type
        }
        cookies{
          id
          nameRegex
          domain
          path
          httpOnly
          hostOnly
          secure
          session
          category{
            id
            name
          }
        }
      }
    }
    `

    this.gql.sendQuery(query)
      .pipe(
        map(r => r.data.updateApplicationVersion)
      ).subscribe(version => {
        this.loading = false;
        this.version = version;
        this.toast.show("Application Version", "Updated !");
      })
  }




}
