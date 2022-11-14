window.onload = function() {
  document.getElementById("addmenu").style.zIndex = 3

  // Add all timelines to the page
  console.log(db)
  var data = db.collection("timelines").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
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
}