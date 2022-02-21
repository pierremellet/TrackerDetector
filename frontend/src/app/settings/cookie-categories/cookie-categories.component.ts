import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';

@Component({
  selector: 'app-cookie-categories',
  templateUrl: './cookie-categories.component.html',
  styleUrls: ['./cookie-categories.component.scss']
})
export class CookieCategoriesComponent implements OnInit {

  public cookieCategories: Category[] = [];
  public newCookieCategoryName: string = "";

  constructor(public gql: GraphQLService) { }

  ngOnInit(): void {
    const query = `{
      configuration {
        cookieCategories {
          id
          name
          enable
        }
      }
    }
    `;

    this.gql.sendQuery(query)
      .pipe(map(resp => resp.data.configuration.cookieCategories))
      .subscribe(cats => this.cookieCategories = cats);
  }

  createCookieCategory() {
    const createCookieQuery = `
    mutation {
      createCookieCategory(name: "${this.newCookieCategoryName}"){
        id
        name
      }
    }
    `;

    this.gql.sendQuery(createCookieQuery)
      .subscribe(() => {
        this.newCookieCategoryName = "";
        this.ngOnInit()
      });

  }

  saveCookieCategory(cat: Category) {
    const query = `
      mutation {
        updateCookieCategory(cookieCategoryId: ${cat.id} ,cookieCategoryName : "${cat.name}", cookieCategoryEnable: ${cat.enable}){
          id
        }
      }`;
    this.gql.sendQuery(query)
      .subscribe(() => this.ngOnInit());
  }

  toggleCookieCategorieState(cat: Category) {
    this.saveCookieCategory({
      enable: !cat.enable,
      id: cat.id,
      name: cat.name
    })

  }

}

type Category = {
  id: number,
  enable: boolean,
  name: string
}
