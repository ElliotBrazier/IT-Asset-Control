import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
  DocumentChangeAction,
  Action,
  DocumentSnapshotDoesNotExist,
  DocumentSnapshotExists,
} from 'angularfire2/firestore';
import { Observable, from, observable } from 'rxjs';
import { map, tap, take, switchMap, mergeMap, expand, takeWhile } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import * as firebase from 'firebase/app';
import { Timestamp } from 'rxjs/internal/operators/timestamp';
import { DatePipe } from '@angular/common';
import { Items } from './inventory/Items';
import { FirebaseDatabase } from '@angular/fire';



@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  mydate = new Date();
  done = false;
  newID = 0;
  invID = 0;
  items: Observable<any[]>;
  itemCollection: AngularFirestoreCollection;

  restocks: Observable<any[]>;
  restockCollection: AngularFirestoreCollection;

  queueItems: Observable<any[]>;
  queueCollection: AngularFirestoreCollection;

  manageItems: Observable<any[]>;
  manageCollection: AngularFirestoreCollection;

  decomItems: Observable<any[]>;
  decomCollection: AngularFirestoreCollection;

  constructor(private db: AngularFirestore, private datePipe: DatePipe) {
    this.items = db.collection('Inventory').valueChanges();
    this.itemCollection = this.db.collection('Inventory');
    this.manageCollection = this.db.collection('Manage');
    this.decomCollection = this.db.collection('Decommission');
    this.queueItems = this.db.collection('Queue').valueChanges();
    this.manageItems = this.db.collection('Manage').valueChanges();
    this.decomItems = this.db.collection('Decommission').valueChanges();
    this.remainingItems = 0;

    this.updateRemaining();
    this.getNextQueueID();
    this.getNextInvID()
  }
  remainingItems;

  async nameExistsInTable(collection: string, name: string) {
    let colRef = this.db.collection(collection);
    let qry = colRef.ref.get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          if (doc.data().Name == name) {
            return true;
          }
        });
      }).then(() => {

        return false;
      })

  }
/**
 * Checks to see if the name of an item is in a table. Returns an array of the names found
 * @param collection what table/collection to look in
 * @param name the item name
 */
  async nameContainedInTable(collection: string, name: string) {
    let colRef = this.db.collection(collection);
    var temp: string[] = [];
    let qry = colRef.ref.get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          if (doc.data().Name.startsWith(name)) {
            temp.push(doc.data().Name)
          }
        });
      }).then(() => { return temp })

   
  }
  /**
   * Add an entry into the Inventory table 
   * @param name Name of item getting sent to inventory
   * @param qty How many youre adding
   * @param desc Description of the item
   * @param issn Serial number
   * @param orderUrl URL you want reorder button to go to
   */
  inventoryEntry(name: string, qty: number, desc: string, issn: string, orderUrl: string) {
    return this.db.collection('Inventory').add({
      Name: name,
      Description: desc,
      LastRestock: this.mydate,
      LastRestockQuantity: qty,
      Quantity: qty,
      Serial: issn,
      OrderURL: orderUrl,

    });
  }
/**
 * Returns the next item ID from the Queue. Checks for the highest ID already there. If there isn't one it returns 1
 */
  getNextQueueID(): number {
    var makeID = 0
    let colRef = this.db.collection('Queue');
    let qry = colRef.ref.orderBy('ID', 'desc').get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          if (doc.data().ID > makeID) {
            makeID = doc.data().ID + 1;
            this.newID = makeID;
          }
        })
        if (makeID = 0) {
          this.newID = 1;
        }

        return this.newID;
      }
      )
    return this.newID

  }
  /**
 * Returns the next item ID from the inventory. Checks for the highest ID already there. If there isn't one it returns 1
   */
  getNextInvID() {
    var makeID = 0
    let colRef = this.db.collection('Inventory');
    let qry = colRef.ref.orderBy('ID', 'desc').get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          if (doc.data().ID > makeID) {
            makeID = doc.data().ID + 1;
            this.invID = makeID;
          }
        })
        if (makeID == 0) {
          this.invID = 1;
        }

        return this.invID;
      }
      )
    return this.invID

  }
  /**
   * For counting the number of items left in the queue
   */
  updateRemaining() {
    this.remainingItems = 0;
    let colRef = this.db.collection('Queue');
    let qry = colRef.ref.orderBy('ID', 'desc').get()
      .then(snapshot => {

        snapshot.forEach(doc => {//for each doc up the count
          this.remainingItems++;
        })
      })

  }
  /**
   * Makes an entry into the Queue table
   * @param name item name
   * @param qty item quantity
   * @param user the current user
   * @param id item id
   * @param serial item serial number
   */
  queueEntry(name: string, qty: number, user: string, id: number, serial: string) {
    this.updateRemaining()
     this.db.collection('Queue').add({
      Date: this.mydate,
      Name: name,
      Quantity: qty,
      User: user,
      ID: id,
      Serial: serial
    });
  }
  /**
   * Makes an entry into the manage table
   * @param itemName item name
   * @param user current user
   * @param location location of the item
   * @param notes notes about the entry
   * @param quantity how many are getting sent
   * @param serial item serial number
   * @param id item id
   */
  manageEntry(itemName: string, user: string, location: string, notes: string, quantity: number, serial: string, id: number) {
    //would be good to have a query to check if an item of that same name exists at that location
    //and if so, just bump qty instead of new entry
    return this.db.collection('Manage').add({
      Name: itemName,
      Quantity: quantity,
      Location: location,
      Notes: notes,
      User: user,
      Date: this.mydate,
      Serial: serial,
      ID: id
    })
  }
  /**
   * Makes an entry into the decommission table
   * @param name Item name
   * @param location items location
   * @param user current user
   * @param notes notes about the decom
   * @param date date it was broken/decom'd
   */
  decomEntry(name: string, location: string, user: string, notes: string, date: Date) {
    return this.db.collection('Decommission').add({
      Name: name,
      Location: location,
      User: user,
      Notes: notes,
      Date: date

    })
  }
  getManage() {
    return this.manageItems;
  }
  getQueue() {
    return this.queueItems;
  }
  getInventory() {
    //  console.log(this.items);
    return this.items;
  }
  getRestock() {
    return this.restocks;
  }
  getDecom() {
    return this.decomItems;
  }


}