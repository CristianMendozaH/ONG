# Frontend - Sistema de Gestión Angular

## 🚀 Tecnologías Utilizadas

- **Angular** v17+ - Framework principal
- **Angular Signals** - Manejo reactivo del estado
- **TypeScript** - Lenguaje de programación
- **Angular Material** - Componentes UI
- **RxJS** - Programación reactiva
- **Angular Router** - Navegación y routing
- **Angular Forms** - Formularios reactivos
- **JWT** - Autenticación con tokens

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                 # Servicios principales y stores
│   │   │   ├── guards/          # Guards de autenticación/autorización
│   │   │   ├── interceptors/    # HTTP interceptors
│   │   │   ├── services/        # Servicios principales
│   │   │   └── stores/          # Stores con Angular Signals
│   │   ├── shared/              # Componentes, interfaces compartidas
│   │   │   ├── components/      # Componentes reutilizables
│   │   │   ├── interfaces/      # Interfaces TypeScript
│   │   │   ├── pipes/          # Pipes personalizados
│   │   │   └── validators/      # Validadores personalizados
│   │   ├── features/            # Módulos de funcionalidades
│   │   │   ├── auth/           # Módulo de autenticación
│   │   │   ├── dashboard/      # Dashboard principal
│   │   │   └── users/          # Gestión de usuarios
│   │   └── layouts/            # Layouts de la aplicación
│   ├── assets/                 # Recursos estáticos
│   ├── environments/           # Configuración de entornos
│   └── styles/                # Estilos globales
├── angular.json               # Configuración de Angular
├── package.json
└── tsconfig.json             # Configuración TypeScript
```

## ⚙️ Configuración del Entorno

### Variables de Entorno

Crear archivos de configuración en `src/environments/`:

**environment.ts** (Desarrollo):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'Sistema de Gestión',
  version: '1.0.0',
  
  // Configuración de autenticación
  jwtTokenKey: 'auth-token',
  tokenExpirationKey: 'token-expiration',
  
  // Configuración de la aplicación
  pageSize: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  
  // Feature flags
  features: {
    darkMode: true,
    notifications: true,
    analytics: false
  }
};
```

**environment.prod.ts** (Producción):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-backend.com/api',
  appName: 'Sistema de Gestión',
  version: '1.0.0',
  
  jwtTokenKey: 'auth-token',
  tokenExpirationKey: 'token-expiration',
  
  pageSize: 20,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  features: {
    darkMode: true,
    notifications: true,
    analytics: true
  }
};
```

## 📦 Instalación y Configuración

```bash
# Instalar Angular CLI globalmente (si no está instalado)
npm install -g @angular/cli

# Instalar dependencias del proyecto
npm install

# Copiar archivo de configuración
cp src/environments/environment.example.ts src/environments/environment.ts

# Iniciar servidor de desarrollo
ng serve

# O con configuración específica
ng serve --configuration development --port 4200 --open
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
ng serve                    # Servidor de desarrollo
ng serve --open            # Abrir automáticamente en navegador
ng serve --port 4200       # Puerto específico

# Build
ng build                   # Build de desarrollo
ng build --prod           # Build de producción
ng build --configuration production

# Testing
ng test                    # Tests unitarios con Karma
ng test --watch=false     # Tests sin modo watch
ng test --code-coverage   # Tests con cobertura

# E2E Testing
ng e2e                    # Tests end-to-end

# Linting
ng lint                   # ESLint
ng lint --fix            # Autofix de linting

# Generación de código
ng generate component nombre    # Generar componente
ng generate service nombre      # Generar servicio
ng generate guard nombre        # Generar guard
ng generate module nombre       # Generar módulo

# Análisis del bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

## 🔐 Sistema de Autenticación con Signals

### UserStore (Manejo del Estado)

```typescript
// core/stores/user.store.ts
@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  // Getters reactivos (solo lectura)
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = this._isAuthenticated.asReadonly();

  // Computed properties
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  isTech = computed(() => this._currentUser()?.role === 'tech');
  userName = computed(() => this._currentUser()?.name || 'Usuario');

  setUser(user: User | null): void {
    this._currentUser.set(user);
    this._isAuthenticated.set(!!user);
  }

  clearUser(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }
}
```

