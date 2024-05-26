import { Component } from '@angular/core';
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { TopBarComponent } from "./top-bar/top-bar.component";
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [NavMenuComponent, TopBarComponent]
})
export class AppComponent {
  title = "Welcome to the B3FL!"

  constructor(private titleService: Title) {
    this.titleService.setTitle(this.title);

  }
}

