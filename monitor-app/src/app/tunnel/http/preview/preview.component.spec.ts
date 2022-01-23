import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpPreviewComponent } from './preview.component';

describe('PreviewComponent', () => {
  let component: HttpPreviewComponent;
  let fixture: ComponentFixture<HttpPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HttpPreviewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HttpPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
