// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRrxXRbbyCbDh06oFKoDwZgd4Ucd0nXyk",
    authDomain: "supe-db.firebaseapp.com",
    projectId: "supe-db",
    storageBucket: "supe-db.appspot.com",
    messagingSenderId: "414925832647",
    appId: "1:414925832647:web:04e6b82a8fc2dd48bf99e2",
    measurementId: "G-FCEP73WM0G"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Run 'start' function when the auth state loads/changes
auth.onAuthStateChanged(start);

// Make a context menu event listener
document.oncontextmenu = function (e) {
    // Attempt to run the 'contextMenu' function
    try {
        genContextMenu(e, contextMenu(e));
    } catch (err) {
        // This page doesn't have a custom context menu so do nothing
        console.log(err);
    }
}

function genContextMenu(e, attr) {
    // attr will be like this:
    // [
    //     {
    //         text: "Text",
    //         key: "Key",
    //         onclick: function () { // Do something }
    //     },
    //     ...
    // ]

    // Create the context menu
    let contextMenu = document.createElement("ul");
    contextMenu.id = "context-menu";
    contextMenu.style.position = "absolute";

    // Add the items to the context menu
    attr.forEach(item => {
        let el = document.createElement("li");
        el.innerText = item.text;
        el.onclick = item.onclick;
        if (item.key) el.dataset.key = item.key;

        contextMenu.appendChild(el);
    });

    let mouseX = e.clientX + window.scrollX;
    let mouseY = e.clientY + window.scrollY;

    let windowWidth = window.innerWidth + scrollX;
    let windowHeight = window.innerHeight + scrollY;

    // Add the context menu to the page
    document.body.appendChild(contextMenu);

    // Get the width and height of the context menu
    let cmWidth = contextMenu.offsetWidth;
    let cmHeight = contextMenu.offsetHeight;

    // Determine which side of the mouse the context menu should be on
    let xQuadrant = (windowWidth - mouseX - cmWidth) < 5 ? "right" : "left";
    let yQuadrant = (windowHeight - mouseY - cmHeight) < 5 ? "bottom" : "top";

    // Position the context menu
    if ([xQuadrant, yQuadrant].join() == "left,top") {
        contextMenu.style.left = mouseX + "px";
        contextMenu.style.top = mouseY + "px";
    }
    if ([xQuadrant, yQuadrant].join() == "right,top") {
        contextMenu.style.left = mouseX - cmWidth + "px";
        contextMenu.style.top = mouseY + "px";
    }
    if ([xQuadrant, yQuadrant].join() == "left,bottom") {
        contextMenu.style.left = mouseX + "px";
        contextMenu.style.top = mouseY - cmHeight + "px";
    }
    if ([xQuadrant, yQuadrant].join() == "right,bottom") {
        contextMenu.style.left = mouseX - cmWidth + "px";
        contextMenu.style.top = mouseY - cmHeight + "px";
    }
}

// Remove the context menu when the user left or right clicks anywhere except the context menu
function toogleContextMenu(e) {
    let cm = document.getElementById("context-menu");
    // Delete if menu is open and the user clicks outside of the menu
    // Unless the user right clicks, in which case it will open a new menu
    if (cm && (e.target != cm || e.button == 2)) {
        // Loop getting the cm
        while (cm) {
            cm.remove();
            cm = document.getElementById("context-menu");
        }

        // If the user right clicked, open a new menu
        if (e.button == 2) {
            console.log("Right click");
            genContextMenu(e, contextMenu(e));
        }
    }
}

// Add the event listeners
document.addEventListener("click", toogleContextMenu);
document.addEventListener("contextmenu", toogleContextMenu);
document.addEventListener("scroll", toogleContextMenu);