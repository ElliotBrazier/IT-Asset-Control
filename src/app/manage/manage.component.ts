import { ExportComponent } from './../export/export.component';
import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { MatTableDataSource, MatSort, MatDialogConfig, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MapComponent } from '../map/map.component';
import { QueueComponent } from '../queue/queue.component';
import { Globals } from '../global';
import { CookieService } from 'ngx-cookie-service';
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
/**
 * Here be yee olde code for sending things to inventory, decom, and changing things like location and general edit things like other components have
 */
export class ManageComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  myDate = new Date();
  constructor(private exp: ExportComponent, private db: AngularFirestore, private cookie: CookieService,
    private firebaseService: FirestoreService, private dialog: MatDialog, private map: MapComponent,
    private dialogRef: MatDialogRef<ManageComponent>, @Inject(MAT_DIALOG_DATA) data, private global: Globals) {

  }
  editMode = false;
  items;
  manageSource;
  coordArray = [];
  displayColumns = ['Name', 'Quantity', 'Location', 'User', 'Notes', 'Date', 'Actions'];//all columns to display, dictates the order

  applyFilter(filterValue: string) {
    this.manageSource.filter = filterValue.trim().toLowerCase();
  }
  ngOnInit() {
    this.firebaseService.getManage().subscribe(data => { this.items = data; this.manageSource = new MatTableDataSource(data); this.manageSource.sort = this.sort; });
  }
  /**
   * Send an item to the inventory from manage table
   * @param item the item to send to inventory
   */
  inventory(item) {
    var url = ""
    var qty = ""
    var matchID = ""
    let invRef = this.db.collection('Inventory'); //from the inventory
    let qry2 = invRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => {
        if (item.Name == doc.data().Name) {
          matchID = doc.id;//used later when looking for id
          qty = doc.data().Quantity
          url = doc.data().OrderURL
        }
      })
    }).then(() => {
      if (url != "" && url != null) {
        let colRef = this.db.collection('Manage'); //from the manage
        let qry = colRef.ref.get().then(snapshot => {
          snapshot.forEach(doc => {
            if (item.ID == doc.data().ID) { //match the document
            invRef.ref.get().then(invdoc => { 
              invdoc.forEach(invEntry => { //for each inventory entry
                  this.db.collection('Inventory').doc(matchID).update({
                    Name: item.Name,
                    Quantity: parseInt(qty) + 1 ,
                    Description: invEntry.data().Description,
                    LastRestock: invEntry.data().LastRestock,
                    LastRestockQuantity: invEntry.data().LastRestockQuantity,
                    OrderURL: invEntry.data().OrderURL,
                    Serial: invEntry.data().Serial
                  })
                
                })
              })
          
          
              if(doc.data().Quantity > 1){
                doc.ref.update({
                  Quantity: parseInt(doc.data().Quantity) -1
                })
              }
              else{
              doc.ref.delete()
              }
              //find item with the same name, get its url set url var to that
              // check if it exists
            }
          })
        })
      }
      else {
        var del = confirm('something went wrong\nDelete entry without sending to inventory?')
        if (del) {
          let colRef = this.db.collection('Manage'); //from the inventory
          let qry = colRef.ref.get().then(snapshot => {
            snapshot.forEach(doc => {
              if (item.ID == doc.data().ID) {
                doc.ref.delete()
              }
            })
          })
        }
      }
    })
  }
  /**
   * Sends X items from Manage into the Decom table. 
   * @param id item id
   * @param quantity quantity left
   */
  decommission(id, quantity) {
    var qty;
    qty = prompt("How many are you decommissioning", "1"); //prompt asking how many of the item to send to yeesus
    if (qty <= quantity) {
      if (qty != null && qty != 0 && qty > 0) { // if they entered a number over 0 and its less than or equal to the number remaining

        let colRef = this.db.collection('Manage'); // inv ref
        let decRef = this.db.collection('Decommission'); // decom ref
        let qry = colRef.ref.get().then(snapshot => {
          snapshot.forEach(doc => { //for each document in the collectoin
            if (doc.data().ID == id) { // find the matching entry
              decRef.add({ //add to the decom table
                Quantity: qty,
                Name: doc.data().Name,
                Serial: doc.data().Serial,
                Notes: doc.data().Notes,
                Location: doc.data().Location,
                User: this.cookie.get("User"),
                Date: this.myDate
              })
              if(quantity - qty <= 0) {
                colRef.doc(doc.id).delete() //delete the doc if decommissioning all or more
              }
              else if(quantity - qty > 0){ //update if they remove less than the total number available
                doc.ref.update({
                  Quantity: parseInt(doc.data().Quantity) - parseInt(qty)
                })
              }
            }
          })
        })
      }
    }
    else {
      alert("Enter a valid number")
    }
  }

  locationPicker(e) {
    const dialogConfig = new MatDialogConfig(); //options for dialog boxes
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    const dialogRef = this.dialog.open(MapComponent, dialogConfig); //open the map component
    dialogRef.afterClosed().subscribe(data => {
      if (data != null) { //if the componenet sent back some kind of data
        this.coordArray[e] = data //e is the index in the coord array that lines up with the queue entry 
      }
    })
  }
  exportToCSV(table) {
    this.exp.convertToCSV(table);
  }
  exportToJSON(table) {
    this.exp.convertToCSV(table);
  }

  saveChanges() {
    var allboxes = $('.editbox')
    var allboxesArr = $('.editbox').toArray()
    var badEntryFlag = false;
    var container = []
    allboxes.each(v => {
      var boxVal = $($('.editbox')[v]).val().toString()
      if ($($('.editbox')[v]).hasClass('notesbox') && !/^$|^[0-9A-Za-z\s\-\_]+$/.test(boxVal)) {
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px 2px red ')
      } else if ($($('.editbox')[v]).hasClass('notesbox')) {
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

      if ($($('.editbox')[v]).hasClass('datebox') && /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(boxVal)) {//im too tired to make my own regex for this, heres one i found on stackoverflow. Matches dates
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px red')
      } else if ($($('.editbox')[v]).hasClass('datebox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('locationbox') && $($('.editbox')[v]).val().toString().toLowerCase() == "pick a location") {
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px red')
      } else if ($($('.editbox')[v]).hasClass('locationbox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

    })
    if (!badEntryFlag) {
      console.log('we are full send boys')
      var ind = 0;

      for (let x = 0; x < allboxesArr.length; x += 5) {
        var temp = []
        temp.push($(allboxesArr[x]).val().toString()) //pushing name
        temp.push(parseInt($(allboxesArr[x + 1]).toString())) //quantity
        temp.push($(allboxesArr[x + 2]).val().toString()) //location
        temp.push($(allboxesArr[x + 3]).val().toString()) //notes
        temp.push($(allboxesArr[x + 4]).val().toString()) //date
        container.push(temp)
      }

      let colRef = this.db.collection('Manage'); //from the manage
      let docIDArr = []
      let qry = colRef.ref.get().then(snapshot => {
        snapshot.forEach(doc => { //for each doc. A row is a doc in this scenario, this was a huge realization https://i.ytimg.com/vi/LLpIMRowndg/maxresdefault.jpg
          snapshot.forEach(docID => {
            docIDArr.push(docID.data().ID)
          })
          for (let x = 0; x < container.length; x++) {
            if (docIDArr[x] == doc.data().ID) {
              doc.ref.update({
                Name: $(allboxesArr[ind]).val().toString(),
                Quantity: parseInt($(allboxesArr[ind + 1]).val().toString()),
                Location: $(allboxesArr[ind + 2]).text(),
                Notes: $(allboxesArr[ind + 3]).val().toString(),
                Date: firebase.firestore.Timestamp.fromDate(new Date(Date.parse(($(allboxesArr[ind + 4]).val().toString())))),
              })
            }
          }
          ind += 5 //go to next row
        })
      })
      alert('Manage updated!')
      this.editMode = false;
    }
  }
}
