import { Component } from '@angular/core';

@Component({
  selector: 'app-manifesto',
  standalone: true,
  imports: [],
  templateUrl: './manifesto.component.html',
  styleUrl: './manifesto.component.css'
})
export class ManifestoComponent {
  // src = '/assets/documents/B3FL_Manifesto.pdf';
  src = 'https://www.clickdimensions.com/links/TestPDFfile.pdf';
}