import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-version-edit',
  templateUrl: './version-edit.component.html',
  styleUrls: ['./version-edit.component.scss']
})
export class VersionEditComponent implements OnInit, OnChanges {

  @Input()
  version: any

  versionForm = new FormGroup({
    versionName: new FormControl('', [Validators.required]),
    versionURLs: new FormControl('')
  });


  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    const version = changes['version'].currentValue;
    this.updateForm(version);
  }

  updateForm(version: any){
    this.versionForm.get('versionName')?.setValue(version.name);
    this.versionForm.get('versionURLs')?.setValue(version.urls);
  }

  ngOnInit(): void {
  }

}
