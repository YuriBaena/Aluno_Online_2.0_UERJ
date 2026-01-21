import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // Importe isso
import { MenuLateral } from './menu-lateral';

describe('MenuLateral', () => {
  let component: MenuLateral;
  let fixture: ComponentFixture<MenuLateral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateral],
      providers: [
        provideRouter([]) // Adicione isso para simular o sistema de rotas
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuLateral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});