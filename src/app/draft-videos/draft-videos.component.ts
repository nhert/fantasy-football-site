import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'app-draft-videos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatCardModule],
  templateUrl: './draft-videos.component.html',
  styleUrl: './draft-videos.component.css'
})
export class DraftVideosComponent {
  selectValue: string; // year number ex: 2026, 2024, 2023 ...
  yearOptions: string[] = ['2026', '2024', '2023', '2022'];
  loading = false;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.loading = true;
    this.handleQueryParams();
  }

  handleQueryParams() {
    const paramYear = this.route.snapshot.queryParamMap.get('year');
    if (paramYear && this.yearOptions.includes(paramYear)) {
      this.selectValue = paramYear;
    }
    this.loading = false;
  }

}
