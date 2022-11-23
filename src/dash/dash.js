function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
    // Redirect to the login page
    window.location.href = "/src/login/login.html";
  }

  document.getElementById("addmenu").style.zIndex = 3


  // Sync to the database (will run every time the database is updated)
  // Will look for changes made to the maps accessible by the user

  db.collection("permissions").where("user", "==", auth.currentUser.email).onSnapshot((querySnapshot) => {
    // Loop and log the changes
    querySnapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        console.log("Added: ", change.doc.data());
        // Add the map to the list
        db.collection("timelines").doc(change.doc.data().map).get().then((doc) => {
          var tag = document.createElement("a")
          tag.id = doc.id
          tag.href = "../map/map.html?id=" + doc.id
          tag.classList.add("map")

          var text = document.createElement("h2")
          text.innerText = doc.data().title
          tag.appendChild(text)

          var descbox = document.createElement("p")
          descbox.innerText = doc.data().description
          descbox.classList.add("description")
          tag.appendChild(descbox)

          if (doc.data().encrypted) tag.setAttribute("encrypted", true)
          
          document.getElementById("map-menu").appendChild(tag)
        })
      }
      if (change.type === "modified") {
        console.log("Modified: ", change.doc.data());
        // Update the map in the list (if the title, description, encrypted status, or timeline ref has changed)
        db.collection("timelines").doc(change.doc.data().map).get().then((doc) => {
          document.getElementById(doc.id).href = "../map/map.html?id=" + doc.id
          document.getElementById(doc.id).children[0].innerText = doc.data().title
          document.getElementById(doc.id).children[1].innerText = doc.data().description
          if (doc.data().encrypted) document.getElementById(doc.id).setAttribute("encrypted", true)
          else document.getElementById(doc.id).removeAttribute("encrypted")
        })
      }
      if (change.type === "removed") {
        console.log("Removed: ", change.doc.data());
        // Remove the map from the list
        db.collection("timelines").doc(change.doc.data().map).get().then((doc) => {
          document.getElementById(doc.id).remove()
        })
      }
    })
  })
  // Also sync whenever any documents are changed
  db.collection("timelines").onSnapshot((querySnapshot) => {
    // Check if the user has access to the map
    querySnapshot.docChanges().forEach((change) => {
      db.collection("permissions").where("user", "==", auth.currentUser.email).where("map", "==", change.doc.id).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
          // If the user doesn't have access to the map, leave the function
          return
        }
        if (change.type === "modified") {
          console.log("Modified: ", change.doc.data());
          // Update the map in the list (if the title, description, encrypted status, or timeline ref has changed)
          db.collection("timelines").doc(change.doc.id).get().then((doc) => {
            document.getElementById(doc.id).href = "../map/map.html?id=" + doc.id
            document.getElementById(doc.id).children[0].innerText = doc.data().title
            document.getElementById(doc.id).children[1].innerText = doc.data().description
            if (doc.data().encrypted) document.getElementById(doc.id).setAttribute("encrypted", true)
            else document.getElementById(doc.id).removeAttribute("encrypted")
          })
        }
        if (change.type === "removed" || change.type === "added") {
          // Shouldn't be needed as the permissions sync should handle this already
          // Will log incase it is needed
          console.log(change.type.charAt(0).toUpperCase() + change.type.slice(1) + ": ", change.doc.data());
        }
      })
    })
  })
}