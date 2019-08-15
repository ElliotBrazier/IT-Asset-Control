import { ExportComponent } from './../export/export.component';
import { Component, OnInit, ViewChild, ɵConsole } from '@angular/core';
import { AngularFireDatabase, AngularFireObject, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { FirestoreService } from '../firestore.service';
import { Items } from './Items';
import { MatTableModule, MatDialog, MatDialogConfig } from '@angular/material'
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material';
import { DataSource } from '@angular/cdk/table';
import { LocationService } from '../location.service';
import { CookieService } from 'ngx-cookie-service';
import { AngularFirestore } from 'angularfire2/firestore';
import { KeypadComponent } from '../pin/keypad/keypad.component';
import { PinComponent } from '../pin/pin.component';
import { Timestamp } from 'rxjs/internal/operators/timestamp';
import * as firebase from 'firebase';

@Component({
  selector: 'inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],

})
/**
 * Does all the inventory things. Scales color in qty, mass delete code's here, send to queue and decom,
 * restock button code. 
 */
export class InventoryComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  items: Items[];
  myDate = new Date();
  v = true;
  itemsource;
  editMode = false;
  displayColumns = ['Name', 'Quantity', 'Description', 'LastRestock', 'LastRestockQuantity', 'Serial', 'Actions']; //all columns to display, dictates the order

  constructor(private exp: ExportComponent, private pin: PinComponent, private db: AngularFirestore, public firebaseService: FirestoreService,
     private dialog: MatDialog, private loc: LocationService, private cookie: CookieService) { }

  ngOnInit() {
    this.firebaseService.getInventory().subscribe(data => { this.items = data; this.itemsource = new MatTableDataSource(data); this.itemsource.sort = this.sort; });
    
  }
/**
 * Gives a shade of a gradient based on the ratio of quantity left to last restocked at
 * @param qty Current quantity
 * @param last Last restock qty
 */
  scaleColor(qty: number, last: number) {

    var percent = (qty / last) * 100 
    if (percent >= 85) {
      return "#00ff00"
    }
    if (percent >= 70) {
      return "#6fff00"
    }
    if (percent >= 55) {
      return "#bcff00"
    }
    if (percent >= 40) {
      return "#fff700"
    }
    if (percent >= 25) {
      return "#ffc400"
    }
    if (percent >= 10) {
      return "#ff7700"
    }
    return "#ff0000" //red if all else fails
  }
  /**
   * Deletes the inventory table
   */
  invDelete() {
    let colRef = this.db.collection('Inventory'); // inventory reference
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => { //for each document in the collectoin
        this.db.collection('Inventory').doc(doc.ref.id).delete();
      })
    })
    alert("Cleared Inventory")
  }
  /**
   * Deletes the manage table
   */
  mngDelete() {
    let colRef = this.db.collection('Manage'); // manage reference
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => { //for each document in the collectoin
        this.db.collection('Manage').doc(doc.ref.id).delete();
      })
    })
    alert("Cleared Manage")
  }
  /**
   * Deletes the queue table
   */
  queDelete() {
    let colRef = this.db.collection('Queue'); // queue reference
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => { //for each document in the collectoin
        this.db.collection('Queue').doc(doc.ref.id).delete();
      })
    })
    alert("Cleared Queue")
  }
