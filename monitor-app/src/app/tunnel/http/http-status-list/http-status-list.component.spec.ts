import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpStatusListComponent } from './http-status-list.component';

describe('HttpStatusComponent', () => {
  let component: HttpStatusListComponent;
  let fixture: ComponentFixture<HttpStatusListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HttpStatusListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HttpStatusListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
