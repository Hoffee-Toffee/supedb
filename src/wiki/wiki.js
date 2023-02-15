window["ready"] = false
window["permissions"] = []

var objects = []

function start() {

  // Check if the user isn't logged in
  if (!auth.currentUser) {
        // Redirect to the login page with redirect params
        location.href = "../login/login.html?redirect=" + redir()
  }

  // Check if the user has any associated permissions
  db.collection("permissions").where("user", "==", auth.currentUser.email).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
          window["permissions"].push(doc.data())
      })
  })

  // Get the map ID from the URL
  var url = new URL(window.location.href)
  window["id"] = url.searchParams.get("id")

  // If they don't have any permissions or no id is provided, redirect them to the dashboard
  if (window["permissions"] == null || window["id"] == null) {
      console.log(`Permissions: ${window["permissions"]}, ID: ${window["id"]}`)
      // location.href = "../dash/dash.html"
  }

  // Sync all data from the timeline
  db.collection("timelines").doc(window["id"]).onSnapshot((map) => {
      if (map) {
          document.getElementsByTagName("title")[0].innerText = map.data().title
  
          window["mapSettings"] = {
              id: map.id,
              title: map.data().title,
              description: map.data().description,
              encrypted: map.data().encrypted
          }
  
          objects = JSON.parse(map.data().map)
  
          if (window["ready"]) {
              display()
          }
          else {
              window["ready"] = true
          }
      }})
  
      if (window["ready"]) {
          display()
      }
      else {
          window["ready"] = true
      }
}