### Auth Guard

```typescript
// core/guards/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private userStore: UserStore,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.userStore.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
```

### Role Guard

```typescript
// core/guards/role.guard.ts
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private userStore: UserStore) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'];
    return this.userStore.canAccess(requiredRole);
  }
}
```

## 🎨 Componentes y UI

### Uso de Angular Material

```typescript
// Importación en app.module.ts o standalone components
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
```

### Componente con Signals

```typescript
// Ejemplo: dashboard.component.ts
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  constructor(public userStore: UserStore) {}

  // Signals locales
  loading = signal(false);
  stats = signal<DashboardStats | null>(null);

  // Computed properties
  welcomeMessage = computed(() => 
    `¡Bienvenido, ${this.userStore.userName()}!`
  );

  canViewAdminSection = computed(() => 
    this.userStore.isAdmin() || this.userStore.isTech()
  );
}
```

### Template con Signals

```html
<!-- dashboard.component.html -->
<mat-card>
  <mat-card-header>
    <mat-card-title>{{ welcomeMessage() }}</mat-card-title>
  </mat-card-header>
  
  <mat-card-content>
    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <div class="stats-grid">
        <!-- Contenido del dashboard -->
      </div>
    }

    @if (canViewAdminSection()) {
      <div class="admin-section">
        <!-- Sección solo para admin/tech -->
      </div>
    }
  </mat-card-content>
</mat-card>
```

## 🛣️ Routing y Navegación

### Configuración de Rutas

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(c => c.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(c => c.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.module')
      .then(m => m.UsersModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(c => c.NotFoundComponent)
  }
];
```

## 🔧 Servicios HTTP

### Auth Service

```typescript
// core/services/auth.service.ts
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private userStore: UserStore
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        // Guardar token
        localStorage.setItem(environment.jwtTokenKey, response.token);
        
        // Actualizar store
        this.userStore.setUser(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(environment.jwtTokenKey);
    this.userStore.clearUser();
  }
}
```

### HTTP Interceptor

```typescript
// core/interceptors/auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem(environment.jwtTokenKey);

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
```

## 🎨 Estilos y Theming

### Configuración de Material Theme

```scss
// styles/theme.scss
@use '@angular/material' as mat;

// Definir paletas de colores
$primary-palette: mat.define-palette(mat.$blue-palette);
$accent-palette: mat.define-palette(mat.$pink-palette);
$warn-palette: mat.define-palette(mat.$red-palette);

// Crear tema
$theme: mat.define-light-theme((
  color: (
    primary: $primary-palette,
    accent: $accent-palette,
    warn: $warn-palette,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

// Aplicar tema
@include mat.all-component-themes($theme);
```

### Variables CSS Custom

```scss
// styles/variables.scss
:root {
  // Colores principales
  --primary-color: #1976d2;
  --accent-color: #e91e63;
  --warn-color: #f44336;
  
  // Espaciado
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  // Bordes
  --border-radius: 4px;
  --border-radius-lg: 8px;
  
  // Sombras
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.12);
}
```

## 🧪 Testing

### Test de Componente con Signals

```typescript
// dashboard.component.spec.ts
describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let userStore: UserStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [UserStore]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
  });

  it('should display welcome message for authenticated user', () => {
    // Arrange
    const mockUser: User = {
      id: '1',
      name: 'Cristian Mendoza',
      email: 'test@example.com',
      role: 'admin'
    };

    // Act
    userStore.setUser(mockUser);
    fixture.detectChanges();

    // Assert
    expect(component.welcomeMessage()).toContain('Cristian Mendoza');
  });
});
```

## 🚀 Build y Despliegue

### Build de Producción

```bash
# Build optimizado
ng build --prod

# Build con análisis de bundle
ng build --prod --stats-json

# Build con configuración específica
ng build --configuration production
```

### Configuración para Despliegue

```json
// angular.json - Configuración de producción
"production": {
  "fileReplacements": [{
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }],
  "optimization": true,
  "outputHashing": "all",
  "sourceMap": false,
  "namedChunks": false,
  "extractLicenses": true,
  "vendorChunk": false,
  "buildOptimizer": true,
  "budgets": [{
    "type": "initial",
    "maximumWarning": "2mb",
    "maximumError": "5mb"
  }]
}
```

## 📱 Progressive Web App (PWA)

```bash
# Agregar PWA
ng add @angular/pwa