/**
   * Deletes the decom table
   */
  decDelete() {
    let colRef = this.db.collection('Decommission'); // decom reference
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => { //for each document in the collectoin
        this.db.collection('Decommission').doc(doc.ref.id).delete();
      })
    })
    alert("Cleared Decommissioned items")
  }
  /**
   * Brings up keypad for validating, prompts for a table to delete 
   */
  massDelete($event) {
    if($event.ctrlKey){
      var pins = []
      var users = []
    var enteredPin = ""
    const dialogConfig = new MatDialogConfig(); //options for dialog boxes
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true; //so they can't exit
    const dialogRef = this.dialog.open(KeypadComponent, dialogConfig); //open the keypad 
    dialogRef.afterClosed().subscribe(data => {
      let colRef = this.db.collection('Pins'); //from the pins
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => {
        users.push(doc.data().Name); //fill up the arrays with names
        pins.push(doc.data().Pin); //fill up array with pin
      })
    }).then(()=>{

      if (pins.includes(data)) {
        var table = prompt("Delete ALL documents from which table?")
        switch (table) {
          case 'Inventory':
            this.invDelete()
            break;
            case 'Manage':
              this.mngDelete()
              break;
              case 'Queue':
                this.queDelete()
                break;
                case 'Decommission':
                  this.decDelete()
                  break;
                }
              }
            })
    })
  }
}
  /**
   * Sends the item into the queue, doesn't delete it from the inventory
   * @param name item name
   * @param qty item quantity
   * @param serial item serial number
   */
  queueItem(name: string, qty: number, serial: string): any {
    var newID = 0;
    let colRef = this.db.collection('Queue');
    let qry = colRef.ref.orderBy('ID', 'asc').get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          if (doc.data().ID >= newID) {
            newID = parseInt(doc.data().ID) + 1;
            console.log(newID)
          }
        });
      }).then(() => {
        console.log(newID)
        this.firebaseService.queueEntry(name, qty, this.cookie.get("User"), newID, serial);
      })

  }
  /**
   * Decommissions X of an item in the inventory
   * @param serial serial number
   * @param quantityLeft the quantity of the item
   */
  decommission(serial, quantityLeft) {
    var qty;
    qty = prompt("How many are you decommissioning", "1"); //prompt asking how many of the item to send to yeesus
    if (qty != null && qty != 0 && qty > 0 && qty <= quantityLeft) { // if they entered a number over 0 and its less than or equal to the number remaining
      var notes = prompt("Notes about the decommission")
      if (notes == null) {
        notes = ""
      }
      let colRef = this.db.collection('Inventory'); // inv ref
      let decRef = this.db.collection('Decommission'); // decom ref
      let qry = colRef.ref.get().then(snapshot => {
        snapshot.forEach(doc => { //for each document in the collectoin
          if (doc.data().Serial == serial) { // find the matching entry
            colRef.doc(doc.id).update({ //update the quantity
              Quantity: quantityLeft - qty
            })
            decRef.add({ //add to the decom table
              Quantity: qty,
              Description: doc.data().Description,
              Name: doc.data().Name,
              Serial: doc.data().Serial,
              Notes: notes,
              Location: "N/A", //came from inventory
              User: this.cookie.get("User"),
              Date: this.myDate
            })
          }
        })
      })
    }
  }
  /**
   * Opens a new tab of the URL set for the items restock and updates the inventory quantity accordingly
   * @param e event object
   * @param serial item serial object
   */
  restock(e, serial) {
    var s: string = (e.currentTarget.attributes['id'].value);
    var a = s.split(' ');
    var qty;
    qty = prompt("How many are you buying", "1");
    if (qty != null && qty != 0 && qty > 0) {
      qty = parseInt(qty); // gets number from box
      var url = a[0];
      var name = a[1];
      var mydate = new Date();
      let colRef = this.db.collection('Inventory');
      let qry = colRef.ref.get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            if (doc.data().Serial == serial) {

              colRef.doc(doc.id).update({
                LastRestockQuantity: qty,
                LastRestock: mydate,
                Quantity: (parseInt(qty) + parseInt(doc.data().Quantity))
              })
            }
          })
        })

      window.open(url)
    }
    else if (qty != null) { //alert box returns null on cancel
      alert("Bad entry try again sir")
    }
  }
 
