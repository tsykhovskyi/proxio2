import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpInfoListComponent } from './http-info-list.component';

describe('HttpStatusComponent', () => {
  let component: HttpInfoListComponent;
  let fixture: ComponentFixture<HttpInfoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HttpInfoListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HttpInfoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
