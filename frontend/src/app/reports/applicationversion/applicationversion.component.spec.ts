import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationversionComponent } from './applicationversion.component';

describe('ApplicationversionComponent', () => {
  let component: ApplicationversionComponent;
  let fixture: ComponentFixture<ApplicationversionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicationversionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationversionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
