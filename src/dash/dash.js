function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
    // Redirect to the login page
    window.location.href = "/src/login/login.html";
  }

  document.getElementById("addmenu").style.zIndex = 3

  // Get all the permissions records with this user's email as the 'user' field
  
  db.collection("permissions").where("user", "==", auth.currentUser.email).get().then((querySnapshot) => {
    // Loop through all the permissions records
    querySnapshot.forEach((doc) => {
      // Get the timeline referenced by this permissions record
      db.collection("timelines").doc(doc.data().map.id).get().then((doc) => {
        // Add this document to the list
        var tag = document.createElement("a")
        tag.id = doc.data().title
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
    })
  })
}