(function () {
    // IndexedDB
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
        IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
        dbVersion = 1.0;

    // Create/open database
    var request = indexedDB.open("elephantFiles", dbVersion),
        db,
        createObjectStore = function (dataBase) {
            // Create an objectStore
            console.log("Creating objectStore")
            dataBase.createObjectStore("elephants");
        },

        getImageFile = function () {
            // Create XHR and BlobBuilder
            var xhr = new XMLHttpRequest(),
                blobBuilder = new (window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.OBlobBuilder || window.msBlobBuilder),
                blob;

            xhr.open("GET", "elephant.png", true);
            // Set the responseType to arraybuffer. "blob" is an option too, rendering BlobBuilder unnecessary, but the support for "blob" is not widespread enough yet
            xhr.responseType = "arraybuffer";

            xhr.addEventListener("load", function () {
                if (xhr.status === 200) {
                    console.log("Image retrieved");
                    
                    // File as response
                    var response = xhr.response;

                    if (blobBuilder) {
                        // Append the response to the BlobBuilder
                        blobBuilder.append(response);
                        // Create a blob with the desired MIME type
                        blob = blobBuilder.getBlob("image/png");
                    }
                    else {
                        blob = new Blob([response]);
                    }
                    
                    if (blob) {
                        // Put the received blob into IndexedDB
                        putElephantInDb(blob);
                    }
                }
            }, false);
            // Send XHR
            xhr.send();
        },

        putElephantInDb = function (blob) {
            console.log("Putting elephants in IndexedDB");

            // Open a transaction to the database
            var transaction = db.transaction(["elephants"], IDBTransaction.READ_WRITE);

            // Put the blob into the dabase
            transaction.objectStore("elephants").put(blob, "image");

            // Retrieve the file that was just stored
            transaction.objectStore("elephants").get("image").onsuccess = function (event) {
                var imgFile = event.target.result;
                console.log("Got elephant!" + imgFile);

                // Get window.URL object
                var URL = window.URL || window.webkitURL;

                // Create and revoke ObjectURL
                var imgURL = URL.createObjectURL(imgFile);

                // Set img src to ObjectURL
                var imgElephant = document.getElementById("elephant");
                imgElephant.setAttribute("src", imgURL);

                // Revoking ObjectURL
                URL.revokeObjectURL(imgURL);
            };
        };

    request.onerror = function (event) {
        console.log("Error creating/accessing IndexedDB database");
    };

    request.onsuccess = function (event) {
        console.log("Success creating/accessing IndexedDB database");
        db = request.result;

        db.onerror = function (event) {
            console.log("Error creating/accessing IndexedDB database");
        };
        
        // Interim solution for Google Chrome to create an objectStore. Will be deprecated
        if (db.setVersion) {
            if (db.version != dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess = function () {
                    createObjectStore(db);
                    getImageFile();
                };
            }
            else {
                getImageFile();
            }
        }
        else {
            getImageFile();
        }
    }
    
    // For future use. Currently only in latest Firefox versions
    request.onupgradeneeded = function (event) {
        createObjectStore(event.target.result);
    };
})();
