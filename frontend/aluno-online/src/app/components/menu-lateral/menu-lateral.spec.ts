import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuLateral } from './menu-lateral';

describe('MenuLateral', () => {
  let component: MenuLateral;
  let fixture: ComponentFixture<MenuLateral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuLateral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
