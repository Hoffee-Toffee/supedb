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
  titleLink.setAttribute("link-desc", "Go to this wiki's main page")
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
      eraLink.setAttribute("link-desc", era.description || "No description")
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
      headLink.setAttribute("link-desc", head.description || "No description")
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
    specialLink.setAttribute("link-desc", "List of special pages")
    specialTitle.appendChild(specialLink)

    // Show a link to the templates category
    var templateTitle = document.createElement("li")
    links.appendChild(templateTitle)

    var templateLink = document.createElement("a")
    templateLink.href = `?id=${window["id"]}&page=Category:Templates`
    templateLink.innerText = "Page Templates"
    templateLink.setAttribute("link-desc", "List of page templates")
    templateTitle.appendChild(templateLink)

    // Show a link to create a new page
    var newTitle = document.createElement("li")
    links.appendChild(newTitle)

    var newLink = document.createElement("a")
    newLink.href = `?id=${window["id"]}&new`
    newLink.innerText = "Create New Page"
    newLink.setAttribute("link-desc", "Create a new page")
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
      pageLink.setAttribute("link-desc", page.description || "No description")
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
        categoryLink.setAttribute("link-desc", (objects.find(e => e.title == category) || {}).description || "No description")

        categoryItem.appendChild(categoryLink)
      })

      wiki.appendChild(categoryList)
    }
    else if (special == "Random") {
      // Get all the categories
      var categories = Array.from(new Set(objects.filter(e => e.categories).flatMap(e => e.categories))).sort()

      // Get a random number between 0 and the number of categories + objects(without links) + 1 (for the main page)
      var random = Math.floor(Math.random() * (categories.length + objects.filter(e => e.class != "link").length + 1))

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
        window.location.href = `?id=${window["id"]}&page=${objects.filter(e => e.class != "link")[random - categories.length - 1].title}`
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
      var invalidTags = new Set(objects.filter(e => e.tags).map(e => e.tags).flat().filter(e => typeof e == "string"))

      invalidTags = Array.from(invalidTags).sort()

      // Get all links within infoboxes that don't have a corresponding object
      objects.forEach(object => {
        if (object.content && object.content[0] && object.content[0].type && object.content[0].type == "infobox") {
          var i = object.content[0]

          // Loop through each object within the infobox's content
          i.content.forEach(key => {
            // Make a copy of the cell content
            var cellContent = i.content[key].value

            // Loop and extract until there are no more links / text
            while (cellContent) {
              if (cellContent.startsWith("[") && !cellContent.startsWith("[!")) {
                // Get the link block
                var link = cellContent.substring(cellContent.indexOf("[") + 1, cellContent.indexOf("]"))

                // Get the destination
                var destination = link.split("|")[0]

                // Add to the list
                invalidTags.push(destination)

                // Remove the link from the cell content
                cellContent = cellContent.substring(cellContent.indexOf("]") + 1, cellContent.length)
              }
              else if (cellContent.startsWith("[!")) {
                // Get the link block
                var link = cellContent.substring(cellContent.indexOf("[!") + 2, cellContent.indexOf("]"))

                // Get the destination
                var destination = link.split("|")[0]

                // Remove the link from the cell content
                cellContent = cellContent.substring(cellContent.indexOf("]") + 1, cellContent.length)
              }
              else {
                // Remove the text from the cell content (if another link exists)
                if (cellContent.includes("[")) {
                  cellContent = cellContent.substring(cellContent.indexOf("["), cellContent.length)
                }
                else {
                  cellContent = null
                }
              }
            }
          })
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
      weakObjectList.setAttribute("headerText", "Pages with Default or Missing Values")

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
              weakObjectLink.setAttribute("link-desc", object.description || "No description")

              var weakness = document.createElement("span")
              weakness.innerText = ` (${["", "New Head Block"].includes(object.title) ? (object.title == "" ? "Missing Title, " : "Default Title, ") : ""}${["", "A storyline, event or person."].includes(object.description) ? (object.description == "" ? "Missing Description, " : "Default Description, ") : ""})`
              weakness.innerText = weakness.innerText.substring(0, weakness.innerText.length - 3) + ")"

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
              weakObjectLink.setAttribute("link-desc", object.description || "No description")

              var weakness = document.createElement("span")
              weakness.innerText = ` (${["", "New Sub Block"].includes(object.title) ? (object.title == "" ? "Missing Title, " : "Default Title, ") : ""}${["", "A specific event"].includes(object.description) ? (object.description == "" ? "Missing Description, " : "Default Description, ") : ""})`
              weakness.innerText = weakness.innerText.substring(0, weakness.innerText.length - 3) + ")"

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
              weakObjectLink.setAttribute("link-desc", object.description || "No description")

              var weakness = document.createElement("span")
              weakness.innerText = ` (${["", "New Era"].includes(object.title) ? (object.title == "" ? "Missing Title, " : "Default Title, ") : ""}${["", "Description of this era"].includes(object.description) ? (object.description == "" ? "Missing Description, " : "Default Description, ") : ""})`
              weakness.innerText = weakness.innerText.substring(0, weakness.innerText.length - 3) + ")"

              weakObjectItem.appendChild(weakObjectLink)
              weakObjectItem.appendChild(weakness)
            }
            break
          case "Info":
            if (object.title == "" || object.title.startsWith("New Page") || object.description == "") {
              var weakObjectItem = document.createElement("li")
              weakObjectList.appendChild(weakObjectItem)

              var weakObjectLink = document.createElement("a")
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title}`
              weakObjectLink.innerText = object.title
              weakObjectLink.setAttribute("link-desc", object.description || "No description")

              var weakness = document.createElement("span")
              weakness.innerText = ` (${object.title == "" ? "Missing Title, " : ""}${object.title.startsWith("New Page") ? "Default Title, " : ""}${object.description == "" ? "Missing Description, " : ""})`
              weakness.innerText = weakness.innerText.substring(0, weakness.innerText.length - 3) + ")"

              weakObjectItem.appendChild(weakObjectLink)
              weakObjectItem.appendChild(weakness)
            }
            break
        }
      })

      wiki.appendChild(weakObjectList)

      // Create the list of objects without content (only for heads, eras, and info pages)
      var emptyObjectList = document.createElement("ul")
      emptyObjectList.setAttribute("headerText", "Pages without Content")

      // Loop through all the objects, checking if they have any content (or if they do then if it's not empty)
      objects.filter(object => ["Head", "Era", "Info"].includes(object.class) && (!object.content || object.content == "")).sort((a, b) => a.title.localeCompare(b.title)).forEach(object => {
        var emptyObjectItem = document.createElement("li")
        emptyObjectList.appendChild(emptyObjectItem)

        var emptyObjectLink = document.createElement("a")
        emptyObjectLink.href = `?id=${window["id"]}&page=${object.title}`
        emptyObjectLink.innerText = object.title
        emptyObjectLink.setAttribute("link-desc", object.description || "No description")

        emptyObjectItem.appendChild(emptyObjectLink)
      })

      wiki.appendChild(emptyObjectList)
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

    if (page.content && page.content[0] && page.content[0].type == "infobox") {
      var ib = page.content[0]

      // Make the infobox table
      var infobox = document.createElement("table")
      infobox.classList.add("infobox")
      wiki.appendChild(infobox)

      // Make the infobox caption
      var caption = document.createElement("caption")
      infobox.appendChild(caption)

      // Make the caption title
      var captionTitle = document.createElement("h3")
      captionTitle.setAttribute("prop-ref", "content[0].banner.title")
      caption.appendChild(captionTitle)
      textSet(captionTitle, ib.banner.title)

      // Make the caption subtitle
      var captionSubtitle = document.createElement("h4")
      captionSubtitle.setAttribute("prop-ref", "content[0].banner.subtitle")
      caption.appendChild(captionSubtitle)
      textSet(captionSubtitle, ib.banner.subtitle)

      // Create the table body
      var tableBody = document.createElement("tbody")
      infobox.appendChild(tableBody)

      // Loop through the rows
      ib.content.forEach((r, i) => {
        // Make the row
        var row = document.createElement("tr")
        tableBody.appendChild(row)

        // Make the key cell
        var keyCell = document.createElement("th")
        keyCell.setAttribute("prop-ref", `content[0]content[${i}].key`)
        row.appendChild(keyCell)
        textSet(keyCell, r.key)

        // Make the value cell
        var valueCell = document.createElement("td")
        valueCell.setAttribute("prop-ref", `content[0]content[${i}].value`)
        row.appendChild(valueCell)
        textSet(valueCell, r.value)
      })
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
        headPage.setAttribute("link-desc", head.description || "No description")

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
          mainArticleLink.setAttribute("link-desc", objects.find(e => e.id == head.mainArticle).description || "No description")

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
            mainArticleLink.setAttribute("link-desc", objects.find(e => e.id == sub.mainArticle).description || "No description")

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
        subPage.setAttribute("link-desc", sub.description || "No description")

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
          mainArticleLink.setAttribute("link-desc", objects.find(e => e.id == sub.mainArticle).description || "No description")
          
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
    // If it's a sub then show a placeholder telling the user that no such feature exists yet
    else if (page.class == "Sub") {
      // Add the title
      titleText.innerText += "Sub Page"

      var subtitle = document.createElement("h2")
      subtitle.setAttribute("prop-ref", "title")
      wiki.appendChild(subtitle)
      textSet(subtitle, page.title)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = `This is the page for this Sub. This feature is not yet implemented.`
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.setAttribute("prop-ref", "description")
      wiki.appendChild(description2)
      textSet(description2, page.description)
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

      var description2 = document.createElement("p")
      description2.setAttribute("prop-ref", "description")
      wiki.appendChild(description2)
      textSet(description2, page.description)
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

        // Get all tags and links to this page (will only be text form "[title]" or "[title|") and replace them with the id form "[!id]" or "[!id|"
        // Get all tags that don't have a corresponding object (will be a string, not a number)
        // var invalidTags = new Set(objects.filter(e => e.tags).map(e => e.tags).flat().filter(e => typeof e == "string"))
        objects.forEach(object => {
          // Check each tag in the object
          if (object.tags) {
            object.tags = object.tags.map(tag => (tag == title) ? id : tag)
          }

          // Check within the infobox
          if (object.content && object.content[0] && object.content[0].type == "infobox") {
            var ib = object.content[0]

            // Loop through the rows
            ib.content.forEach((r, i) => {
              // Make a copy of the cell content
              var text = r.value

              var newText = ""

              // Loop and extract until there are no more links / text
              while (text) {
                console.log(text, newText)
                if (text.startsWith(`[${title}|`) || text.startsWith(`[${title}]`)) {
                  // Add the id to the new text (plus the "|" or "]")
                  newText += `[!${id}${text[title.length + 1]}`

                  // Remove the link from the text, till the '|', ']', or the end of the text, whichever comes first
                  text = text.substring(Math.min(text.indexOf("|") + 1 || text.length, text.indexOf("]") + 1 || text.length))
                }
                else if (text.startsWith(`[`)) {
                  // If it starts with a '[', then it's a link, so add the text up to the end of the link or the end of the text
                  newText += text.split("]")[0]

                  // Remove the text from the text
                  text = text.substring(text.indexOf("]") || text.length, text.length)
                }
                else {
                  // Get the text up to the next link
                  var textSeg = text.split("[")[0]

                  // Add the text to the new text
                  newText += textSeg

                  // Remove the text from the text (if another link exists)
                  if (text.includes("[")) {
                    text = text.substring(text.indexOf("["), text.length)
                  }
                  else {
                    text = null
                  }
                }
              }

              // Set the new text
              ib.content[i].value = newText
            })
          }
        })

        console.log(objects)
        

        // Save the list of objects (with callback)
        saveObjects(function () {
          // Redirect to the new page
          window.location.href = `?id=${window["id"]}&edit&page=${obj.title}`
        })
      }
    }

    // Do all the other elements from the content
    // Don't repeat the infobox if 
    page.content.forEach((e, i) => {
      if (e.type == "infobox" && i == 0) return

      genContent(wiki, e, `content[${i}]`)
    })


    // Show the content section if not new, a sub, or a non
    if (![null, "Sub"].includes(page.class) && url.searchParams.get("new") == null) {
      // Create the raw data section
      var raw = document.createElement("div")
      raw.classList.add("collapsable", "collapsed")

      // Create the header
      var rawHeader = document.createElement("h3")
      raw.appendChild(rawHeader)

      // Toggle 'collapsed' class on click
      rawHeader.addEventListener("click", () => raw.classList.toggle("collapsed"))

      // Check if it needs to show thw raw content or allow you to populate it from the content of a template
      if (page.content) {
        rawHeader.innerText = "View Raw Content"

        // Create the content
        var rawContent = document.createElement("pre")
        rawContent.innerText = JSON.stringify(page.content, null, 2)
        raw.appendChild(rawContent)
      }
      else {
        // Show a menu so the user can select a template to populate the content with
        rawHeader.innerText = "Populate Content"

        // Create the form
        var form = document.createElement("form")
        form.id = "populateContentForm"
        raw.appendChild(form)

        // Show list of templates, you can't select 'none' because the content is empty
        var tempsText = document.createElement("h3")
        tempsText.innerText = "From Template:"
        form.appendChild(tempsText)

        var temps = document.createElement("select")
        temps.id = "templates"
        form.appendChild(temps)

        // Add the default option ('none') (invalid option)
        var none = document.createElement("option")
        none.value = "none"
        none.innerText = "None"
        none.disabled = true
        none.selected = true
        temps.appendChild(none)

        // Add the other options (all in the template category)
        var options = objects.filter(e => e.categories && e.categories.includes("Templates"))

        options.forEach(e => {
          var option = document.createElement("option")
          option.value = e.id
          option.innerText = e.title
          temps.appendChild(option)
        })

        // Add the 'populate' button
        var create = document.createElement("button")
        create.innerText = "Populate"
        create.type = "submit"
        form.appendChild(create)

        // Configure the submit event
        form.onsubmit = function(e) {
          // Prevent the default action
          e.preventDefault()

          // Error if you picked 'none'
          if (temps.value == "none") {
            notify("You must pick a template!")
            return
          }

          // Get the content of template selected
          var temp = objects.find(obj => obj.id == temps.value).content

          // Set the content of the page to the template
          page.content = temp

          // Save the list of objects (with callback to reload the page with edit mode on)
          saveObjects(function () {
            window.location.href = `?id=${window["id"]}&edit&page=${page.title}`
          })
        } 
      }

      wiki.appendChild(raw)
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
      textSet(categoriesList, page.categories.map(cat => `[${cat}]`).join(", "))
    }

    // If not 'new' then add a 'what links here' section
    if (url.searchParams.get("new") == null) {
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

      var id = objects.find(e => e.title == pageId)

      console.log(`id: ${id}, pageId: ${pageId}`)

      id = id ? id.id : undefined

      // Get all links within infoboxes that link to this page
      objects.forEach(object => {
        if (object.content && object.content[0] && object.content[0] == "infobox" && !pageRefs.includes(object.title)) {
          var ib = object.content[0]

          // Loop through the rows
          ib.content.forEach(row => {
            // Make a copy of the cell content
            var cellContent = row.value

            // Check if '[{title}]', '[{title}|', `[!{id}]`, or `[!{id}|` is in the cell content 
            // Don't check id if it's undefined
            if ( (cellContent.includes(`[${pageId}]`) && !cellContent.includes(`[!${pageId}]`)) || (cellContent.includes(`[${pageId}|`) && !cellContent.includes(`[!${pageId}|`)) || (id && (cellContent.includes(`[!${id}]`) || cellContent.includes(`[!${id}|`)))) {
              // Add the title to the list of tag refs
              pageRefs.push(object.title)

              // Stop checking this one as it's already been added
              return
            }
          })
        }
      })

      // Sort alphabetically
      pageRefs.sort()

      pageRefs.forEach((ref, i) => {
        var refItem = document.createElement("li")
        var refLink = document.createElement("a")
        refLink.href = `?id=${window["id"]}&page=${ref}`
        refLink.innerText = ref
        refLink.setAttribute("link-desc", (objects.find(e => e.title == ref) || {}).description || "No description.")

        refItem.appendChild(refLink)
        refsList.appendChild(refItem)
        if (i != pageRefs.length - 1) refsList.appendChild(document.createTextNode(", "))
      })

      if (pageRefs.length == 0) {
        var refItem = document.createElement("li")
        refItem.innerText = "No pages link here."
        refsList.appendChild(refItem)
      }
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
    saveObjects(function() {
      // Refresh the page
      window.location.reload();
    })
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


      if (!["title", "description"].includes(e.getAttribute("prop-ref")) && !e.getAttribute("prop-ref").includes("banner") && false) {
        // Try to put an (new) element above and below the element (don't add if one already exists there)
        if (e.previousElementSibling == null || !e.previousElementSibling.classList.contains("new")) {
          var newElement = document.createElement("span")
          newElement.classList = "new"
          newElement.onclick = () => {
            // Placeholder
          }
          if (e.parentNode.tagName != "TR") return // e.parentNode.insertBefore(newElement, e)
          else if (e.parentNode.previousElementSibling == null || !e.parentNode.previousElementSibling.classList.contains("new")) {
            var tr = document.createElement("tr")
            tr.classList = "new"
            tr.appendChild(newElement)
            e.parentNode.parentNode.insertBefore(tr, e.parentNode)
          }
        }

        if (e.nextElementSibling == null || !e.nextElementSibling.classList.contains("new")) {
          var newElement = document.createElement("span")
          newElement.classList = "new"
          newElement.onclick = () => {
            // Placeholder
          }
          if (e.parentNode.tagName != "TR") return // e.parentNode.insertBefore(newElement, e.nextElementSibling)
          else if (e.parentNode.nextElementSibling == null || !e.parentNode.nextElementSibling.classList.contains("new")) {
            var tr = document.createElement("tr")
            tr.classList = "new"
            tr.appendChild(newElement)
            e.parentNode.parentNode.insertBefore(tr, e.parentNode.nextElementSibling)
          }
        }
      }

      e.addEventListener("focus", () => {
        e.innerText = formatSet((["tags", "categories"].includes(e.getAttribute("prop-ref"))) ? page[e.getAttribute("prop-ref")].map(e => typeof e == "string" ? `[${e}]` : `[!${e}]`).join(", ") : traverseObj(page, e.getAttribute("prop-ref")))
      })
      e.addEventListener("blur", () => {
        var set = formatSet(e.innerText, true)

        traverseObj(page, e.getAttribute("prop-ref"), set)

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

      // Remove all 'new' elements
      document.querySelectorAll(".new").forEach(e => e.remove())
    })
  }
}

function textSet(element, text) {
  element.innerHTML = ""

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
      category = category.slice(1, -1)
      var categoryItem = document.createElement("li")
      element.appendChild(categoryItem)

      var categoryLink = document.createElement("a")
      categoryLink.href = `?id=${window["id"]}&page=Category:${category}`
      categoryLink.innerText = category
      categoryLink.setAttribute("link-desc", (objects.find(e => e.title == `Category:${category}`) || {}).description || "No description")
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
      linkElement.href = (destObj) ? `?id=${window["id"]}&page=${destObj.title}` : `?id=${window["id"]}&page=${destination}`
      linkElement.innerText = innerText
      if (destObj && destObj.description) {
        linkElement.setAttribute("link-desc", destObj.description)
      }
      else if (!destObj) {
        linkElement.classList.add("invalid")
        linkElement.setAttribute("link-desc", "Non-existent page")
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
  console.log(text)
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
    var left = e.target.getBoundingClientRect().x + e.target.getBoundingClientRect().width / 2 + window.scrollX
    var top = e.target.getBoundingClientRect().y + e.target.getBoundingClientRect().height + window.scrollY

    console.log(window.scrollX, window.scrollY)

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    // Get the distance from the side of the screen
    var leftOffset = tooltip.getBoundingClientRect().x - window.scrollX
    var rightOffset = window.innerWidth - (tooltip.getBoundingClientRect().x - window.scrollX + tooltip.getBoundingClientRect().width)

    // If wider than the screen, move the tooltip to the middle
    if (tooltip.getBoundingClientRect().width > window.innerWidth) {
      tooltip.style.left = window.innerWidth / 2 - tooltip.getBoundingClientRect().width / 2 + "px"
    }
    // If within 0.5em (8px) of the left side of the screen, move the tooltip to the right by that amount
    else if (leftOffset < 8) {
      tooltip.style.left = left + Math.abs(leftOffset - 8) + "px"
    }
    // If within 0.5em (8px) of the right side of the screen, move the tooltip to the left by that amount
    else if (rightOffset < 8) {
      tooltip.style.left = left - Math.abs(rightOffset - 8) + "px"
    }

    // If the bottom of the tooltip is 8px above the bottom of the screen or lower, move the tooltip to above the link, not below
    if (tooltip.getBoundingClientRect().y + tooltip.getBoundingClientRect().height + 16 > window.innerHeight) {
      tooltip.style.top = top - tooltip.getBoundingClientRect().height - 16 - e.target.getBoundingClientRect().height + "px"
    }

  }
})

// Mouse out link to hide description
document.addEventListener("mouseout", e => {
  if (e.target.tagName == "A" && e.target.getAttribute("link-desc") && document.getElementById("tooltip")) document.getElementById("tooltip").remove()
})

function traverseObj(obj, path, set = null) {
  path = path.split(/\.|\[|\]/).filter((key) => key !== "").map(key => isNaN(key) ? key : Number(key));

  return path.reduce((sub, key, index, array) => {
    if (index == array.length - 1 && set != null) {
      if (["tags", "categories"].includes(key)) {
        set = set.split(", ").map(e => e.startsWith("[!") ? Number(e.slice(2, -1)) : e.slice(1, -1))
      }
      sub[key] = set
    } else {
      return sub[key];
    }
  }, obj);
}

function genContent(parent, info, path, depth = 1) {
  depth++

  switch (info.type) {
    case "section":
      // Create the section
      var section = document.createElement("section")
      parent.appendChild(section)

      // Use the depth to determine the header size
      var header = document.createElement(`h${depth < 6 ? depth : 6}`)
      header.innerText = info.title || "Untitled Section"
      header.setAttribute("prop-ref", `${path}.title`)
      section.appendChild(header)

      // Add content if existing
      info.content && info.content.forEach((e, i) => genContent(section, e, `${path}.content[${i}]`, depth))
      break
    case "paragraph":
      // Create the paragraph
      var paragraph = document.createElement("p")
      paragraph.setAttribute("prop-ref", `${path}.text`)
      textSet(paragraph, info.text || "")
      parent.appendChild(paragraph)
      break
    case "ordered-list": // Coming soon
    case "unordered-list":
    case "image":
    case "table":
    case "infobox": // Additional
    case "quote":
  }
}