# Build PWA
ng build --prod

# Servir PWA localmente para testing
npx http-server -p 8080 -c-1 dist/frontend
```

### Service Worker Configuration

```typescript
// app.module.ts
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
})
export class AppModule {}
```

## 🔧 Configuración Avanzada

### Lazy Loading Modules

```typescript
// features/users/users-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: UsersListComponent
  },
  {
    path: 'create',
    component: UserCreateComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: ':id',
    component: UserDetailComponent
  },
  {
    path: ':id/edit',
    component: UserEditComponent,
    canActivate: [RoleGuard],
    data: { role: 'admin' }
  }
];
```

### Standalone Components (Angular 15+)

```typescript
// shared/components/loading/loading.component.ts
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>{{ message() }}</p>
    </div>
  `,
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  message = input<string>('Cargando...');
}
```

### Custom Validators

```typescript
// shared/validators/custom-validators.ts
export class CustomValidators {
  static strongPassword(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) return null;
    
    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);
    const isMinLength = value.length >= 8;
    
    const valid = hasNumber && hasUpper && hasLower && hasSpecial && isMinLength;
    
    return valid ? null : {
      strongPassword: {
        hasNumber,
        hasUpper,
        hasLower,
        hasSpecial,
        isMinLength
      }
    };
  }

  static matchPassword(controlName: string, matchingControlName: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);

      if (!control || !matchingControl) return null;

      if (matchingControl.errors && !matchingControl.errors['passwordMismatch']) {
        return null;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        matchingControl.setErrors(null);
        return null;
      }
    };
  }
}
```

### Form con Reactive Forms y Signals

```typescript
// features/auth/register/register.component.ts
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, CustomValidators.strongPassword]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: CustomValidators.matchPassword('password', 'confirmPassword')
  });

  // Computed properties para validación
  isFormValid = computed(() => this.registerForm.valid);
  
  passwordErrors = computed(() => {
    const control = this.registerForm.get('password');
    return control?.errors?.['strongPassword'] || null;
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      
      const formValue = this.registerForm.value;
      
      this.authService.register(
        formValue.name!,
        formValue.email!,
        formValue.password!
      ).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error en registro:', error);
          this.loading.set(false);
        }
      });
    }
  }
}
```

## 🎭 Pipes Personalizados

```typescript
// shared/pipes/role.pipe.ts
@Pipe({
  name: 'role',
  standalone: true
})
export class RolePipe implements PipeTransform {
  transform(role: string): string {
    const roleNames: Record<string, string> = {
      'admin': 'Administrador',
      'tech': 'Técnico',
      'user': 'Usuario'
    };
    
    return roleNames[role] || role;
  }
}

// Uso en template
// {{ user.role | role }}
```

## 🔄 State Management Avanzado

### App State Store

```typescript
// core/stores/app.store.ts
interface AppState {
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  sidenavOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppStore {
  private _state = signal<AppState>({
    loading: false,
    error: null,
    theme: 'light',
    sidenavOpen: true
  });

  // Selectores
  state = this._state.asReadonly();
  loading = computed(() => this._state().loading);
  error = computed(() => this._state().error);
  theme = computed(() => this._state().theme);
  sidenavOpen = computed(() => this._state().sidenavOpen);

  // Actions
  setLoading(loading: boolean): void {
    this._state.update(state => ({ ...state, loading }));
  }

  setError(error: string | null): void {
    this._state.update(state => ({ ...state, error }));
  }

  toggleTheme(): void {
    this._state.update(state => ({
      ...state,
      theme: state.theme === 'light' ? 'dark' : 'light'
    }));
  }

  toggleSidenav(): void {
    this._state.update(state => ({
      ...state,
      sidenavOpen: !state.sidenavOpen
    }));
  }
}
```

## 🌍 Internacionalización (i18n)

```bash
# Agregar i18n
ng add @angular/localize

# Marcar textos para traducir
ng extract-i18n

# Build para diferentes idiomas
ng build --localize
```

```typescript
// Uso en componentes
import { LOCALE_ID, inject } from '@angular/core';

@Component({
  // ...
})
export class MyComponent {
  locale = inject(LOCALE_ID);
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.locale).format(date);
  }
}
```