function display() {
  if (objects.includes(null)){
      // filter all the nulls and loop through them
      var nulls = objects.filter(e => e == null)
      nulls.forEach(obj => {
          var pos = objects.indexOf(obj)

          objects.forEach(e => {
              if (e !== null) {
                  e.id -= (e.id > pos) ? 1 : 0

                  if (e.class == "Sub") {
                      e.headId -= (e.headId > pos) ? 1 : 0
                      e.headId = (e.headId == pos) ? null : e.headId
                  }

                  if (e.class == "Link") {
                      e.line.forEach(point => {
                          point[0] -= (point[0] > pos) ? 1 : 0
                          point[2] -= (point[1] > pos) ? 1 : 0
                      })
                      e.parentId -= (e.parentId > pos) ? 1 : 0
                      e.childId -= (e.childId > pos) ? 1 : 0
                  }
              }
          })
          objects.splice(pos, 1)
      })
  }

  // Get page ID from URL
  var url = new URL(window.location.href)
  var pageId = url.searchParams.get("page")

  // If none is provided, then show links to all heads and all era pages
  if (pageId == null) {
    // Get all eras
    var eras = objects.filter(e => e.class == "Era")
    // Get all heads
    var heads = objects.filter(e => e.class == "Head")

    console.log(`All: ${objects.length}, Eras: ${eras.length}, Heads: ${heads.length}`)

    // Populate the page with the main wiki page
    var wiki = document.getElementById("wikiPage")

    // Create the title
    var title = document.createElement("h1")
    title.innerText = `${window["mapSettings"].title} - Wiki`
    wiki.appendChild(title)

    // Create the subtitle
    var subtitle = document.createElement("h2")
    subtitle.innerText = "Main Page"
    wiki.appendChild(subtitle)

    // Create the main description
    var description = document.createElement("p")
    description.innerText = "This is the main wiki page for this timeline. Click on a link below to go to a specific page."
    wiki.appendChild(description)

    // Create the page description
    var description2 = document.createElement("p")
    description2.innerText = window["mapSettings"].description

    // Create the era list
    var eraList = document.createElement("ul")

    var eraTitle = document.createElement("h3")
    eraTitle.innerText = "Eras"
    wiki.appendChild(eraTitle)

    var eraDescription = document.createElement("p")
    eraDescription.innerText = "Click on an era to see all the events that happened during that time period."
    wiki.appendChild(eraDescription)

    eras.forEach(era => {
      var eraItem = document.createElement("li")
      eraList.appendChild(eraItem)

      var eraLink = document.createElement("a")
      eraLink.href = `?id=${window["id"]}&page=${era.id}`
      eraLink.innerText = era.title
      eraItem.appendChild(eraLink)
    })
    wiki.appendChild(eraList)

    // Create the head list
    var headList = document.createElement("ul")

    var headTitle = document.createElement("h3")
    headTitle.innerText = "Event Heads"
    wiki.appendChild(headTitle)

    var headDescription = document.createElement("p")
    headDescription.innerText = "Click on an event head to see the details of that event."
    wiki.appendChild(headDescription)

    heads.forEach(head => {
      var headItem = document.createElement("li")
      headList.appendChild(headItem)

      var headLink = document.createElement("a")
      headLink.href = `?id=${window["id"]}&page=${head.id}`
      headLink.innerText = head.title
      headItem.appendChild(headLink)
    })
    wiki.appendChild(headList)
  }
  else {
    // If a page ID is provided, then get that object
    var page = objects.find(e => e.id == pageId)

    // If it's an era page, then show all the events that happened during that time period
    if (page.class == "Era") {
      // Get all the events that happened during that time period
      // Start by getting all the era pages and their positions
      var eras = objects.filter(e => e.class == "Era")
      var eraPositions = eras.map(e => e.position)

      // Sort the era pages from earliest to latest
      eraPositions.sort((a, b) => a - b)

      // Get the span of the era
      var eraStart = page.position
      var eraEnd = eraPositions[eraPositions.indexOf(eraStart) + 1]

      // Get all heads, subs, and info nodes
      var events = objects.filter(e => ["Head", "Sub", "Info"].includes(e.class))

      // Get all the events that happened during that time period
      // If era is the last era, then it will get those that have an x position greater than the era's start
      if (eraEnd == null) {
        events = events.filter(e => e.position[0] > eraStart)
      }
      // Otherwise, it will get those that have an x position greater than the era's start and less than the era's end
      else {
        events = events.filter(e => e.position[0] > eraStart && e.position[0] < eraEnd)
      }

      console.log(events)

      // Populate the page with the era page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - ${page.title}`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = "Era Page"
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = "This is the era page for this timeline. Click on a link below to go to a specific event page."
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.innerText = page.description
      wiki.appendChild(description2)

      // Create a contents table to be populated later
      var contents = document.createElement("ul")

      contents.classList.add("toc")

      wiki.appendChild(contents)

      // Sort objects by their x position (lowest to highest) and y position for those with the same x position (also lowest to highest)
      events.sort((a, b) => a.position[0] - b.position[0] || a.position[1] - b.position[1])

      // Create sections for each head group
      var headGroups = events.filter(e => e.class == "Head")
      headGroups.forEach(head => {
        // Create the section
        var section = document.createElement("div")
        section.id = head.id
        section.classList.add("section")
        wiki.appendChild(section)

        // Create the title
        var sectionTitle = document.createElement("h3")
        sectionTitle.innerText = head.title
        section.appendChild(sectionTitle)

        // Create the description
        var sectionDescription = document.createElement("p")
        sectionDescription.innerText = head.description
        section.appendChild(sectionDescription)

        // Loop through all the subs and info nodes that are children of the head node
        var subs = events.filter(e => e.headId == head.id)
        subs.forEach(sub => {
          // Create the sub title
          var subTitle = document.createElement("h4")
          subTitle.innerText = sub.title
          section.appendChild(subTitle)

          // Create the sub description
          var subDescription = document.createElement("p")
          subDescription.innerText = sub.description
          section.appendChild(subDescription)
        })
      })
    }
    // If it's a head page, then show the details of that event, its subs, and its info nodes
    else if (page.class == "Head") {
      // Populate the page with the head page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - ${page.title}`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = "Event Page"
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = "This is the event page for this timeline. Click on a link below to go to a specific sub page."
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.innerText = page.description
      wiki.appendChild(description2)

      // Create a contents table to be populated later
      var contents = document.createElement("ul")

      contents.classList.add("toc")

      wiki.appendChild(contents)

      // Create the subs
      var subs = objects.filter(e => e.headId == page.id)
      subs.forEach(sub => {
        // Create the sub title
        var subTitle = document.createElement("h4")
        subTitle.innerText = sub.title
        wiki.appendChild(subTitle)

        // Create the sub description
        var subDescription = document.createElement("p")
        subDescription.innerText = sub.description
        wiki.appendChild(subDescription)
      })
    }
  }
}

function helpMenu() {
  /* Return in format:
  "topic": {
      desc: [
          "Line 1",
          "Line 2",
          ...
      ],
      pages: [
          {
              "section": [
                  "Line 1",
                  "Line 2",
                  ...
              ],
              ...
          },
          ...
      ]
  },
  ...
}

  */
  return {
    "Wiki in Development": {
      desc: [
        "The wiki page is still in development.",
        "You may encounter bugs or missing features."
      ],
      pages: [
        {
          "Open or Close the Help Menu": [
            "Press \"Ctrl + H\" to close this menu if you wish to use the wiki in this incomplete state.",
            "You may also press \"Ctrl + H\" to reopen this menu at any time."
          ]
        }
      ]
    }
  }
}