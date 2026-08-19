import { Component, input } from '@angular/core';
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
  currentUser = input.required<GameUser>();

  selectedFile: File | null = null;
  selectedFileLocalUrl: string;
  avatarUploadResponse: string = "";

  showCurSelectedImage: boolean = false;
  avatarUploadSuccess: boolean = false;
  isUploading: boolean;

  constructor(private gameDb: SurvivorPickemsApiService) { }

  refresh() {
    this.avatarUploadResponse = "";
    this.isUploading = false;
    this.selectedFile = null;
    this.selectedFileLocalUrl = "";
    this.showCurSelectedImage = false;
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file.size > Constants.PICKEMS_SURVIVOR_AVATAR_MAX_FILESIZE) {
        this.setUploadResponse('Upload Failure', "File size larger than 5MB", false);
        input.value = null; // Reset the input field
        return;
      }

      // Convert file to a previewable URL
      this.selectedFileLocalUrl = URL.createObjectURL(file);
      this.showCurSelectedImage = true;
    }

    this.selectedFile = input.files[0] ?? null;
  }

  onUpload() {
    if (!this.selectedFile) return;

    this.isUploading = true;

    const formData = new FormData();
    formData.append('image', this.selectedFile, this.selectedFile.name);

    // Do not manually set 'Content-Type' header when using FormData
    this.gameDb.uploadAvatar(this.currentUser().email, formData)
      .subscribe({
        next: () => { this.setUploadResponse('Upload Success', 'Your avatar has been uploaded!', true); this.isUploading = false; },
        error: (error) => { this.setUploadResponse('Upload Failure', error.message, false); this.isUploading = false; }
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
