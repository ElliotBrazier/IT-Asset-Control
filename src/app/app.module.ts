import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ElementRef } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { DatePipe } from '@angular/common';
import { InventoryComponent } from './inventory/inventory.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatButtonModule, MatCheckboxModule, MatInputModule, MatCell,} from '@angular/material';
//Angular Material Components
import * as firebase from 'firebase/app';
// You don't need to import firebase/app either since it's being imported above
import 'firebase/auth';
import 'firebase/firestore';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import { FirestoreService } from './firestore.service';
import { AddComponent } from './add/add.component';
import { ScanComponent } from './scan/scan.component';
import {ActivatedRoute} from '@angular/router';
import {RouterModule} from '@angular/router';
import { QueueComponent } from './queue/queue.component';
import { MapComponent } from './map/map.component';
import { OfficesComponent } from './map/offices/offices.component';
import { Production1Component } from './map/production1/production1.component';
import { Production2Component } from './map/production2/production2.component';
import { ShippingComponent } from './map/shipping/shipping.component';
import { Globals } from './global';
import { PinComponent } from './pin/pin.component';
import { DecommissionComponent } from './decommission/decommission.component';
import { KeypadComponent } from './pin/keypad/keypad.component';
import { CookieService } from 'ngx-cookie-service';
//import {ChangeDetectorRef} from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ManageComponent } from './manage/manage.component';
import { MaphilightModule } from 'ng-maphilight';
import { ExportComponent } from './export/export.component';
import 'hammerjs';
import { ChangepinComponent } from './pin/changepin/changepin.component';

@NgModule({
  declarations: [
    ExportComponent,
    AppComponent,
    InventoryComponent,
    AddComponent,
    ScanComponent,
    QueueComponent,
    MapComponent,
    OfficesComponent,
    Production1Component,
    Production2Component,
    ShippingComponent,
    PinComponent,
    DecommissionComponent,
    KeypadComponent,
    ManageComponent,
    ExportComponent,
    ChangepinComponent,

  ],
  imports: [
    FormsModule, ReactiveFormsModule,
    MaphilightModule,
    FormsModule,
    RouterModule.forRoot([]),
    BrowserModule,
    BrowserAnimationsModule,
    MatCheckboxModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatStepperModule,
    MatTabsModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    AngularFireModule.initializeApp(environment.firebase),
 	AngularFirestoreModule,
      
  ],
  entryComponents:[MapComponent, OfficesComponent, Production1Component,Production2Component, ShippingComponent, KeypadComponent,ChangepinComponent],
  exports: [MatButtonModule, MatCheckboxModule, MatCardModule,MatTableModule],
  providers: [AppComponent, ChangepinComponent, ExportComponent, PinComponent, DatePipe, CookieService, FirestoreService, AddComponent, MapComponent,QueueComponent ,Production1Component,{provide: MatDialogRef, useValue: {}}, { provide: MAT_DIALOG_DATA, useValue: {} }, Globals, KeypadComponent],
  bootstrap: [AppComponent ]
})
export class AppModule { }
