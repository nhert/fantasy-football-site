import { Component, input, ViewEncapsulation } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCalendarCellCssClasses, MatDatepickerModule } from "@angular/material/datepicker";
import { GameSchedule } from '../_Models/survivor.pickems.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pickems-survivor-calendar',
  imports: [MatDatepickerModule, MatNativeDateModule, CommonModule],
  templateUrl: './pickems-survivor-calendar.component.html',
  styleUrl: './pickems-survivor-calendar.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PickemsSurvivorCalendarComponent {
  selectedDate: Date | null = null;
  gameSchedule = input.required<GameSchedule[]>();

  selectedDateWeek: string;
  selectedDateDisplayTextEastern: string;
  selectedDateDisplayTextLocal: string;
  specialDateSelected: boolean = false;

  shortDateEastern = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/New_York",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  longDateEastern = new Intl.DateTimeFormat("default", {
    timeZone: "America/New_York",
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longGeneric'
  });

  longDateLocal = new Intl.DateTimeFormat("default", {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longGeneric'
  });

  // Dictionary of special dates with their corresponding label markers
  specialDates: any[] = [];

  ngOnInit(): void {
    let week = 1;
    for (var scheduleEntry of this.gameSchedule()) {
      this.addSpecialDate(scheduleEntry.cutoff_datetime, 'Deadline', week);
      this.addSpecialDate(scheduleEntry.start_datetime, 'Start', week);
      week++;
    }
    // console.log(this.specialDates);
  }

  addSpecialDate(dateIsoUtc: string, label: string, week: number) {
    const dateObject = new Date(dateIsoUtc);

    // using swedish locale formatting since it natively formats like an ISO string
    const easternTimeDeadline: string = this.shortDateEastern.format(dateObject);
    const easternTimeDeadlineLong: string = this.longDateEastern.format(dateObject);
    const localTimeDeadlineLong: string = this.longDateLocal.format(dateObject);

    this.specialDates.push({
      datetime: easternTimeDeadline,
      scheduletime_eastTZ: easternTimeDeadlineLong,
      scheduletime_localTZ: localTimeDeadlineLong,
      label: label,
      week: week
    });
  }

  // Function passed to [dateClass] binding
  dateClass() {
    return (date: Date): MatCalendarCellCssClasses => {
      const specialDate = this.getSpecialDate(date);
      // If a label matches, return a dynamic class based on the event type
      return specialDate ? `has-label label-${specialDate.label.toLowerCase()} label-${specialDate.label.toLowerCase()}-wk${specialDate.week}` : '';
    };
  }

  onDateSelectChanged() {
    const specialDate = this.getSpecialDate(this.selectedDate);
    if (specialDate) {
      this.selectedDateWeek = `<strong>Week ${specialDate.week} ${specialDate.label}</strong>`;
      this.selectedDateDisplayTextEastern = `${specialDate.scheduletime_eastTZ}`;
      this.selectedDateDisplayTextLocal = `${specialDate.scheduletime_localTZ}`;
      this.specialDateSelected = true;
    } else {
      this.specialDateSelected = false;
    }
  }

  getSpecialDate(date: Date): any {
    const dateString = date.toISOString().slice(0, 10); // Get calendar date like: 2026-09-09
    const specialDate = this.specialDates.find(date => date.datetime == dateString);
    return specialDate;
  }
}

/*
MOCKUP OF HOW TO SEND CALENDAR TASKS TO USER BY GENERATING AN .ICS FILE
*******
npm install ics file-saver
npm install --save-dev @types/file-saver
*******

import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import * as ics from 'ics';

interface PreciseGameDeadline {
  id: string;
  title: string;
  description: string;
  dateTime: string; // Format expected: "YYYY-MM-DD HH:mm" (e.g., "2026-08-15 18:30")
}

@Component({
  selector: 'app-game-schedule',
  template: `
    <button (click)="downloadCalendarFile()">
      Sync Reminders to My Calendar
    </button>
  `
})
export class GameScheduleComponent {
  
  // Sample data simulating your local JSON payload file
  gameDeadlines: PreciseGameDeadline[] = [
    {
      id: 'raid-099',
      title: '⚔️ Game Deadline: Final Raid Quest',
      description: 'Complete the dungeon pool reset before server lock!',
      dateTime: '2026-08-15 18:30' // 6:30 PM
    },
    {
      id: 'pvp-102',
      title: '🏆 Season 4 Ranked Closes',
      description: 'Last call to secure tournament placement tiers.',
      dateTime: '2026-08-30 23:59' // 11:59 PM
    }
  ];

  downloadCalendarFile() {
    const calendarEvents: ics.EventAttributes[] = this.gameDeadlines.map(deadline => {
      // Create a native Date object using your timeline snapshot string
      const dateObj = new Date(deadline.dateTime.replace(' ', 'T')); 

      return {
        // [Year, Month (1-12), Day, Hour (0-23), Minute]
        start: [
          dateObj.getFullYear(), 
          dateObj.getMonth() + 1, 
          dateObj.getDate(), 
          dateObj.getHours(), 
          dateObj.getMinutes()
        ],
        // Set standard deadline entry block to last 15 minutes on the interface grid
        duration: { minutes: 15 }, 
        title: deadline.title,
        description: deadline.description,
        uid: `${deadline.id}@yourgame.com`,
        status: 'CONFIRMED',
        
        // This injects the 1-hour alarm configuration directly into the event metadata
        alarms: [
          {
            action: 'audio',
            trigger: { 
              hours: 1, 
              minutes: 0, 
              before: true // Fires push alert 1 hour prior to the start parameters
            }
          }
        ]
      };
    });

    // Create the global multi-event file array string content
    ics.createEvents(calendarEvents, (error, value) => {
      if (error) {
        console.error('Error generating calendar file:', error);
        return;
      }

      // Feed string text payload buffer into the blob saver
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      saveAs(blob, 'game_reminders.ics');
    });
  }
}
*/
