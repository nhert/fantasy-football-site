import { Component } from '@angular/core';
import { NgxExtendedPdfViewerComponent, NgxExtendedPdfViewerService, NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-manifesto',
  standalone: true,
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './manifesto.component.html',
  styleUrl: './manifesto.component.css'
})
export class ManifestoComponent {
  // src = '/assets/documents/B3FL_Manifesto.pdf';
  src = 'https://www.clickdimensions.com/links/TestPDFfile.pdf';
}
