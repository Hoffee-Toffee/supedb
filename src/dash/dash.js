function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
    // Redirect to the login page
    window.location.href = "../login/login.html";
  }

  // Sync to the database (will run every time the database is updated)
  // Will look for changes made to the maps accessible by the user

  db.collection("permissions").where("user", "==", auth.currentUser.email).onSnapshot((querySnapshot) => {
    // Loop and log the changes (async)
    querySnapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        console.log("Added: ", change.doc.data());
        db.collection("projects").doc(change.doc.data().entity).get().then((doc) => {
          var tag = document.createElement("a")
          tag.id = doc.id
          tag.href = "../versions/versions.html?id=" + doc.id
          tag.classList.add("project")

          var text = document.createElement("h2")
          text.innerText = doc.data().title
          tag.appendChild(text)

          var descbox = document.createElement("p")
          descbox.innerText = doc.data().description
          descbox.classList.add("description")
          tag.appendChild(descbox)

          // Make sure the empty-message is hidden
          document.getElementById("empty-message").style.display = "none"

          document.getElementById("project-menu").appendChild(tag)
        })
      }
      if (change.type === "modified") {
        console.log("Modified: ", change.doc.data());
        // Update the map in the list (if the title, description, encrypted status, or timeline ref has changed)
        db.collection("projects").doc(change.doc.data().entity).get().then((doc) => {
          document.getElementById(doc.id).href = "../versions/versions.html?id=" + doc.id
          document.getElementById(doc.id).children[0].innerText = doc.data().title
          document.getElementById(doc.id).children[1].innerText = doc.data().description
        })
      }
      if (change.type === "removed") {
        console.log("Removed: ", change.doc.data());
        // Remove the map from the list
        db.collection("projects").doc(change.doc.data().entity).get().then((doc) => {
          document.getElementById(doc.id).remove()

          if (document.getElementById("project-menu").children.length === 1) {
            document.getElementById("empty-message").style.display = ""
          }
        })
      }
    })
  })
  // Also sync whenever any documents are changed
  db.collection("projects").onSnapshot((querySnapshot) => {
    // Check if the user has access to the map
    querySnapshot.docChanges().forEach((change, index) => {
      db.collection("permissions").where("user", "==", auth.currentUser.email).where("type", "==", "P").where("entity", "==", change.doc.id).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
          // If the user doesn't have access to the map, leave the function
          return
        }
        if (change.type === "modified") {
          console.log("Modified: ", change.doc.data());
          // Update the map in the list (if the title, description, encrypted status, or timeline ref has changed)
          db.collection("projects").doc(change.doc.id).get().then((doc) => {
            document.getElementById(doc.id).href = "../versions/versions.html?id=" + doc.id
            document.getElementById(doc.id).children[0].innerText = doc.data().title
            document.getElementById(doc.id).children[1].innerText = doc.data().description
          })
        }
      })
    })
  })
}

window.onload = function () {
  loadTheme();
}

// function contextMenu(e) {
//   if (window["embedded"]) return
//   e.preventDefault()

//   // For clicking on the body/html
//   if (["BODY", "HTML"].includes(e.target.tagName)) {
//       var attr = [
//         {
//           text: "New Project",
//           onclick: () => window.location.href = "../map/map.html"
//         }
//       ]
//       return attr
//   }
// }

function settingsMenu() {
  // If the popup is already open, close it.
  if (document.getElementById("popup").style.visibility == "visible") {
      document.getElementById("popup").style.visibility = "hidden";
      return;
  }

  // Set the popup to be visible.
  document.getElementById("popup").style.visibility = "visible";

  // Select the current theme.
  var theme = document.cookie.split("theme=")[1].split(";")[0];
  document.getElementById(theme).checked = true;

  // Add event listeners to run on change.
  document.getElementById("theme").addEventListener("change", function () {
      var theme = document.querySelector('input[name="theme"]:checked').value;
      var d = new Date();
      d.setTime(d.getTime() + (365*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      document.cookie = `theme=${theme}; path=/; ${expires}`;
      loadTheme();
  });
}