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
