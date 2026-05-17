import { Component } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'lms-not-found',
  imports: [MatIconModule, RouterModule, MatButtonModule, TranslatePipe],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  constructor(private router: Router) { }

  goBack = () => this.router.navigate(['/catalog'])
}
