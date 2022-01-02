import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieTemplateComponent } from './cookie-template.component';

describe('CookieTemplateComponent', () => {
  let component: CookieTemplateComponent;
  let fixture: ComponentFixture<CookieTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CookieTemplateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CookieTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
