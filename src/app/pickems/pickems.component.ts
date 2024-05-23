import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from '../_Tools/Constants';

@Component({
  selector: 'app-pickems',
  standalone: true,
  imports: [],
  templateUrl: './pickems.component.html',
  styleUrl: './pickems.component.css'
})
export class PickemsComponent implements OnInit {

  ngOnInit(): void {
    window.location.href = Constants.PICKEMS_URL;
  }

}
