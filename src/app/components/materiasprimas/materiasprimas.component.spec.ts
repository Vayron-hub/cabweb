import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MateriasprimasComponent } from './materiasprimas.component';

describe('MateriasprimasComponent', () => {
  let component: MateriasprimasComponent;
  let fixture: ComponentFixture<MateriasprimasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MateriasprimasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MateriasprimasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
