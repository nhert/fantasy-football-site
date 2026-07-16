import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'b3fl-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  isDarkMode: boolean = false;
  private storageKey = 'theme-preference';

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.storageKey);
      this.isDarkMode = savedTheme === 'dark';
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, this.isDarkMode ? 'dark' : 'light');
    }
    this.applyTheme();
  }

  applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const rootElement = this.document.documentElement;
      if (this.isDarkMode) {
        rootElement.classList.add('dark-mode');
      } else {
        rootElement.classList.remove('dark-mode');
      }
    }
  }

}
