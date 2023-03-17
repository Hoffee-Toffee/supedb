window["ready"] = false
window["permissions"] = []
window["editing"] = false

var objects = []

function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
      // Redirect to the login page with redirect params
      location.href = "../login/login.html?redirect=" + redir()
  }
  
  var dateString = new Date().toLocaleString("en-GB", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })

  sessionStorage.setItem("ID", `USER: ${auth.currentUser.email}, INITIATED: ${dateString}, TOKEN: ${Math.random().toString(36).toUpperCase().slice(2)}`)

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
    // Ignore if the change was made by you (your session id)
    if (map.data().lastChange == sessionStorage.getItem("ID")) return

    // Clear the page
    document.getElementById("wikiPage").innerHTML = ""

      if (map) {  
          window["mapSettings"] = {
              id: map.id,
              title: map.data().title,
              description: map.data().description,
              encrypted: map.data().encrypted,
              project: map.data().project
          }
  
          objects = JSON.parse(map.data().map)
  
          if (window["ready"]) {
              displayWiki()
          }
          else {
              window["ready"] = true
          }
      }})
  
      if (window["ready"]) {
          displayWiki()
      }
      else {
          window["ready"] = true
      }
}

function displayWiki() {
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

  // If 'new' then set pageId to 'newPage'
  // If 'newPage' is taken then keep add -01 and so on until it isn't
  if (url.searchParams.get("new") != undefined && !pageId) {
      pageId = "New Page"
      var i = 0

      while(objects.find(e => e.title == `${pageId}${i == 0 ? "" : " " + (i < 10 ? "0" + i : i)}`) != undefined) i++
      pageId = `${pageId}${i == 0 ? "" : " - " + (i < 10 ? "0" + i : i)}`
  }

  // Get the wiki
  var wiki = document.getElementById("wikiPage")

  // Add the title
  var title = document.createElement("h1")
  wiki.appendChild(title)

  var titleLink = document.createElement("a")
  titleLink.href = `wiki.html?id=${window["id"]}`
  titleLink.innerText = window["mapSettings"].title
  title.appendChild(titleLink)

  var titleText = document.createElement("span")
  titleText.innerText = "\u00A0-\u00A0"
  title.appendChild(titleText)

  // If none is provided, then show links to all heads and all era pages
  if (pageId == null) {
    // Remove the edit button from the page
    document.querySelector("label[for='editMode']").remove()

    // Get all eras
    var eras = objects.filter(e => e.class == "Era")

    // Order eras by position (lowest to highest)
    eras.sort((a, b) => a.position - b.position)

    // Get all heads
    var heads = objects.filter(e => e.class == "Head")

    // Order heads by position x (lowest to highest) then by position y (lowest to highest) for any with the same x value
    heads.sort((a, b) => a.position[0] - b.position[0] || a.position[1] - b.position[1])

    console.log(`All: ${objects.length}, Eras: ${eras.length}, Heads: ${heads.length}`)

    // Add the title
    titleText.innerText += "Main Page"

    // Change the title link to that of the project
    titleLink.href = `../versions/versions.html?id=${window["mapSettings"].project}`

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
      eraLink.href = `?id=${window["id"]}&page=${era.title}`
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
      headLink.href = `?id=${window["id"]}&page=${head.title}`
      headLink.innerText = head.title
      headItem.appendChild(headLink)
    })
    wiki.appendChild(headList)

    // Create a list of additional links
    var links = document.createElement("ul")
    links.setAttribute("headerText", "Additional Links")
    wiki.appendChild(links)

    // Show a link to the special pages
    var specialTitle = document.createElement("li")
    links.appendChild(specialTitle)

    var specialLink = document.createElement("a")
    specialLink.href = `?id=${window["id"]}&page=Special:SpecialPages`
    specialLink.innerText = "Special Pages"
    specialTitle.appendChild(specialLink)

    // Show a link to create a new page
    var newTitle = document.createElement("li")
    links.appendChild(newTitle)

    var newLink = document.createElement("a")
    newLink.href = `?id=${window["id"]}&new`
    newLink.innerText = "Create New Page"
    newTitle.appendChild(newLink)
  }
  // If it starts with "category:", then show all the pages in that category
  else if (pageId.startsWith("Category:")) {
    // Get the category name
    var category = pageId.substring(9)

    // Get all the pages in that category (in alphabetical order)
    var pages = objects.filter(e => e.categories && e.categories.includes(category)).sort((a, b) => a.title.localeCompare(b.title))

    // Add the title
    titleText.innerText += "Category Page"

    // Create the subtitle
    var subtitle = document.createElement("h2")
    subtitle.innerText = `Category: ${category}`
    wiki.appendChild(subtitle)

    // Create the list of pages
    var pageList = document.createElement("ul")

    pages.forEach(page => {
      var pageItem = document.createElement("li")
      pageList.appendChild(pageItem)

      var pageLink = document.createElement("a")
      pageLink.href = `?id=${window["id"]}&page=${page.title}`
      pageLink.innerText = page.title

      pageItem.appendChild(pageLink)
    })

    wiki.appendChild(pageList)
  }
  // If it starts with "special:", then show that special page
  else if (pageId.startsWith("Special:")) {
    // Remove the edit button from the page
    document.querySelector("label[for='editMode']").remove()
    // Get the special page name
    var special = pageId.substring(8)

    if (special == "Categories") {
      // Get all the categories
      var categories = Array.from(new Set(objects.filter(e => e.categories).flatMap(e => e.categories))).sort()

      // Add the title
      titleText.innerText += "Special Page"

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `All Categories`
      wiki.appendChild(subtitle)

      // Create the list of categories
      var categoryList = document.createElement("ul")

      categories.forEach(category => {
        var categoryItem = document.createElement("li")
        categoryList.appendChild(categoryItem)

        var categoryLink = document.createElement("a")
        categoryLink.href = `?id=${window["id"]}&page=Category:${category}`
        categoryLink.innerText = category

        categoryItem.appendChild(categoryLink)
      })

      wiki.appendChild(categoryList)
    }
    else if (special == "Random") {
      // Get all the categories
      var categories = Array.from(new Set(objects.filter(e => e.categories).flatMap(e => e.categories))).sort()

      // Get a random number between 0 and the number of categories + objects + 1 (for the main page)
      var random = Math.floor(Math.random() * (categories.length + objects.length + 1))

      if (random == 0) {
        // Go to the main page
        window.location.href = `?id=${window["id"]}`
      }
      else if (random <= categories.length) {
        // Go to a random category page
        window.location.href = `?id=${window["id"]}&page=Category:${categories[random - 1]}`
      }
      else {
        // Go to a random object page
        window.location.href = `?id=${window["id"]}&page=${objects[random - categories.length - 1].title}`
      }
    }
    else if (special == "Weak") {
      // Add the title
      titleText.innerText += "Special Page"

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `Weak and Invalid Pages`
      wiki.appendChild(subtitle)

      // Create the list of invalid tags
      var invalidTagList = document.createElement("ul")
      invalidTagList.setAttribute("headerText", "Non-Existent Pages")

      // Get all tags that don't have a corresponding object (will be a string, not a number)
      var invalidTags = Array.from(new Set(objects.filter(e => e.tags).map(e => e.tags).flat().filter(e => typeof e == "string")))

      // Get all links within infoboxes that don't have a corresponding object
      objects.forEach(object => {
        if (object.content && object.content.infobox) {
          var i = object.content.infobox

          // Loop through the rows
          for (var key in i.content) {
            // Make a copy of the cell content
            var cellContent = i.content[key]

            // Loop and extract until there are no more links / text
            while (cellContent) {
              if (cellContent.startsWith("[!")) {
                // Get the link block
                var link = cellContent.substring(cellContent.indexOf("[!") + 2, cellContent.indexOf("]"))

                // Get the destination
                var destination = link.split("|")[0]

                // Get the text (if it exists)
                var text = link.split("|")[1] || destination

                // Add to the list
                invalidTags.push(destination)

                // Remove the link from the cell content
                cellContent = cellContent.substring(cellContent.indexOf("]") + 1, cellContent.length)
              }
              else {
                // Get the text up to the next link
                var text = cellContent.split("[!")[0]

                // Remove the text from the cell content (if another link exists)
                if (cellContent.includes("[!")) {
                  cellContent = cellContent.substring(cellContent.indexOf("[!"), cellContent.length)
                }
                else {
                  cellContent = null
                }
              }
            }
          }
        }
      })

      // Sort alphabetically and remove any duplicates
      invalidTags = Array.from(new Set(invalidTags)).sort()

      invalidTags.forEach(tag => {
        var invalidTagItem = document.createElement("li")
        invalidTagList.appendChild(invalidTagItem)

        var invalidTagLink = document.createElement("a")
        invalidTagLink.href = `?id=${window["id"]}&page=${tag}`
        invalidTagLink.innerText = tag
        invalidTagLink.classList.add("invalid")

        invalidTagItem.appendChild(invalidTagLink)
      })

      wiki.appendChild(invalidTagList)

      // Create the list of weak objects
      var weakObjectList = document.createElement("ul")
      weakObjectList.setAttribute("headerText", "Pages with Default Values")

      // Loop through all the objects, checking them against their type's default title and description
      objects.forEach(object => {
        switch (object.class) {
          case "Head":
            if (["", "New Head Block"].includes(object.title) || ["", "A storyline, event or person."].includes(object.description)) {
              var weakObjectItem = document.createElement("li")
              weakObjectList.appendChild(weakObjectItem)

              var weakObjectLink = document.createElement("a")
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title}`
              weakObjectLink.innerText = object.title

              var weakness = document.createElement("span")
              weakness.innerText = ` (Default ${["", "New Head Block"].includes(object.title) ? "Title" : "Description"}${["", "A storyline, event or person."].includes(object.description) && ["", "New Head Block"].includes(object.title) ? " and Description" : ""})`

              weakObjectItem.appendChild(weakObjectLink)
              weakObjectItem.appendChild(weakness)
            }
            break
          case "Sub":
            if (["", "New Sub Block"].includes(object.title) || ["", "A specific event"].includes(object.description)) {
              var weakObjectItem = document.createElement("li")
              weakObjectList.appendChild(weakObjectItem)

              var weakObjectLink = document.createElement("a")
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title}`
              weakObjectLink.innerText = object.title

              var weakness = document.createElement("span")
              weakness.innerText = ` (Default ${["", "New Sub Block"].includes(object.title) ? "Title" : "Description"}${["", "A specific event"].includes(object.description) && ["", "New Sub Block"].includes(object.title) ? " and Description" : ""})`

              weakObjectItem.appendChild(weakObjectLink)
              weakObjectItem.appendChild(weakness)
            }
            break
          case "Era":
            if (["", "New Era"].includes(object.title) || ["", "Description of this era"].includes(object.description)) {
              var weakObjectItem = document.createElement("li")
              weakObjectList.appendChild(weakObjectItem)

              var weakObjectLink = document.createElement("a")
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title}`
              weakObjectLink.innerText = object.title

              var weakness = document.createElement("span")
              weakness.innerText = ` (Default ${["", "New Era"].includes(object.title) ? "Title" : "Description"}${["", "Description of this era"].includes(object.description) && ["", "New Era"].includes(object.title) ? " and Description" : ""})`

              weakObjectItem.appendChild(weakObjectLink)
              weakObjectItem.appendChild(weakness)
            }
            break
          }
      })

      wiki.appendChild(weakObjectList)
    }
    else if (special == "SpecialPages") {
      // Add the title
      titleText.innerText += "Special Pages"

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `Special Pages`
      wiki.appendChild(subtitle)

      // Create the list of special pages
      var specialPageList = document.createElement("ul")
      specialPageList.setAttribute("headerText", "Special Pages")
      specialPageList.innerHTML = `
        <li><a href="?id=${window["id"]}&page=Special:Categories">All Categories</a></li>
        <li><a href="?id=${window["id"]}&page=Special:Random">Random Page</a></li>
        <li><a href="?id=${window["id"]}&page=Special:Weak">Weak and Invalid Pages</a></li>
        <li><a href="?id=${window["id"]}&page=Special:SpecialPages">Special Pages</a></li>
      `
      wiki.appendChild(specialPageList)
    }
  }
  else {
    // If a page ID is provided, then get that object
    var page = objects.find(e => e.title == pageId)

    // If that id doesn't exist, then set 'page.class' to null
    if (page == undefined) {
      page = {class: null}
    }
    else {
      window["page"] = page.id
    }

    // Create a new document element for the timeline
    var iframe = document.createElement("iframe")
    iframe.id = "wikiMap"
    iframe.src = "../map/map.html?id=wikiMap"

    if (page.content && page.content.infobox) {
      var i = page.content.infobox

      // Make the infobox table
      var infobox = document.createElement("table")
      infobox.classList.add("infobox")
      wiki.appendChild(infobox)

      // Make the infobox caption
      var caption = document.createElement("caption")
      infobox.appendChild(caption)

      // Make the caption title
      var captionTitle = document.createElement("h3")
      captionTitle.setAttribute("prop-ref", "content.infobox.banner.title")
      caption.appendChild(captionTitle)
      textSet(captionTitle, i.banner.title)

      // Make the caption subtitle
      var captionSubtitle = document.createElement("h4")
      captionSubtitle.setAttribute("prop-ref", "content.infobox.banner.subtitle")
      caption.appendChild(captionSubtitle)
      textSet(captionSubtitle, i.banner.subtitle)

      // Create the table body
      var tableBody = document.createElement("tbody")
      infobox.appendChild(tableBody)

      // Loop through the rows
      for (var key in i.content) {
        // Make the row
        var row = document.createElement("tr")
        tableBody.appendChild(row)

        // Make the key cell
        var keyCell = document.createElement("th")
        keyCell.setAttribute("prop-ref", `content.infobox.content.${key}!`)
        row.appendChild(keyCell)
        textSet(keyCell, key)

        // Make the value cell
        var valueCell = document.createElement("td")
        valueCell.setAttribute("prop-ref", `content.infobox.content.${key}`)
        row.appendChild(valueCell)
        textSet(valueCell, i.content[key])
      }
    }

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

      // Get all heads and subs
      var events = objects.filter(e => ["Head", "Sub"].includes(e.class))

      // Get all the events that happened during that time period
      // If era is the last era, then it will get those that have an x position greater than the era's start
      if (eraEnd == null) {
        events = events.filter(e => e.position[0] > eraStart)
      }
      // Otherwise, it will get those that have an x position greater than the era's start and less than the era's end
      else {
        events = events.filter(e => e.position[0] > eraStart && e.position[0] < eraEnd)
      }

      // Get all objects that are either A) in the events array or B) have both a parent and child that are in the events array
      var incLinks = objects.filter(e => events.includes(e) || (e.class == "Link" && objects.find(o => o.id == e.parentId && events.includes(o)) && objects.find(o => o.id == e.childId && events.includes(o))))

      var heads = incLinks.map(e => {
        if (e.class == "Sub") {
          // Return the head if not already this array or within the incLinks array
          return objects.find(o => o.id == e.headId)
        }
      })

      // Remove nulls, duplicates, and any heads that are already in the incLinks array
      heads = new Set(heads.filter(e => e != null && !incLinks.includes(e)))

      // Give each head an attribute to hide it
      heads.forEach(e => e.hidden = true)

      // Merge the heads array into the incLinks array
      var incHidden = incLinks.concat([...heads])

      // Add the objects to the iframe
      iframe.setAttribute("objects", JSON.stringify(incHidden))

      // Add the title
      titleText.innerText += "Era Page"

      var subtitle = document.createElement("h2");
      subtitle.setAttribute("prop-ref", "title")
      wiki.appendChild(subtitle);
      textSet(subtitle, page.title)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = "This is the era page for this timeline. Click on a link below to go to a specific event page."
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.setAttribute("prop-ref", "description")
      wiki.appendChild(description2)
      textSet(description2, page.description)

      // Fill the embed with the events
      wiki.appendChild(iframe)

      // Create a contents table to be populated later
      var contents = document.createElement("ol")

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

        // Create the head page link
        var headPage = document.createElement("a")
        headPage.href = `?id=${window["id"]}&page=${head.title}`
        headPage.innerText = head.title

        // Create the head page text
        var headPageText = document.createElement("span")
        headPageText.classList.add("note")
        headPageText.innerText = "See Main Page: "
        
        // Add the head page link to the text and then to the section
        headPageText.appendChild(headPage)
        section.appendChild(headPageText)

        // Check if it has a main article
        if (head.mainArticle != undefined) {
          // Create the main article link
          var mainArticleLink = document.createElement("a")
          mainArticleLink.href = `?id=${window["id"]}&page=${objects.find(e => e.id == head.mainArticle).title}`
          mainArticleLink.innerText = objects.find(e => e.id == head.mainArticle).title

          // Create the main article text
          var mainArticleText = document.createElement("span")
          mainArticleText.classList.add("note")
          mainArticleText.innerText = "See Main Article: "
          
          // Add the main article link to the text and then to the section
          mainArticleText.appendChild(mainArticleLink)
          section.appendChild(mainArticleText)
        }

        // Create the description
        var sectionDescription = document.createElement("p")
        sectionDescription.innerText = head.description
        section.appendChild(sectionDescription)

        // Loop through all the subs nodes that are children of the head node
        var subs = events.filter(e => e.headId == head.id)
        subs.forEach(sub => {
          // Create the sub title
          var subTitle = document.createElement("h4")
          subTitle.innerText = sub.title
          subTitle.id = sub.id
          section.appendChild(subTitle)

          // Check if it has a main article
          if (sub.mainArticle != undefined) {
            console.log(objects.find(e => e.id == sub.mainArticle).title)
            // Create the main article link
            var mainArticleLink = document.createElement("a")
            mainArticleLink.href = `?id=${window["id"]}&page=${objects.find(e => e.id == sub.mainArticle).title}`
            mainArticleLink.innerText = objects.find(e => e.id == sub.mainArticle).title

            // Create the main article text
            var mainArticleText = document.createElement("span")
            mainArticleText.classList.add("note")
            mainArticleText.innerText = "See Main Article: "
            
            // Add the main article link to the text and then to the section
            mainArticleText.appendChild(mainArticleLink)
            section.appendChild(mainArticleText)
          }

          // Create the sub description
          var subDescription = document.createElement("p")
          subDescription.innerText = sub.description
          section.appendChild(subDescription)
        })

        // Add to table of contents
        var contentsItem = document.createElement("li")
        contents.appendChild(contentsItem)

        var contentsLink = document.createElement("a")
        contentsLink.href = `#${head.id}`
        contentsLink.innerText = head.title
        contentsItem.appendChild(contentsLink)
      })
    }
    // If it's a head page, then show the details of that event and its subs
    else if (page.class == "Head") {
      // Add the title
      titleText.innerText += "Head Page"

      var subtitle = document.createElement("h2")
      subtitle.setAttribute("prop-ref", "title")
      wiki.appendChild(subtitle)
      textSet(subtitle, page.title)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = "This is the event page for this timeline. Click on a link below to go to a specific sub page."
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.setAttribute("prop-ref", "description")
      wiki.appendChild(description2)
      textSet(description2, page.description)

      var subs = objects.filter(e => e.headId == page.id)

      // Get all links related to any of the subs
      var links = objects.filter(e => e.class == "Link" && objects.find(o => o.id == e.parentId && subs.includes(o)) || objects.find(o => o.id == e.childId && subs.includes(o)))

      // Get the destinations of all the links
      var destinations = links.map(e => {
        // Only run if only one destination node is within the subs array, don't run if both or neither are
        if (subs.includes(objects.find(o => o.id == e.parentId)) != subs.includes(objects.find(o => o.id == e.childId))) {
          // Return the link and the destination node (the one that isn't in the subs array)
          // Both nodes will now have the toggle attribute set to true
          e.toggle = true
          var destination = subs.includes(objects.find(o => o.id == e.parentId)) ? objects.find(o => o.id == e.childId) : objects.find(o => o.id == e.parentId)
          destination.toggle = true
          return [e, destination]
        }
      })

      // Remove nulls and duplicates
      destinations = new Set(destinations.filter(e => e != null))

      // Add all links and destinations to the incLinks array (flattened)
      var incLinks = subs.concat([...destinations].flat())

      // Get all heads required for the subs
      var heads = incLinks.map(e => {
        if (e.class == "Sub") {
          // Return the head if not already this array or within the incLinks array
          return objects.find(o => o.id == e.headId)
        }
      })

      // Remove nulls, duplicates, and any heads that are already in the incLinks array
      heads = new Set(heads.filter(e => e != null && !incLinks.includes(e)))

      // Give each head an attribute to hide it (unless it's the page head)
      heads.forEach(e => e.hidden = e.id != page.id)

      // Merge the heads array into the incLinks array
      var incHidden = incLinks.concat([...heads])

      // Add the objects to the iframe
      iframe.setAttribute("objects", JSON.stringify(incHidden))

      // Fill the embed with the subs
      wiki.appendChild(iframe)

      // Create a contents table to be populated later
      var contents = document.createElement("ol")

      contents.classList.add("toc")

      wiki.appendChild(contents)

      // Create the subs
      subs.forEach(sub => {
        // Create the sub title
        var subTitle = document.createElement("h4")
        subTitle.innerText = sub.title
        subTitle.id = sub.id

        wiki.appendChild(subTitle)

        // Create the sub page link
        var subPage = document.createElement("a")
        subPage.href = `?id=${window["id"]}&page=${sub.title}`
        subPage.innerText = sub.title

        // Create the sub page text
        var subPageText = document.createElement("span")
        subPageText.classList.add("note")
        subPageText.innerText = "See Main Page: "
        
        // Add the sub page link to the text and then to the section
        subPageText.appendChild(subPage)
        wiki.appendChild(subPageText)

        // Check if it has a main article
        if (sub.mainArticle != undefined) {
          // Create the main article link
          var mainArticleLink = document.createElement("a")
          mainArticleLink.href = `?id=${window["id"]}&page=${objects.find(e => e.id == sub.mainArticle).title}`
          mainArticleLink.innerText = objects.find(e => e.id == sub.mainArticle).title
          
          // Create the main article text
          var mainArticleText = document.createElement("span")
          mainArticleText.classList.add("note")
          mainArticleText.innerText = "See Main Article: "

          // Add the main article link to the text and then to the section
          mainArticleText.appendChild(mainArticleLink)
          wiki.appendChild(mainArticleText)
        }

        // Create the sub description
        var subDescription = document.createElement("p")
        subDescription.innerText = sub.description
        wiki.appendChild(subDescription)

        // Add to table of contents
        var contentsItem = document.createElement("li")
        contents.appendChild(contentsItem)

        var contentsLink = document.createElement("a")
        contentsLink.href = `#${sub.id}`
        contentsLink.innerText = sub.title
        contentsItem.appendChild(contentsLink)
      })
    }
    // If it's a link or sub then show a placeholder telling the user that no such feature exists yet
    else if (page.class == "Link" || page.class == "Sub") {
      // Add the title
      titleText.innerText += page.class + " Page"

      var subtitle = document.createElement("h2")
      if (page.type == "Sub") subtitle.setAttribute("prop-ref", "title")
      wiki.appendChild(subtitle)
      textSet(subtitle, (page.title) ? page.title : `${objects.find(e => e.id == page.parentId).title} --${page.type.toUpperCase()}--> ${objects.find(e => e.id == page.childId).title}`)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = `This is the page for this ${page.class}. This feature is not yet implemented.`
      wiki.appendChild(description)
    }
    // If the page is a wiki page, then show the plaintext with a message stating this is not yet implemented
    else if (page.class == "Info") {
      // Add the title
      titleText.innerText += "Custom Page"

      var subtitle = document.createElement("h2")
      subtitle.innerText = page.title
      subtitle.setAttribute("prop-ref", "title")
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = `This is the wiki page for a concept within this timeline, the raw data will be shown below.\nThe formatting of this page has not yet been implemented.`
      wiki.appendChild(description)

      // Create the raw data
      var raw = document.createElement("pre")
      raw.innerText = JSON.stringify(page.content, null, 2)
      wiki.appendChild(raw)
    }
    // Lastly, if the class is unknown, then tell the user the classic "this page does not exist... make one if you want" stuff
    else if (page.class == null && url.searchParams.get("new") == null) {
      // Add the title
      titleText.innerText += "Non-Existent Page"

      var subtitle = document.createElement("h2")
      subtitle.innerText = pageId
      wiki.appendChild(subtitle)

      // Create the description (with a link inside)
      var description = document.createElement("p")
      description.innerText = `This page does not exist. You can create it by clicking the link below.\n`
      wiki.appendChild(description)

      var link = document.createElement("a")
      link.href = `?id=${window["id"]}&new&page=${pageId}`
      link.innerText = `Create "${pageId}" Page`
      description.appendChild(link)
    }
    // If the page is new, then show the new page form
    else if (url.searchParams.get("new") != null) {
      // Add the title
      titleText.innerText += "New Page"

      var subtitle = document.createElement("h2")
      subtitle.innerText = "New Page Form"
      wiki.appendChild(subtitle)

      // Create the form
      var form = document.createElement("form")
      form.id = "newPageForm"
      wiki.appendChild(form)

      // Create the title input
      var titleLabel = document.createElement("h3")
      titleLabel.innerText = "Title:"
      form.appendChild(titleLabel)

      var title = document.createElement("input")
      title.type = "text"
      title.id = "title"
      title.value = pageId
      title.placeholder = "Title"
      title.required = true
      form.appendChild(title)

      // Show list of templates
      var tempsText = document.createElement("h3")
      tempsText.innerText = "Template:"
      form.appendChild(tempsText)

      var temps = document.createElement("select")
      temps.id = "templates"
      form.appendChild(temps)

      // Add the default option ('none')
      var none = document.createElement("option")
      none.value = "none"
      none.innerText = "None"
      temps.appendChild(none)

      // Add the other options (all in the template category)
      var options = objects.filter(e => e.categories && e.categories.includes("Templates"))

      options.forEach(e => {
        var option = document.createElement("option")
        option.value = e.id
        option.innerText = e.title
        temps.appendChild(option)
      })

      // Add the 'create' button
      var create = document.createElement("button")
      create.innerText = "Create"
      create.type = "submit"
      form.appendChild(create)

      // Configure the submit event
      form.onsubmit = function(e) {
        e.preventDefault()

        // Get the title
        var title = document.getElementById("title").value

        // Make sure the title is available
        if (objects.some(obj => obj.title == title)) {
          notify("Page already exists with that title!")
          return
        }

        // Get the template
        var template = document.getElementById("templates").value

        // Get the first available ID
        var id = 0
        while (objects.some(obj => obj.id == id)) {
            id++
        }

        // Add 1 again if the id already exists
        if (objects.some(obj => obj.id == id)) id++

        // Copy the template (if selected)
        var temp = (template == "none") ? {} : objects.find(obj => obj.id == template).content

        // Create the object
        var obj = {
          "id": id,
          "title": title,
          "description": "Short description...",
          "class": "Info",
          "content": temp,
          "tags": [],
          "categories": []
        }

        console.log(obj)

        // Add the object to the list
        objects.push(obj)

        // Save the list of objects (with callback)
        saveObjects(function () {
          // Redirect to the new page
          window.location.href = `?id=${window["id"]}&edit&page=${obj.title}`
        })
      }
    }

    // Add 'tags' and 'categories' sections if they exist (in collapsable divs)
    if (page.tags) {
      // Create the tags section
      var tags = document.createElement("div")
      tags.classList.add("collapsable", "collapsed")

      // Create the header
      var tagsHeader = document.createElement("h3")
      tagsHeader.innerText = "Tags"
      tags.appendChild(tagsHeader)

      // Toggle 'collapsed' class on click
      tagsHeader.addEventListener("click", () => tags.classList.toggle("collapsed"))

      // Create the content
      var tagsList = document.createElement("ul")
      tagsList.setAttribute("prop-ref", "tags")
      tags.appendChild(tagsList)
      textSet(tagsList, page.tags.map(e => typeof e == "string" ? `[${e}]` : `[!${e}]`).join(", "))
      wiki.appendChild(tags)
    }

    if (page.categories) {
      // Create the categories section
      var categories = document.createElement("div")
      categories.classList.add("collapsable", "collapsed")

      // Create the header
      var categoriesHeader = document.createElement("h3")
      categoriesHeader.innerText = "Categories"
      categories.appendChild(categoriesHeader)

      // Toggle 'collapsed' class on click
      categoriesHeader.addEventListener("click", () => categories.classList.toggle("collapsed"))

      // Create the content
      var categoriesList = document.createElement("ul")
      categoriesList.setAttribute("prop-ref", "categories")
      categories.appendChild(categoriesList)
      wiki.appendChild(categories)
      textSet(categoriesList, page.categories.join(", "))
    }

    // Add a 'what links here' section
    var refsSection = document.createElement("div")
    refsSection.classList.add("collapsable", "collapsed")
    wiki.appendChild(refsSection)

    // Create the header
    var refsHeader = document.createElement("h3")
    refsHeader.innerText = "What links here?"
    refsSection.appendChild(refsHeader)

    // Toggle 'collapsed' class on click
    refsHeader.addEventListener("click", () => refsSection.classList.toggle("collapsed"))

    // Create the content
    var refsList = document.createElement("ul")
    refsSection.appendChild(refsList)

    // Get all pages with this in their tags (will be a string)
    var pageRefs = Array.from(new Set(objects.filter(e => e.tags && e.tags.includes(pageId)).map(e => e.title)))

    var id = objects.find(e => e.title == pageId).id

    // Get all links within infoboxes that link to this page
    objects.forEach(object => {
      if (object.content && object.content.infobox && !pageRefs.includes(object.title)) {
        var i = object.content.infobox

        // Loop through the rows
        for (var key in i.content) {
          // Make a copy of the cell content
          var cellContent = i.content[key]

          // Check if '[{title}]', '[{title}|', `[!{id}]`, or `[!{id}|` is in the cell content
          if (cellContent.includes(`[${pageId}]`) || cellContent.includes(`[${pageId}|`) || cellContent.includes(`[!${id}]`) || cellContent.includes(`[!${id}|`)) {
            // Add the title to the list of tag refs
            pageRefs.push(object.title)

            // Stop checking this one as it's already been added
            break
          }
        }
      }
    })

    // Sort alphabetically
    pageRefs.sort()

    pageRefs.forEach(ref => {
      var refItem = document.createElement("li")
      var refLink = document.createElement("a")
      refLink.href = `?id=${window["id"]}&page=${ref}`
      refLink.innerText = ref
      refItem.appendChild(refLink)
      refsList.appendChild(refItem)
    })

    if (pageRefs.length == 0) {
      var refItem = document.createElement("li")
      refItem.innerText = "None"
      refsList.appendChild(refItem)
    }
  }

  // Remove the table of contents if it exists and is empty
  if (document.querySelector(".toc") && !document.querySelector(".toc > li")) document.querySelector(".toc").remove()

  // Set the title of the tab
  document.getElementsByTagName("title")[0].innerText = `${document.querySelector("h2").innerText} | ${window["mapSettings"].title}`

  // If page syncs on edit then re-enter edit mode, or if edit is in the url
  if (window["editing"]) {
    window["editing"] = false
    toggleEdit(false)
  }
}

