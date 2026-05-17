import { Component } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
@Component({
  selector: 'lms-access-denied',
  imports: [MatIconModule, RouterModule, MatButtonModule, TranslatePipe],

  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss',
})
export class AccessDeniedComponent {
  constructor(private router: Router) { }

  goBack = () => this.router.navigate(['/catalog'])
}
