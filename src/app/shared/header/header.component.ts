import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import {
  ConfigurableFocusTrapFactory,
  FocusTrapFactory,
} from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'lms-header',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    RouterLink,
    RouterLinkActive,
],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: [
    { provide: FocusTrapFactory, useClass: ConfigurableFocusTrapFactory },
  ],
})
export class HeaderComponent {
  navItems = [
    { label: 'Dashboard', icon: 'dashboard',link:'/dashboard'  },
    { label: 'Book Catalog', icon: 'menu_book',link:'/catalog' },
    { label: 'Members', icon: 'people',link:'/members' },
    { label: 'Borrowing', icon: 'swap_horiz',link:'/borrow' }
  ];
}
