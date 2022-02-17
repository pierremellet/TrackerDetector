import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixeltemplateListComponent } from './pixeltemplate-list.component';

describe('PixeltemplateListComponent', () => {
  let component: PixeltemplateListComponent;
  let fixture: ComponentFixture<PixeltemplateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PixeltemplateListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PixeltemplateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
