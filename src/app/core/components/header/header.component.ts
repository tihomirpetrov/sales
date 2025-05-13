import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Sales System</span>
      
      <nav class="nav-links">
        <a mat-button routerLink="/dashboard" routerLinkActive="active">
          <mat-icon>dashboard</mat-icon>
          Табло
        </a>
        <a mat-button routerLink="/customers" routerLinkActive="active">
          <mat-icon>people</mat-icon>
          Клиенти
        </a>
        <a mat-button routerLink="/products" routerLinkActive="active">
          <mat-icon>inventory_2</mat-icon>
          Продукти
        </a>
        <a mat-button routerLink="/sales" routerLinkActive="active">
          <mat-icon>shopping_cart</mat-icon>
          Продажби
        </a>
      </nav>

      <span class="spacer"></span>

      <!-- Debug info -->
      <span *ngIf="authService.isAdmin()" style="color: white; margin-right: 16px;">
        Admin Mode
      </span>

      <ng-container *ngIf="authService.isAdmin()">
        <button mat-button [matMenuTriggerFor]="adminMenu">
          <mat-icon>settings</mat-icon>
          Администрация
        </button>
        <mat-menu #adminMenu="matMenu">
          <button mat-menu-item routerLink="/register">
            <mat-icon>person_add</mat-icon>
            <span>Регистрация на потребител</span>
          </button>
        </mat-menu>
      </ng-container>
      
      <button mat-button (click)="logout()">
        <mat-icon>exit_to_app</mat-icon>
        Изход
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }

    .nav-links {
      margin-left: 20px;
    }

    .nav-links a {
      margin: 0 8px;
    }

    .nav-links a.active {
      background: rgba(255, 255, 255, 0.1);
    }

    mat-icon {
      margin-right: 4px;
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Debug info
    console.log('Is admin:', this.authService.isAdmin());
  }

  logout() {
    this.authService.logout();
  }
} 