/**
 * Deletes an item from the inventory
 * @param item item that you're deleting
 */
  deleteRow(item) {
    //  console.log(x)
    var allboxesArr = $('.editbox').toArray()
    let colRef = this.db.collection('Inventory'); //from the inventory
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => {
        if (doc.data().Name == item.Name && doc.data().Serial == item.Serial && doc.data().Quantity == item.Quantity && doc.data().Description == item.Description && doc.data().LastRestock == item.LastRestock && doc.data().LastRestockQuantity == item.LastRestockQuantity) {
          doc.ref.delete()
        }
      })
    })
  }

  exportToCSV(table){
    this.exp.convertToCSV(table);
  }

  exportToJSON(table){
    this.exp.convertToJSON(table);
  }

  applyFilter(filterValue: string) {
    this.itemsource.filter = filterValue.trim().toLowerCase();
  }
    /**
   * Saves changes made in the edit mode. Checks all textboxes for valid entries, then updates data table
   */
  saveChanges() {
    var allboxes = $('.editbox')
    var allboxesArr = $('.editbox').toArray()
    var badEntryFlag = false;
    var container = []
    allboxes.each(v => { //for each text box
      var boxVal = $($('.editbox')[v]).val().toString() //get the value of the text box in at v position
      if ($($('.editbox')[v]).hasClass('descriptionbox') && !/^$|^[0-9A-Za-z\s\-\_\/]+$/.test(boxVal)) {
        badEntryFlag = true;  //if it doesnt pass the test flag it and make it red
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px 2px red ')
      } else if ($($('.editbox')[v]).hasClass('descriptionbox')){//otherwise set the box shadow to nothing
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('serialbox') && (!/^$|^[0-9A-Za-z\s\-\_\/]+$/.test(boxVal))) {//lol, serial box
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px 2px red ')
      } else if ($($('.editbox')[v]).hasClass('serialbox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('namebox') && (!/^[0-9A-Za-z\s\-\_]+$/.test(boxVal) || boxVal.trim() == "")) {//if we're talking to the name box, and the string is contains non-alphanumeric chars, and its empty
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px red')
      } else if ($($('.editbox')[v]).hasClass('namebox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('quantitybox') && !/^[0-9]+$/.test(boxVal)) {// quantity must be a number and nothing else
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px 2px red ')
      } else if ($($('.editbox')[v]).hasClass('quantitybox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('lastrestockquantitybox') && !/^[0-9]+$/.test(boxVal)) {// quantity must be a number and nothing else
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px 2px red ')
      } else if ($($('.editbox')[v]).hasClass('lastrestockquantitybox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('lastrestockbox') && /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(boxVal)) {//im too tired to make my own regex for this, heres one i found on stackoverflow. Matches dates
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px red')
      } else if ($($('.editbox')[v]).hasClass('lastrestockbox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

    })
    if (!badEntryFlag) { //if no entries were bad
      var ind = 0;

      for (let x = 0; x < allboxesArr.length; x += 6) {//for every row
        var temp = [] //for holding text box values
        temp.push($(allboxesArr[x]).val().toString())
        temp.push(parseInt($(allboxesArr[x + 1]).toString()))
        temp.push($(allboxesArr[x + 2]).val().toString())
        temp.push($(allboxesArr[x + 3]).val().toString())
        temp.push(parseInt($(allboxesArr[x + 4]).val().toString()))
        temp.push($(allboxesArr[x + 5]).val().toString())

        container.push(temp) //add array to array for l8r
      }

      let colRef = this.db.collection('Inventory'); //from the inventory
      let qry = colRef.ref.get().then(snapshot => {
        snapshot.forEach(doc => { //for each doc. A row is a doc in this scenario, this was a huge realization https://i.ytimg.com/vi/LLpIMRowndg/maxresdefault.jpg
          for (let x = 0; x < container.length; x++) {
            if (container[x][0] == doc.data().Name) {//if the containers document has the same name as the snapshot doc
              doc.ref.update({
                Name: $(allboxesArr[ind]).val().toString(),
                Quantity: parseInt($(allboxesArr[ind + 1]).val().toString()),
                Description: $(allboxesArr[ind + 2]).val().toString(),
                LastRestock: firebase.firestore.Timestamp.fromDate(new Date(Date.parse(($(allboxesArr[ind + 3]).val().toString())))),
                LastRestockQuantity: parseInt($(allboxesArr[ind + 4]).val().toString()),
                Serial: $(allboxesArr[ind + 5]).val().toString()

              })
            }
          }
          ind += 6 //go to next row
        })
      })
      alert('Inventory updated!')
      this.editMode = false;
  
    }
  }
}
