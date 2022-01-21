import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { GraphQLService } from '../graph-ql.service';
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


  constructor(private route: ActivatedRoute, private gql: GraphQLService, private toast : ToastService) { }

  addURL() {
    this.version.urls.push({
      id: undefined,
      name: ""
    })
  }

  addCookie() {
    this.version.cookies.push({
      id: undefined,
      nameRegex: ".*"
    })
  }

  remove(element: any) {
    element['disabled'] = true;
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
      findApplication(id: ${this.appId}){
        id
        name
        versions(filter: ${this.verId}){
          id
          name
          enable
          urls{
            id
            url
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
          }
        }
      }
    }
    `
    this.gql.sendQuery(query)
      .pipe(map(r => r.data.findApplication))
      .subscribe(data => {
        this.applicationName = data.name;
        this.version = data.versions[0];
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
          url:"${url.url}"
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
          url
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