## ⚡ Optimización de Performance

### OnPush Change Detection

```typescript
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ user().name }}</mat-card-title>
      </mat-card-header>
    </mat-card>
  `
})
export class UserCardComponent {
  user = input.required<User>();
}
```

### Lazy Loading de Imágenes

```typescript
// shared/directives/lazy-img.directive.ts
@Directive({
  selector: '[appLazyImg]',
  standalone: true
})
export class LazyImgDirective implements OnInit {
  @Input() appLazyImg!: string;
  
  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.el.nativeElement.src = this.appLazyImg;
          observer.unobserve(this.el.nativeElement);
        }
      });
    });

    observer.observe(this.el.nativeElement);
  }
}
```

## 📊 Monitoreo y Analytics

### Error Handling Global

```typescript
// core/services/global-error-handler.service.ts
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private notificationService: NotificationService) {}

  handleError(error: any): void {
    console.error('Error global:', error);
    
    // Enviar a servicio de logging
    this.logError(error);
    
    // Mostrar notificación al usuario
    this.notificationService.showError(
      'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
    );
  }

  private logError(error: any): void {
    // Implementar envío a servicio de logging
    // (Sentry, LogRocket, etc.)
  }
}

// app.module.ts
providers: [
  { provide: ErrorHandler, useClass: GlobalErrorHandler }
]
```

## 🔒 Seguridad

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline' fonts.googleapis.com;
               font-src 'self' fonts.gstatic.com;
               img-src 'self' data: https:;">
```

### Sanitización de HTML

```typescript
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  // ...
})
export class SafeHtmlComponent {
  constructor(private sanitizer: DomSanitizer) {}

  getSafeHtml(html: string) {
    return this.sanitizer.sanitize(SecurityContext.HTML, html);
  }
}
```

## 📱 Responsive Design

### Angular Flex Layout

```bash
npm install @angular/flex-layout
```

```html
<div fxLayout="row" fxLayout.xs="column" fxLayoutGap="16px">
  <div fxFlex="30" fxFlex.xs="100">Sidebar</div>
  <div fxFlex="70" fxFlex.xs="100">Content</div>
</div>
```

### Angular CDK Layout

```typescript
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  // ...
})
export class ResponsiveComponent {
  isHandset = this.breakpointObserver.isMatched('(max-width: 768px)');

  constructor(private breakpointObserver: BreakpointObserver) {}
}
```

## 🚀 Comandos de Producción

```bash
# Build optimizado para producción
ng build --prod --build-optimizer --vendor-chunk --common-chunk

# Análisis del bundle
ng build --prod --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json

# Testing en producción
ng build --prod && npx http-server dist/frontend -p 8080

# Deploy a Firebase Hosting
npm install -g firebase-tools
firebase init hosting
ng build --prod
firebase deploy

# Deploy a Netlify
ng build --prod
# Subir carpeta dist/frontend a Netlify
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error de Memory Heap:**
   ```bash
   node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --prod
   ```

2. **Error de Signals en Tests:**
   ```typescript
   // Usar TestBed.runInInjectionContext para signals
   TestBed.runInInjectionContext(() => {
     const result = computed(() => someSignal());
     expect(result()).toBe(expectedValue);
   });
   ```

3. **Error de Angular Material Theme:**
   ```scss
   // Asegurar importación correcta en styles.scss
   @import '~@angular/material/prebuilt-themes/indigo-pink.css';
   ```

## 📚 Recursos Adicionales

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [Angular Signals Guide](https://angular.io/guide/signals)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular Testing Guide](https://angular.io/guide/testing)

## 🏆 Best Practices

1. **Usar Signals para estado reactivo**
2. **Implementar OnPush change detection**
3. **Lazy loading de módulos y componentes**
4. **Standalone components cuando sea posible**
5. **Testing exhaustivo de componentes y servicios**
6. **Seguir Angular Style Guide**
7. **Usar TypeScript estricto**
8. **Implementar proper error handling**

## 👨‍💻 Desarrollado por

**Cristian Daniel Mendoza Hernández**
- Email: cristian.mendoza@example.com
- Rol: Admin del Sistema
