import { Component, OnInit } from '@angular/core';
import { GraphQLService } from 'src/app/graph-ql.service';

@Component({
  selector: 'app-cookie-categories',
  templateUrl: './cookie-categories.component.html',
  styleUrls: ['./cookie-categories.component.scss']
})
export class CookieCategoriesComponent implements OnInit {

  public categories : Category[] = [];

  constructor(public gql: GraphQLService) { }

  ngOnInit(): void {
  }

  createCategory(){
    const createCookieQuery = `
    mutation {
      createCookieCategory(name: "New Category"){
        id
        name
      }
    }
    `;

    this.gql.sendQuery(createCookieQuery)
    .subscribe()
  }

}

type Category = {
  id: number,
  name: string
}
