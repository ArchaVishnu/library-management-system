import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LoginDetails, LoginFormBuilder } from '../../core/models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'lms-login',
  imports: [
    CommonModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    TranslatePipe,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup<LoginFormBuilder>;
  hide = signal<boolean>(true)
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private userService: UsersService
  ) { }
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
      password: this.fb.control('', { validators: [Validators.required] })
    });
  }
  public onLoginSuccess(): void {
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl') ||
      '/dashboard';
    this.router.navigateByUrl(returnUrl);
  }

  logIn = () => {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const data = this.loginForm.getRawValue() as LoginDetails;
    this.userService.loginUser(data).subscribe({
      next: (response) => {
        // save the data to ls,
       this.onLoginSuccess()

      }
    })
  }

}
