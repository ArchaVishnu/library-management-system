import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { UsersService } from '../../core/services/users.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  key: string;
}

@Component({
  selector: 'lms-header',
  imports: [
    NgTemplateOutlet,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatToolbarModule,
    TranslatePipe,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @ViewChild('sidenav') sidenav?: MatSidenav;

  readonly guestLinkKey = 'catalog';

  readonly isLoggedIn = computed(() => this.userService.isLoggedIn());
  readonly loggedInUser = computed(() => this.userService.userSignal());
  readonly isAdmin = computed(() => this.userService.isAdmin())

  readonly isMobile = signal<boolean>(false);
  readonly sidenavOpened = signal<boolean>(true);

  readonly navItems: NavItem[] = [
    {
      key: 'catalog',
      label: 'shared.header.bookCatalog',
      icon: 'menu_book',
      link: '/catalog'
    },
    {
      key: 'dashboard',
      label: 'shared.header.dashboard',
      icon: 'dashboard',
      link: '/dashboard'
    },
    {
      key: 'members',
      label: 'shared.borrow.members',
      icon: 'people',
      link: '/members'
    },
    {
      key: 'borrowing',
      label: 'shared.header.borrowing',
      icon: 'swap_horiz',
      link: '/borrow'
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly userService: UsersService,
    private readonly breakpointObserver: BreakpointObserver,
  ) {
    const isHandset = this.breakpointObserver.isMatched(Breakpoints.Handset);
    this.setResponsiveState(isHandset);

    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.setResponsiveState(result.matches));
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }

  onNavItemClick(): void {
    this.closeSidenavOnMobile();
  }
  visibleNavLinks() {
    if (this.isAdmin()) {return this.navItems;}
    return this.navItems.filter((link) => link.key === this.guestLinkKey);
  }

  login(): void {
    this.closeSidenavOnMobile();
    void this.router.navigate(['/login']);
  }

  onLogout(): void {
    this.closeSidenavOnMobile();
    this.userService.logoutUser();
  }

  private setResponsiveState(isMobile: boolean): void {
    this.isMobile.set(isMobile);
    this.sidenavOpened.set(!isMobile);
  }

  private closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }

}
