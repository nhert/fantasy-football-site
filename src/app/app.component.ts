import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { TopBarComponent } from "./top-bar/top-bar.component";
import { Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [NavMenuComponent]
})
export class AppComponent {
  title = "Welcome to the B3FL!"

  private storageKey = 'theme-preference';

  constructor(private titleService: Title, @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document) {
    this.titleService.setTitle(this.title);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.storageKey);
      const isDarkMode = savedTheme === 'dark';
      this.initTheme(isDarkMode);
    }
  }

  initTheme(isDarkMode): void {
    if (isPlatformBrowser(this.platformId)) {
      const rootElement = this.document.documentElement;
      if (isDarkMode) {
        rootElement.classList.add('dark-mode');
      } else {
        rootElement.classList.remove('dark-mode');
      }
    }
  }
}

