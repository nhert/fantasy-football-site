import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { SimpleTableComponent } from "../simple-table/simple-table.component";
import { RouterModule } from '@angular/router';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";

@Component({
  selector: 'app-gm-list',
  standalone: true,
  templateUrl: './gm-list.component.html',
  styleUrl: './gm-list.component.css',
  imports: [MatProgressSpinnerModule, CommonModule, MatIconModule, MatTableModule, MatButtonModule, SimpleTableComponent, RouterModule, SimpleSpinnerComponent]
})
export class GmListComponent implements OnInit, OnDestroy {

  @ViewChild('spinner')
  spinner!: ElementRef;

  loading: boolean = true;
  columnHeaders: string[];
  dataSource: any[];

  constructor(private sleeperApi: SleeperApiService) { }

  ngOnDestroy(): void {
    this.loading = false;
  }

  // When component starts, immediately call API method.
  ngOnInit(): void {
    this.loading = true;
    this.load();
  }

  load() {
    // spinner on
    this.sleeperApi.getGmList().then(data => {
      this.loading = false;
      this.dataSource = data;
      this.columnHeaders = Object.keys(data[0]);
    });
  }
}