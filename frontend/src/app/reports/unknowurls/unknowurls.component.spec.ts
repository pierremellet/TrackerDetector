import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnknowurlsComponent } from './unknowurls.component';

describe('UnknowurlsComponent', () => {
  let component: UnknowurlsComponent;
  let fixture: ComponentFixture<UnknowurlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnknowurlsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnknowurlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
