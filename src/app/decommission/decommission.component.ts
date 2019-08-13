import { AngularFirestore } from 'angularfire2/firestore';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { MatTableDataSource, MatSort, MatDialogConfig, MatDialog } from '@angular/material';
import { CookieService } from 'ngx-cookie-service';
import { ExportComponent } from '../export/export.component';
import * as firebase from 'firebase';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-decommission',
  templateUrl: './decommission.component.html',
  styleUrls: ['./decommission.component.css']
})
/**
 * doesnt do anything special other than recommission items
 */
export class DecommissionComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  editMode = false;
  items;
  decomSource;
  coordArray = []
  constructor(private exp: ExportComponent, private firestore: FirestoreService, private cookie: CookieService, private db: AngularFirestore, private dialog: MatDialog) { }

  ngOnInit() {
    this.firestore.getDecom().subscribe(data => { this.items = data; this.decomSource = new MatTableDataSource(data); this.decomSource.sort = this.sort; });
  }

  displayColumns = ['Name', 'Quantity', 'Location', 'User', 'Notes', 'Date', 'Actions',]; //all the columns, this also dictates order shown
  

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
  /**
   * Calls the export function from the export component
   * @param table The table contents to be exported
   */
  exportAsCSV(table) {
    this.exp.convertToCSV(table);
  }
  /**
   * Calls the export function from the export component
   * @param table The table contents to be exported
   */
  exportAsJSON(table) {
    this.exp.convertToJSON(table);
  }
  /**
   * Changes the tables data source to the items filtered with whats passed to the function
   * @param filterValue what to filter with
   */
  applyFilter(filterValue: string) {
    this.decomSource.filter = filterValue.trim().toLowerCase();
  }
  /**
   * Sends an item from decom into the inventory table. Deletes it from the decom group.
   * @param item Which item is being sent over
   */
  recomission(item) {
    var deleted = false;
    var docFound = false;;
    let colRef = this.db.collection('Decommission');
    let invRef = this.db.collection('Inventory');
    let qry = colRef.ref.get().then(snapshot => { // for each doc in decom
      snapshot.forEach(doc => {

        if (doc.data().Name == item.Name && doc.data().Serial == item.Serial && doc.data().Location == item.Location && doc.data().Notes == item.Notes) { //match the doc to the item
          invRef.ref.get().then(snap => {
            snap.forEach(invDoc => { // for each inventory item
              if (invDoc.data().Name == item.Name) {
                var qty = parseInt(item.Quantity) + parseInt(invDoc.data().Quantity) //need to convert from string to int
                if (!deleted) {// if nothing was deleted yet
                  invDoc.ref.update({ //update the inventory qty
                    Quantity: qty
                  })
                  doc.ref.delete()
                  docFound = true;
                  deleted = true
                }
              }
            })
          }).then(a => {
            if (!docFound) {
              var del = confirm("Item not found in Inventory. Do you want to delete it?")
              if (del) {
                let colRef = this.db.collection('Decommission');
                let qry = colRef.ref.get().then(snapshot => {
                  snapshot.forEach(doc => {
                    if (doc.data().Name == item.Name && doc.data().Serial == item.Serial && doc.data().Location == item.Location && doc.data().Notes == item.Notes) {
                      doc.ref.delete();
                    }
                  })
                })
              }
            }
          })
        }
      })
    })
  }
  /**
   *  Deletes a row from the table
   * @param item the item to delete
   */
  deleteRow(item) {
    let colRef = this.db.collection('Decommission');
    var flag = false;
    let qry = colRef.ref.get().then(snapshot => {
      snapshot.forEach(doc => {
        console.log(doc.data().Name)

        if (doc.data().Name == item.Name && doc.data().Serial == item.Serial && doc.data().Location == item.Location && doc.data().Notes == item.Notes && !flag) {
          doc.ref.delete();
          flag = true //only delete once. cant really refernce doc.data.id and this technically works
        }
      })
    })

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
      if ($($('.editbox')[v]).hasClass('notesbox') && !/^$|^[0-9A-Za-z\s\-\_]+$/.test(boxVal)) {//test the entry in the box with class notes 
        badEntryFlag = true;  //if it doesnt pass the test flag it and make it red
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px 2px red ')
      } else if ($($('.editbox')[v]).hasClass('notesbox')) { //otherwise set the box shadow to nothing
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('locationbox') && $($('.editbox')[v]).val().toString().toLowerCase() == "pick a location") {
        badEntryFlag = true;
        $($('.editbox')[v]).css('box-shadow', '0px 0px 5px red')
      } else if ($($('.editbox')[v]).hasClass('locationbox')) {
        $($('.editbox')[v]).css('box-shadow', 'none')
      }

      if ($($('.editbox')[v]).hasClass('namebox') && (!/^[0-9A-Za-z\s\-\_\/]+$/.test(boxVal) || boxVal.trim() == "")) {//if we're talking to the name box, and the string is contains non-alphanumeric chars, and its empty
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

    })
    if (!badEntryFlag) { //if no entries were bad
      var ind = 0;
      for (let x = 0; x < allboxesArr.length; x += 5) { //for every row
        var temp = [] //for holding text box values
        temp.push($(allboxesArr[x]).val().toString())
        temp.push(parseInt($(allboxesArr[x + 1]).toString()))
        temp.push($(allboxesArr[x + 2]).text().toString())
        temp.push($(allboxesArr[x + 3]).val().toString())
        temp.push($(allboxesArr[x + 4]).val())
        container.push(temp) //add array to array for l8r
      }
      let colRef = this.db.collection('Decommission'); //from the decom table
      let qry = colRef.ref.get().then(snapshot => {
        snapshot.forEach(doc => { //for each doc. A row is a doc in this scenario, this was a huge realization https://i.ytimg.com/vi/LLpIMRowndg/maxresdefault.jpg
          for (let x = 0; x < container.length; x++) {
            if (container[x][0] == doc.data().Name) { //if the containers document has the same name as the snapshot doc
              doc.ref.update({
                Name: $(allboxesArr[ind]).val().toString(),
                Quantity: parseInt($(allboxesArr[ind + 1]).val().toString()),
                Location: $(allboxesArr[ind + 2]).text().toString(),
                Notes: $(allboxesArr[ind + 3]).val().toString(),
                Date: firebase.firestore.Timestamp.fromDate(new Date(Date.parse(($(allboxesArr[ind + 4]).val().toString())))),


              })
            }
          }
          ind += 5 //go to next row
        })
      })
      alert('Decom updated!')
      this.editMode = false;
    }
  }
}
