import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule
  ],
  template: `
    <div class="register-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Регистрация на нов потребител</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="register()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Потребителско име</mat-label>
              <input matInput formControlName="username" type="text" required>
              <mat-error *ngIf="form.get('username')?.hasError('required')">
                Потребителското име е задължително
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пълно име</mat-label>
              <input matInput formControlName="fullName" type="text" required>
              <mat-error *ngIf="form.get('fullName')?.hasError('required')">
                Пълното име е задължително
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Парола</mat-label>
              <input matInput formControlName="password" type="password" required>
              <mat-error *ngIf="form.get('password')?.hasError('required')">
                Паролата е задължителна
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Роля</mat-label>
              <mat-select formControlName="role" required>
                <mat-option value="ADMIN">Администратор</mat-option>
                <mat-option value="USER">Потребител</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('role')?.hasError('required')">
                Ролята е задължителна
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="form.invalid" class="full-width">
              Регистрация
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    mat-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }

    mat-card-header {
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    button[type="submit"] {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
    }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      fullName: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  register() {
    if (this.form.valid) {
      this.authService.register(this.form.value).subscribe({
        next: () => {
          this.snackBar.open('Потребителят е регистриран успешно', 'OK', {
            duration: 3000
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          this.snackBar.open(
            error.error || 'Възникна грешка при регистрацията',
            'OK',
            { duration: 3000 }
          );
        }
      });
    }
  }
} 