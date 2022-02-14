import { Component, Input, OnInit } from '@angular/core';
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

  constructor(gql: GraphQLService) { }

  ngOnInit(): void {
  }

  remove(item: DisablableItem) {
    item.enable = false;
  }

  addPixel(){
    this.pixels.push({
      uri:"https://....",
      type: "PREFIX",
      enable: true
    })
  }

  save(){

  }

}
