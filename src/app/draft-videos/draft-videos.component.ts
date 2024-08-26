import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-draft-videos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './draft-videos.component.html',
  styleUrl: './draft-videos.component.css'
})
export class DraftVideosComponent {
  selectValue: string; // has league id
}
