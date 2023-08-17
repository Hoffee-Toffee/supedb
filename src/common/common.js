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

// Run 'start' function after the auth state changes
auth.onAuthStateChanged(function () {
    // Open settings menu if that's the hash
    console.log(settingsMenu != undefined, window.location.hash == "#settings")
    if (settingsMenu && window.location.hash == "#settings") {
        // Open the settings menu
        settingsMenu();
    }
    start();
});

function loadTheme() {
    var themeLink = document.getElementById("themeLink");
    if (themeLink) themeLink.remove();

    try {
        var theme = document.cookie.split("theme=")[1].split(";")[0];
        // Give error if equal to 'undefined'
        if (theme == "undefined") throw "Theme is undefined";
    }
    catch {
        var theme = "minutes";
        document.cookie = "theme=minutes; path=/";
    }
    
    themeLink = document.createElement("link");
    themeLink.rel = "stylesheet";
    themeLink.href = `../common/themes/${theme}.css`;
    themeLink.id = "themeLink";
    document.head.appendChild(themeLink);
}

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

function genContextMenu(e, attr, hoverOnly = false) {
    // attr will be like this:
    // [
    //     {
    //         text: "Text",
    //         key: "Key",
    //         onclick: function () { // Do something }
    //     },
    //     ...
    // ]

    // Add 'help' to the end of the array, as it's always there
    attr.push({
        text: "Help",
        key: "Ctrl + H",
        onclick: function () {
            help();
        }
    });

    // Create the context menu
    let contextMenu = document.createElement("ul");
    contextMenu.id = "context-menu";
    contextMenu.style.position = "absolute";

    if (hoverOnly) contextMenu.classList.add("hoverOnly");

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
function toggleContextMenu(e) {
    let cm = document.getElementById("context-menu");

    if (e && e.type == "mousemove" && cm && cm.classList.contains("hoverOnly")) {
        // If the user is hovering over the context menu, it's children, or the id begins with 'editLink', do nothing
        if (e.target.id == "context-menu" || e.target.id.startsWith("editLink") || (e.target.parentElement && e.target.parentElement.id == "context-menu")) return;
        
        // They must be out of the context menu, so remove it
        e.button = 0;
    }
    else if (e && e.type == "mousemove") return;

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
            genContextMenu(e, contextMenu(e));
        }
    }
}

// Add the event listeners
document.addEventListener("click", toggleContextMenu);
document.addEventListener("contextmenu", toggleContextMenu);
document.addEventListener("scroll", toggleContextMenu);
document.addEventListener("mousemove", toggleContextMenu);
document.addEventListener("keydown", e => {
    if (e.key == "h" && e.ctrlKey) {
        e.preventDefault();
        help();
    }
});

// Load the favicon
var favicon = document.createElement("link");
favicon.rel = "icon"
favicon.href = "../common/favicon.ico"
document.head.appendChild(favicon);

function redir() {
    // Return the last two parts of the url plus the query string
    return  "../" + window.location.pathname.split("/").slice(-2).join("/") + window.location.search;
}

function notify(message) {
    var notices = document.getElementById("notices")
    var notice = document.createElement("div")
    notice.classList.add("notice")
    notice.setAttribute("aria-hidden", "true")
    notice.innerText = message

    // After 5 seconds, close the notice
    setTimeout(() => {
        notice.classList.add("hide")
        setTimeout(() => {
            notice.remove()
        }, 200)
    }, 5000)

    // Add the notice to the top of the notices div (if there are any other notices)
    if (notices.children.length > 0) notices.insertBefore(notice, notices.children[0])
    // Otherwise just add it to the div
    else notices.appendChild(notice)

    // Lastly, add the show class to the notice
    setTimeout(() => {
        notice.classList.add("show")
    }, 1)
}

function genID() {
    return Date.now().toString(36) + Math.floor(Math.random() * 88889 + 11111).toString(36);
}