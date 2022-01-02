import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GraphQLService } from '../graph-ql.service';

@Component({
  selector: 'app-version-list',
  templateUrl: './version-list.component.html',
  styleUrls: ['./version-list.component.scss']
})
export class VersionListComponent {

  @Input()
  versions: any[] = [];

  @Output()
  selectedVersion = new EventEmitter<any>();
 

}