function helpMenu() {
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

function settingsMenu() {
  // If the popup is already open, close it.
  if (document.getElementById("popup").style.visibility == "visible") {
    document.getElementById("popup").style.visibility = "hidden";
    document.getElementById("popup").innerHTML = "";
    return;
  }

  // Set the popup to be visible.
  document.getElementById("popup").style.visibility = "visible";

  // Create the popup with the raw objects data to be edited.
  var popup = document.getElementById("popup");

  // Create the popup title
  var title = document.createElement("h1");
  title.innerText = "Edit Objects (Crude JSON Editor For Now)";
  popup.appendChild(title);

  // Show the raw objects data (formatted at the least), (don't include 'hidden' and 'toggle' attributes within each object)
  var raw = document.createElement("textarea");
  raw.id = "raw";
  raw.value = JSON.stringify(objects.map(e => Object.keys(e).reduce((obj, key) => (key != "hidden" && key != "toggle") ? {...obj, [key]: e[key]} : obj, {})), null, 2);
  
  raw.style.height = "40em";
  popup.appendChild(raw);

  // Create the save button
  var save = document.createElement("button");
  save.innerText = "Save";
  save.onclick = function() {
    // Save the objects
    objects = JSON.parse(document.getElementById("raw").value);
    saveObjects();

    // Close the popup
    document.getElementById("popup").style.visibility = "hidden";
    document.getElementById("popup").innerHTML = "";
  }
  popup.appendChild(save);
}

function saveObjects(callback = null) {
  var data = JSON.stringify(objects)

  // Update firestore document
  db.collection("timelines").doc(window["mapSettings"].id).update({
      map: data,
      lastChange: sessionStorage.getItem("ID")
  }).then(() => {
    // If callback exists then call it
    if (callback) callback()
  })
}

function toggleEdit(alert = true) {
  // Toggle the edit mode
  window["editing"] = !window["editing"]

  var url = new URL(window.location.href)
  
  // Show message stating the toggle
  if (window["editing"] && window["page"]) {
    var page = objects.find(e => e.id == window["page"])

    // Add 'edit' to the URL without reloading the page (if it doesn't already exist)
    if (url.searchParams.get("edit") == null) {
      url.searchParams.append("edit", '')
      window.history.pushState({}, "", url)
    }

    if (alert) notify("Edit Mode Enabled")
    document.getElementById("wikiPage").classList = "editing"

    // Get all with the 'prop-ref' attribute and make them editable
    document.querySelectorAll("[prop-ref]").forEach(e => {
      e.contentEditable = true

      e.addEventListener("focus", () => {
        if (e.getAttribute("prop-ref").endsWith("!")) return

        e.innerText = formatSet((["tags", "categories"].includes(e.getAttribute("prop-ref"))) ? page.tags.map(e => typeof e == "string" ? `[${e}]` : `[!${e}]`).join(", ") : e.getAttribute("prop-ref").split(".").reduce((obj, i) => obj[i], page))
      })
      e.addEventListener("blur", () => {
        var set = formatSet(e.innerText, true)

        if (!e.getAttribute("prop-ref").endsWith("!")) {
          e.getAttribute("prop-ref").split(".").reduce((obj, i, index, array) => {
            console.log(obj, i, index, array)
            if (index == array.length - 1) {
              if (["tags", "categories"].includes(i)) {
                set = set.split(", ").map(e => e.startsWith("[!") ? Number(e.slice(2, -1)) : e.slice(1, -1))
              }
              obj[i] = set
            } else {
              return obj[i]
            }
          }, page)
        } else {
          // Get the value past the last dot
          var prop = e.getAttribute("prop-ref").split(".").slice(-1)[0].slice(0, -1)
          var parentProp = e.getAttribute("prop-ref").split(".").slice(0, -1).reduce((obj, i) => obj[i], page) || page

          var newParentProp = {}

          // Loop through the parentProp, adding each property to the newParentProp, except for the one that matches the prop we're changing
          Object.keys(parentProp).forEach(key => {
            if (key != prop) newParentProp[key] = parentProp[key];
            else newParentProp[e.innerText] = parentProp[key];
          })

          // Set the parentProp to the newParentProp
          e.getAttribute("prop-ref").split(".").slice(0, -1).reduce((obj, i, index, array) => {
            // If it's the parentProp, set it to the newParentProp and end the loop
            if (index == array.length - 1) {
              obj[i] = newParentProp
            }
            // Otherwise, return the next object
            else {
              return obj[i]
            }
          }, page)

          // Change all prop-refs that start with 'content.infobox.content.Born' to start with 'content.infobox.content.{e.innerText}'
          document.querySelectorAll("[prop-ref]").forEach(el => {
            if (el.getAttribute("prop-ref").startsWith(e.getAttribute("prop-ref").split(".").slice(0, -2).join("."))) {
              el.setAttribute("prop-ref", el.getAttribute("prop-ref").replace(prop, set))
            }
          })
        }

        saveObjects()

        textSet(e, (typeof set == "object" ? set.map(e => typeof e == "string" ? `[${e}]` : `[!${e}]`).join(", ") : set), typeof set == "object")
      })
    })
  } else if (window["page"]) {
    // Remove 'edit' from the URL without reloading the page (if it exists)
    if (url.searchParams.get("edit") != undefined) {
      url.searchParams.delete("edit")
      window.history.pushState({}, "", url)
    }

    if (alert) notify("Edit Mode Disabled")
    document.getElementById("wikiPage").classList = ""

    // Get all with the 'prop-ref' attribute and make them uneditable
    document.querySelectorAll("[prop-ref]").forEach(e => {
      e.contentEditable = false
      // Remove event listeners by replacing with a clone
      e.parentNode.replaceChild(e.cloneNode(true), e)
    })
  }
}

function textSet(element, text, replace = false) {
  if (replace) element.innerHTML = ""

  // If the value is empty then set it to "N/A"
  if (text == "") text = "N/A"

  // If the value is "N/A" or [] then set the class to 'hidden', if not then remove the class
  // If it's a table cell or has a prop-ref of "categories" or "tags" then add the 'hidden' class to the parent element
  if (text == "N/A" || text == []) {
    if (element.tagName == "TD" || (element.getAttribute("prop-ref") && ["categories", "tags"].includes(element.getAttribute("prop-ref")))) element.parentElement.classList.add("hidden")
    else element.classList.add("hidden")
  }
  else {
    if (element.tagName == "TD" || (element.getAttribute("prop-ref") && ["categories", "tags"].includes(element.getAttribute("prop-ref")))) element.parentElement.classList.remove("hidden")
    else if (element.classList) element.classList.remove("hidden")
  }

  if (element.getAttribute("prop-ref") && element.getAttribute("prop-ref") == "categories") {
    text.split(", ").forEach((category, index) => {
      var categoryItem = document.createElement("li")
      element.appendChild(categoryItem)

      var categoryLink = document.createElement("a")
      categoryLink.href = `?id=${window["id"]}&page=Category:${category}`
      categoryLink.innerText = category
      categoryItem.appendChild(categoryLink)

      // If the category is not the last one, add a comma and space
      if (index != text.split(", ").length - 1) {
        var categoryComma = document.createElement("span")
        categoryComma.innerText = ", "
        categoryItem.appendChild(categoryComma)
      }
    })
    return
  }
  // Loop and extract until there are no more links / text
  while (text) {
    if (text[0] == "[") {
      // Get the link block
      // Do the end bracket or the end of the string, whichever comes first
      var link = text.substring(text.indexOf("[") + 1, text.indexOf("]") || text.length)

      // Get the destination
      var destination = link.split("|")[0]

      // Find the destination object ( {!id} is valid, but not {id}), if invalid then try to get the object with that title
      var destObj = (destination.startsWith("!")) ? objects.find(e => e.id == destination.substring(1)) : objects.find(e => e.title == destination)

      // If it is valid, then set 'destination' to the title of that object
      if (destObj) destination = destObj.title

      // Get the innerText (if it exists)
      var innerText = link.split("|")[1] || destination

      // Make the link
      var linkElement = document.createElement("a")
      linkElement.href = (destObj) ? `?id=${window["id"]}&page=${destObj.title}` : `?id=${window["id"]}&new&page=${destination}`
      linkElement.innerText = innerText
      if (destObj && destObj.description) {
        linkElement.setAttribute("link-desc", destObj.description)
      }
      else if (!destObj) {
        linkElement.classList.add("invalid")
        linkElement.setAttribute("link-desc", `Create "${destination}"?`)
      }
      else linkElement.setAttribute("link-desc", "No description")
      element.appendChild(linkElement)

      // Remove the link from the text
      text = text.substring(text.indexOf("]") + 1 || text.length, text.length)
    }
    else {
      // Get the text up to the next link
      var textSeg = text.split("[")[0]

      // Loop through swapping out new lines for breaks
      while (textSeg) {
        // Get the text up to the new line
        if (textSeg[0] == "\n") {
          element.appendChild(document.createElement("br"))

          // Remove the new line from the text
          textSeg = textSeg.substring(1, textSeg.length)
        }
        // Otherwise, add the text
        else {
          element.appendChild(document.createTextNode(textSeg.split("\n")[0]))

          // Remove the text from the text
          textSeg = textSeg.substring(textSeg.indexOf("\n"), textSeg.length)

          // If there are no more new lines, then break
          if (!textSeg.includes("\n")) break
        }
      }

      // Remove the text from the cell content (if another link exists)
      if (text.includes("[")) {
        text = text.substring(text.indexOf("["), text.length)
      }
      else {
        text = null
      }
    }
  }
}

function formatSet(text, forCode = false) {
  if (forCode) {
    var toReturn = text
    var indexOffset = 0

    // Loop through each link [title] or [title|text]
    // Replace the title with the id of the object (if it exists) [!id] or [!id|text]
    while (text.includes("[") && text.includes("]")) {
      // Get the link block
      // Do to the first end bracket, vertical bar, or end of the string, whichever comes first
      var link = text.substring(text.indexOf("[") + 1, text.indexOf("]") || text.indexOf("|") || text.length)

      // Swap the title with the id
      var prevLen = toReturn.length

      if (objects.find(e => e.title == link)) {
        // Don't replace, use the indexes to replace
        toReturn = toReturn.substring(0, text.indexOf("[") + indexOffset) + `[!${objects.find(e => e.title == link).id}]` + toReturn.substring(text.indexOf("]") + indexOffset + 1, toReturn.length)
      }

      // Update the index offset
      indexOffset -= (prevLen - toReturn.length)

      // Remove the link from the text
      var prevLen = text.length
      text = text.substring(text.indexOf("]") + 1 || text.length, text.length)

      // Update the index offset
      indexOffset += (prevLen - text.length)

      console.log(toReturn, text)
    }

    text = toReturn
  }
  else {
    var toReturn = text
    var indexOffset = 0

    // Loop through each link [!id] or [!id|text]
    // Replace the id with the title of the object (if it exists) [title] or [title|text]
    while (text.includes("[!") && text.includes("]")) {
      // Get the link block
      // Do to the first end bracket, vertical bar, or end of the string, whichever comes first
      var link = text.substring(text.indexOf("[!") + 2, text.indexOf("]") || text.indexOf("|") || text.length)

      // Swap the id with the title
      var prevLen = toReturn.length

      if (objects.find(e => e.id == link)) {
        // Don't replace, use the indexes to replace
        toReturn = toReturn.substring(0, text.indexOf("[!") + indexOffset) + `[${objects.find(e => e.id == link).title}]` + toReturn.substring(text.indexOf("]") + indexOffset + 1, toReturn.length)
      }

      // Update the index offset
      indexOffset -= (prevLen - toReturn.length)

      // Remove the link from the text
      var prevLen = text.length
      text = text.substring(text.indexOf("]") + 1 || text.length, text.length)

      // Update the index offset
      indexOffset += (prevLen - text.length)

      console.log(toReturn, text)
    }

    text = toReturn
  }
  return text
}

window.onload = () => {
  var url = new URL(window.location.href)
  if (url.searchParams.get("edit") != null) {
    window["editing"] = false
    toggleEdit(false)
    console.log("Edit mode enabled")
  }
}

// keypress 'e' to toggle edit (if nothing is focused)
document.addEventListener("keypress", e => {
  if (e.key == "e" && document.activeElement == document.body) {
    toggleEdit()
  }
})

// Mouse over link to show description
document.addEventListener("mouseover", e => {
  if (e.target.tagName == "A" && e.target.getAttribute("link-desc")) {
    // Create the tooltip
    let tooltip = document.createElement("span");
    tooltip.id = "tooltip";
    tooltip.innerText = e.target.getAttribute("link-desc");
    document.body.appendChild(tooltip);

    // Position the tooltip
    tooltip.style.left = e.target.getBoundingClientRect().x + e.target.getBoundingClientRect().width / 2 + window.scrollX + "px";
    tooltip.style.top = e.target.getBoundingClientRect().y + e.target.getBoundingClientRect().height + window.scrollY + "px";
  }
})

// Mouse out link to hide description
document.addEventListener("mouseout", e => {
  if (e.target.tagName == "A" && e.target.getAttribute("link-desc") && document.getElementById("tooltip")) document.getElementById("tooltip").remove()
})