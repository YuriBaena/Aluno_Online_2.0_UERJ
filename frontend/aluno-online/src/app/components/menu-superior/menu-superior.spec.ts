import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http'; // Importe isso
import { MenuSuperior } from './menu-superior';

describe('MenuSuperior', () => {
  let component: MenuSuperior;
  let fixture: ComponentFixture<MenuSuperior>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSuperior],
      providers: [
        provideHttpClient() // Adicione o provider aqui
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuSuperior);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});