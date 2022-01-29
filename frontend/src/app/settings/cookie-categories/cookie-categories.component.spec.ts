import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieCategoriesComponent } from './cookie-categories.component';

describe('CookieCategoriesComponent', () => {
  let component: CookieCategoriesComponent;
  let fixture: ComponentFixture<CookieCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CookieCategoriesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CookieCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
