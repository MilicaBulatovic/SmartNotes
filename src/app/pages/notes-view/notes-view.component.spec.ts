import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesViewComponent } from './notes-view.component';

describe('NotesViewComponent', () => {
  let component: NotesViewComponent;
  let fixture: ComponentFixture<NotesViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotesViewComponent]
    });
    fixture = TestBed.createComponent(NotesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
