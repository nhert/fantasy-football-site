import { Component, ViewEncapsulation } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCalendarCellCssClasses, MatDatepickerModule } from "@angular/material/datepicker";

@Component({
  selector: 'pickems-survivor-calendar',
  imports: [MatDatepickerModule, MatNativeDateModule],
  templateUrl: './pickems-survivor-calendar.component.html',
  styleUrl: './pickems-survivor-calendar.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PickemsSurvivorCalendarComponent {
  selectedDate: Date | null = null;

  // Dictionary of special dates with their corresponding label markers
  specialDates: { [key: string]: string } = {
    '2026-07-04': 'Holiday',
    '2026-07-15': 'Meeting',
    '2026-07-22': 'Deadline'
  };

  // Function passed to [dateClass] binding
  dateClass() {
    return (date: Date): MatCalendarCellCssClasses => {
      // Format date to local YYYY-MM-DD to match dictionary keys
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      const dateString = localDate.toISOString().split('T')[0];

      const label = this.specialDates[dateString];

      // If a label matches, return a dynamic class based on the event type
      return label ? `has-label label-${label.toLowerCase()}` : '';
    };
  }

}
