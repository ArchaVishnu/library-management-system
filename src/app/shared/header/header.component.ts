import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';


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
    MatMenuModule
],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  isLoggedIn = signal<boolean>(false);

  // User Data
  user = {
    name: 'Alex Smith',
    role: 'Senior Librarian',
    avatar: 'account_circle'
  };
  
  navItems = [
    { label: 'Dashboard', icon: 'dashboard',link:'/dashboard'  },
    { label: 'Book Catalog', icon: 'menu_book',link:'/catalog' },
    { label: 'Members', icon: 'people',link:'/members' },
    { label: 'Borrowing', icon: 'swap_horiz',link:'/borrow' }
  ];
  logout() {
    this.isLoggedIn.set(!this.isLoggedIn())
  }

  login() {
       this.isLoggedIn.set(!this.isLoggedIn())

  }
  
}
