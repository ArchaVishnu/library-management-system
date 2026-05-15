import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { UsersService } from '../../core/services/users.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

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
    MatMenuModule,
    TranslatePipe
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  constructor(private router: Router, private userService: UsersService) { }

  isLoggedIn = computed(() => this.userService.isLoggedIn())
  loggedInUser = computed(() => this.userService.userSignal())
  navItems = [
    { label: 'shared.header.dashboard', icon: 'dashboard', link: '/dashboard' },
    { label: 'shared.header.bookCatalog', icon: 'menu_book', link: '/catalog' },
    { label: 'shared.borrow.members', icon: 'people', link: '/members' },
    { label: 'shared.header.borrowing', icon: 'swap_horiz', link: '/borrow' },
  ];
  logout = () => this.userService.logoutUser();
  login = () => this.router.navigate(['/login']);

}
