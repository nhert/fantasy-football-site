import { Component, inject, input } from '@angular/core';
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { GameUser } from '../_Models/survivor.pickems.models';
import { Constants } from '../_Tools/Constants';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pickems-survivor-image-uploader',
  imports: [CommonModule],
  templateUrl: './pickems-survivor-image-uploader.component.html',
  styleUrl: './pickems-survivor-image-uploader.component.css'
})
export class PickemsSurvivorImageUploaderComponent {
  selectedFile: File | null = null;

  currentUser = input.required<GameUser>();

  avatarUploadResponse: string = "";
  avatarUploadSuccess: boolean = false;
  isUploading: boolean;

  constructor(private gameDb: SurvivorPickemsApiService) { }

  ngAfterViewInit(): void {
    this.avatarUploadResponse = "";
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] ?? null;
  }

  onUpload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('image', this.selectedFile, this.selectedFile.name);

    // Do not manually set 'Content-Type' header when using FormData
    this.gameDb.uploadAvatar(this.currentUser().email, formData)
      .subscribe({
        next: () => this.setUploadResponse('Upload Success', 'Your avatar has been uploaded!', true),
        error: (error) => this.setUploadResponse('Upload Failure', error, false)
      });
  }

  setUploadResponse(title, message, success) {
    this.avatarUploadSuccess = success;
    this.avatarUploadResponse = title + " - " + message;
  }

  get avatarUrl() {
    return Constants.PICKEMS_SURVIVOR_AVATAR_FOLDER + this.currentUser().email + ".png";
  }
}
