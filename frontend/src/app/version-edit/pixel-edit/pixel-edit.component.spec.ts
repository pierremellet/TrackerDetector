import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixelEditComponent } from './pixel-edit.component';

describe('PixelEditComponent', () => {
  let component: PixelEditComponent;
  let fixture: ComponentFixture<PixelEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PixelEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PixelEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
