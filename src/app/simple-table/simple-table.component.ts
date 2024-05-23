import { CommonModule, KeyValue } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Utils } from '../_Tools/Utils';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'simple-table',
  standalone: true,
  imports: [CommonModule, MatButton],
  templateUrl: './simple-table.component.html',
  styleUrl: './simple-table.component.css'
})
export class SimpleTableComponent implements OnInit {
  // Source of object data
  @Input('dataSource') dataSource!: any[];
  // Header labels
  @Input('columnHeaders') columnHeaders!: string[];
  // Border type = all, row, none/undefined
  @Input('borderType') borderType: string;
  // Px widths of cells = [10, 20, 30, 40, ... ]
  @Input('columnMinWidths') columnMinWidths: number[];
  // Whether to show button to download CSV below table
  @Input('showCsvExport') showCsvExport: boolean;
  // Custom filename for csv downloads
  @Input('csvFilename') csvFilename: string;

  className: string;

  ngOnInit(): void {
    this.className = "simple-table " + this.borderType + "-borders";
  }

  objectValues(obj) {
    return Object.values(obj);
  }

  public getWidth() {

  }

  exportCsv() {
    if (this.showCsvExport && this.dataSource && this.dataSource.length > 0) {
      console.log("Generating CSV ...");
      var today = new Date();
      var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

      let filename = this.csvFilename ? this.csvFilename : "B3FL";
      filename += "_" + date;
      Utils.generateCsvFile(this.dataSource, filename);
    }
  }

  colWidthStyle(colIndex) {
    if (this.columnMinWidths && this.columnMinWidths.length > 0 && colIndex < this.columnMinWidths.length) {
      return "min-width: " + this.columnMinWidths[colIndex] + "px;";
    }
    return "min-width: 10px";
  }
}
