import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router/";
import { HttpClient, HttpParams } from '@angular/common/http';
import { FirestoreService } from '../firestore.service';
import { CookieService } from 'ngx-cookie-service';
import { PinComponent } from '../pin/pin.component';
import { async } from '@angular/core/testing';
import { AngularFirestore } from 'angularfire2/firestore';
@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.css']
})
/**
 * handles URL queries and adds it to the queue table. 
 * Query params must be in order of: Name, Quantity
 * The name of the item must be present in the inventory to be added
 */
export class ScanComponent implements OnInit {
  param1 = "";
  newID = 0;


  constructor(private afs: AngularFirestore, private db: FirestoreService, private cookie: CookieService, private pin: PinComponent) {

  }
  urlParams = [];
  ngOnInit() {
    this.urlParams = this.getParams()
    if (this.urlParams.length != 0) {
      this.sendUrlQueue();
    }
  }
  /**
   * Gets the parameters in the URL
   */
  getParams() {
    const url = window.location.href;
    let paramValue = [];
    if (url.includes('?')) { //if the url has paramaters
      var count = (url.match(new RegExp("&", "g")) || []).length + 1 //get the number ofparams
      var httpParams = new HttpParams({ fromString: url.split('?')[1] }); //get the params
      for (let ind = 1; ind < count + 1; ind++) {//for ech param
        var p: string = "param" + ind
        paramValue.push(httpParams.get(p))
        httpParams = new HttpParams({ fromString: url.split('&')[ind] });
      }
    }
    return paramValue;
  }
  /**
   * Gets the URL parameters, and adds the item into the queue with the quantity but only if it exists in the inventory. 
   */
  sendUrlQueue() {
    this.delay(1500).then(() => { //wait for page to load basically
      var exists = false;
      var match;
      var urlItem: string = this.urlParams[0].toString()
      console.log(urlItem)

      urlItem = urlItem.replace("_", " ")
      console.log(urlItem)
      let colRef = this.afs.collection('Inventory');
      let qry = colRef.ref.get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            if (doc.data().Name.toLowerCase() == urlItem.toLocaleLowerCase()) { //find a matching doc in the inv
              exists = true;
              match = doc.data()
            }
          });
        }).then(() => {
          if (this.urlParams.length == 2 && exists) { //need 2 params. Name, quantity
            while (!this.pin.approved) {
              if (this.db.newID == 0) {
                this.db.newID = 1;
              }
              this.db.queueEntry(match.Name, this.urlParams[1], this.cookie.get("User"), this.db.newID, match.Serial) //the name of the item, the quantity, who done it, the id, and the serial #
              break;
            }
          }
        })
    })
  }
  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(), ms)).then(() => console.log("fired"));
  }
  /**
   * Mass imports a csv file into the db
   * @param files csv file
   */
   extractData(files: FileList) {
    var entries = 0
    if (files && files.length > 0) {
      let file: File = files.item(0);
      let reader: FileReader = new FileReader();
      reader.readAsText(file); 
      reader.onload = (e) => {
        let csv: string = reader.result as string;
        let rows = []
          rows = csv.split(/\n/) //split the csv text into a bunch of rows 
        //console.log(csv)
       //console.log(rows)
        //console.log(rows.length)
       
         for (let x = 0; x < rows.length; x++) { //for each row in the file.
          if(rows[x] != null ){
          var temp = rows[x].split(",") //separates the file into an array of lines. at this point rows looks like [serial, name, desc, decom], .....     
           var qry = "https://google.com/search?q="
          var add2qry = temp[1].replace(/ /g, "-") //the g after the regex replaces all
           qry += add2qry
           console.log(temp)
           if(temp[3].toLowerCase().trim() == "n"){
             
              this.db.inventoryEntry(temp[1], 1, temp[2], temp[0],qry )
               console.log(entries++)
              
           }
           else if(temp[3].toLowerCase().trim() == "y"){
          
            this.db.decomEntry(temp[1],"N/A", "Elliot", temp[2], new Date())
            console.log(entries++)
           
           }
         }
        }
      }
    }
  }
}
