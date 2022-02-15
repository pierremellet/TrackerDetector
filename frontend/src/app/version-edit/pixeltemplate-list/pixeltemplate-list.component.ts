import { Component, Input, OnInit, Output } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';
import { DisablableItem, PixelTemplate } from 'src/app/model';

@Component({
  selector: 'app-pixeltemplate-list',
  templateUrl: './pixeltemplate-list.component.html',
  styleUrls: ['./pixeltemplate-list.component.scss']
})
export class PixeltemplateListComponent implements OnInit {


  @Input()
  pixels: PixelTemplate[] = [];

  @Input()
  versionId: number | undefined = undefined;


  constructor(private gql: GraphQLService) { }

  ngOnInit(): void {
  }

  remove(item: PixelTemplate) {
    const query = `
    mutation {
      deletePixelTemplate(pixelTemplateId: ${item.id}) {
        id
      }
    }`;

    this.gql.sendQuery(query)
      .pipe(map(x => x.data.deletePixelTemplate))
      .subscribe(res => {
        this.pixels = this.pixels.filter(i => i.id !== res.id);
      })
  }

  addPixel() {

    const query = `
    mutation {
      createPixelTemplate(uri: "https://...", type: "PREFIX", versionId: ${this.versionId}) {
        id
        uri
        type
      }
    }`;

    this.gql.sendQuery(query)
      .pipe(map(resp => resp.data.createPixelTemplate))
      .subscribe(res => {
        this.pixels.push(res);
      });
  }


}
