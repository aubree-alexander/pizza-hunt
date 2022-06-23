let db;
//establish connection to indexedDB db and set it to version 1
const request = indexedDB.open('pizza_hunt', 1)

//this will emit if the db version chanages (nonexistant to version 1, v1 to v2, etc)
request.onupgradeneeded = function(event) {
    //save reference to the db
    const db = event.target.result;
    //create object store (table) and set it to have an auto incrementing primary key
    db.createObjectStore('new_pizza', { autoIncrement: true });
}

//upon success
request.onsuccess = function(event) {
    //when db is successfully created with its obeject store (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    //check if app is online, if yes run uploadpizza function to send all local db data to api
    if (navigator.online) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

//execute if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    //open new transaction with db with read and write permissions
    const transaction = db.transaction([ 'new-pizza' ], 'readwrite');

    //access object store for newpizza
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    //add record to your store with add method
    pizzaObjectStore.add(record);
}

function uploadPizza() {
    //open transaction on db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access the object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    //get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    //upon succesful getAll execution, run this
    getAll.onsucces = function() {
        //if there was data in indexeddb's store, send to api server
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction([ 'new_pizza' ], 'readwrite');
                //access from object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                //clear all items from store
                pizzaObjectStore.clear();

                alert('All saved pizza has been submitted.');
            })
            .catch(err => {
                console.log(err)
            })
        }
    }
}

//listen for app coming back online
window.addEventListener('online', uploadPizza);