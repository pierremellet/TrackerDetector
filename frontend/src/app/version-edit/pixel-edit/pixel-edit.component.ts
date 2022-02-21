import { Version } from '@angular/compiler';
import { Component, Input, OnInit } from '@angular/core';
import { ApplicationVersion } from 'src/app/model';

@Component({
  selector: 'app-pixel-edit',
  templateUrl: './pixel-edit.component.html',
  styleUrls: ['./pixel-edit.component.scss']
})
export class PixelEditComponent implements OnInit {


  @Input()
  public version: ApplicationVersion|undefined; 

  constructor() { }

  ngOnInit(): void {
  }

}
