import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lms-not-found',
  imports: [MatIconModule, CommonModule, RouterModule, MatButtonModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  constructor(private location: Location) { }

  goBack(): void {
    this.location.back();
  }
}
