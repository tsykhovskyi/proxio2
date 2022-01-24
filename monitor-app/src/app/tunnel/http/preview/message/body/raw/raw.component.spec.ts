import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawComponent } from './raw.component';

describe('RawwComponent', () => {
  let component: RawComponent;
  let fixture: ComponentFixture<RawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RawComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
