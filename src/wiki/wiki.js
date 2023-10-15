window["ready"] = false
window["permissions"] = []
window["editing"] = false
window["sources"] = {}

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
    location.href = "../dash/dash.html"
  }

  // Sync all data from the timeline
  db.collection("timelines").doc(window["id"]).onSnapshot(async (map) => {
    // Leave if the doc id isn't in your permissions, or if it's project id isn't in your permissions
    let key = window["permissions"].find(e => [window["id"], map.data().project].includes(e.entity))

    if (!key) {
      // Redirect to dash
      location.href = "../dash/dash.html"
    }

    key = key.access
    key = await unlock(sessionStorage.getItem("access"), key)

    let data = await unlock(key, map.data().data)
    data = JSON.parse(data)


    if (window["page"]) {
      // Ignore if the change was made by you (your session id)
      if (data.lastChange == sessionStorage.getItem("ID")) return

      var currentPage = JSON.parse(JSON.stringify(window["objects"].find(e => e.id == window["page"])))

      var newPage = JSON.parse(data.map).find(e => e.id == window["page"])

      // Ignore if the change wasn't made to page you are on, ignoring any stats variables by setting them to null
      var stats = ["id", "position", "lastVisited", "totalVisits", "lastEdited"]

      stats.forEach(stat => {
        currentPage[stat] = null
        newPage[stat] = null
      })

      console.log(currentPage)

      if (JSON.stringify(currentPage) == JSON.stringify(newPage)) return
    }
    else if (window["page"] === null) return

    // Note the current scroll position
    window["scroll"] = {
      x: window.scrollX,
      y: window.scrollY
    }

    // Clear the page
    document.getElementById("wikiPage").innerHTML = ""

    if (map) {
      window["mapSettings"] = {
        id: map.id,
        title: data.title,
        description: data.description,
        encrypted: data.encrypted,
        project: map.data().project
      }

      objects = JSON.parse(data.map)

      // Fill sources if empty
      if (JSON.stringify(window["sources"]) == "{}") {
        // Get this document's parent
        db.collection("projects").doc(window["mapSettings"].project).get().then((project) => {
          // Get the sources, make the keys uppercase, and set it to the sources variable
          // e.g. will be {"wp": "https://en.wikipedia.org/wiki/"} -> {"WP": "https://en.wikipedia.org/wiki/"}
          window["sources"] = Object.fromEntries(Object.entries(JSON.parse(project.data().sources)).map(([k, v]) => [k.toUpperCase(), v]))

          // Get all timelines in the project, minus the current one
          db.collection("timelines").where("project", "==", window["mapSettings"].project).get().then((querySnapshot) => {
            querySnapshot.forEach(async (doc) => {
              if (doc.id != window["id"]) {
                // Leave if the doc id isn't in your permissions, or if it's project id isn't in your permissions
                let key = window["permissions"].find(e => [window["id"], doc.data().project].includes(e.entity))

                if (!key) {
                  // Redirect to dash
                  location.href = "../dash/dash.html"
                }

                key = key.access
                key = await unlock(sessionStorage.getItem("access"), key)

                let data = await unlock(key, map.data().data)
                data = JSON.parse(data)

                window["sources"][data.title.toUpperCase()] = {
                  id: doc.id,
                  objs: JSON.parse(data.map)
                }
              }
            })
            displayWiki()
          })
        })
      }
      else displayWiki()
    }
  })
}

function displayWiki() {
  document.getElementById("toProjectSettings").href = `../versions/versions.html?id=${window["mapSettings"].project}#settings`
  if (objects.includes(null)) {
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
  var pageId = (url.searchParams.get("page")) ? url.searchParams.get("page").replaceAll("_", " ") : null

  // Get the query (if any)
  var query = url.searchParams.get("q") || null

  // Replace the 'page' in the url with the correctly cased version (unless a category or special page)
  if (pageId != null && !pageId.startsWith("Category:") && !pageId.startsWith("Special:")) {
    url.searchParams.set("page", (objects.find(e => (e.title && e.title.toLowerCase() == pageId.toLowerCase()) || (e.redirects && e.redirects.find(r => r.toLowerCase() == pageId.toLowerCase()))) || { title: pageId }).title.replaceAll(" ", "_"))
    console.log(url)
    history.replaceState(null, null, url)
  }

  // If 'new' then set pageId to 'newPage'
  // If 'newPage' is taken then keep add -01 and so on until it isn't
  if (url.searchParams.get("new") != undefined && !pageId) {
    pageId = "New Page"
    var i = 0

    while (objects.find(e => e.title && (e.title.toLowerCase() == `${pageId.toLowerCase()}${i == 0 ? "" : " " + (i < 10 ? "0" + i : i)}` || e.redirects.find(r => r.toLowerCase() == `${pageId.toLowerCase()}${i == 0 ? "" : " " + (i < 10 ? "0" + i : i)}`))) != undefined) i++
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

  var searchIcon = document.createElement("i")
  searchIcon.className = "fa fa-search"
  searchIcon.id = "searchIcon"
  searchIcon.setAttribute("aria-hidden", "true")
  searchIcon.addEventListener("click", () => {
    if (document.getElementById("searchBox").value !== "") {
      location.href = `wiki.html?id=${window["id"]}&q=${document.getElementById("searchBox").value}`
    }
  })
  title.appendChild(searchIcon)

  var searchBox = document.createElement("input")
  searchBox.type = "text"
  searchBox.placeholder = "Search"
  searchBox.id = "searchBox"
  // Press enter in the box
  searchBox.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
      event.preventDefault()
      searchIcon.click()
    }
  })
  title.appendChild(searchBox)

  // If none is provided, then show links to all heads and all era pages (unless searching)
  if (pageId == null && query == null) {
    // Remove the edit button from the page (if it exists)
    var editButt = document.querySelector("label[for='editMode']")
    if (editButt) editButt.remove()

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
      eraLink.href = `?id=${window["id"]}&page=${era.title.replaceAll(" ", "_")}`
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
      headLink.href = `?id=${window["id"]}&page=${head.title.replaceAll(" ", "_")}`
      headLink.innerText = head.title
      headLink.setAttribute("link-desc", head.description || "No description")
      headItem.appendChild(headLink)
    })
    wiki.appendChild(headList)


    // List the most visited, most recently visited, and most recently edited pages
    // Each should show only the top 5, with the 6th being and option to show more / show less
    var popularTitle = document.createElement("h3")
    popularTitle.innerText = "Popular Pages"
    wiki.appendChild(popularTitle)

    var popularList = document.createElement("ul")
    wiki.appendChild(popularList)

    // Pages that don't have a count of 'totalVisits' will be as if they have 0
    // Sort in order of most to least
    var popularPages = objects.filter(e => e.title).sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0))

    // The first 5 pages are added as normal
    // The rest are added as hidden
    popularPages.forEach((page, i) => {
      var popularItem = document.createElement("li")
      popularList.appendChild(popularItem)

      if (i > 4) popularItem.style.display = "none"

      var popularLink = document.createElement("a")
      popularLink.href = `?id=${window["id"]}&page=${page.title.replaceAll(" ", "_")}`
      popularLink.innerText = page.title
      popularLink.setAttribute("link-desc", page.description || "No description")
      popularItem.appendChild(popularLink)
    })

    // If more than 5 pages, add a button to show more
    if (popularPages.length > 5) {
      var popularButton = document.createElement("li")
      popularButton.innerText = "Show More"
      popularButton.classList.add("showMore")
      popularButton.onclick = () => {
        // Get the first 5 hidden pages in the list and show them
        // If no hidden pages remain after that, delete the button
        var hidden = popularList.querySelectorAll("li[style='display: none;']")
        var del = true;
        hidden.forEach((e, i) => {
          if (i < 4) e.style.display = "revert"
          else {
            del = false
            return
          }
        })

        if (del) popularButton.remove()
      }
      popularList.appendChild(popularButton)
    }

    // Do the same for recently visited pages, but in order of 'lastVisited'
    var recentTitle = document.createElement("h3")
    recentTitle.innerText = "Recently Visited Pages"
    wiki.appendChild(recentTitle)

    var recentList = document.createElement("ul")
    wiki.appendChild(recentList)

    var recentPages = objects.filter(e => e.title && e.lastVisited).sort((a, b) => b.lastVisited - a.lastVisited)

    recentPages.forEach((page, i) => {
      var recentItem = document.createElement("li")
      recentList.appendChild(recentItem)

      if (i > 4) recentItem.style.display = "none"

      var recentLink = document.createElement("a")
      recentLink.href = `?id=${window["id"]}&page=${page.title.replaceAll(" ", "_")}`
      recentLink.innerText = page.title
      recentLink.setAttribute("link-desc", page.description || "No description")
      recentItem.appendChild(recentLink)
    })

    if (recentPages.length > 5) {
      var recentButton = document.createElement("li")
      recentButton.innerText = "Show More"
      recentButton.classList.add("showMore")
      recentButton.onclick = () => {
        var hidden = recentList.querySelectorAll("li[style='display: none;']")
        var del = true;
        hidden.forEach((e, i) => {
          if (i < 4) e.style.display = "revert"
          else {
            del = false
            return
          }
        })

        if (del) recentButton.remove()
      }
      recentList.appendChild(recentButton)
    }

    // Do the same for recently edited pages, but in order of 'lastEdited'
    var editedTitle = document.createElement("h3")
    editedTitle.innerText = "Recently Edited Pages"
    wiki.appendChild(editedTitle)

    var editedList = document.createElement("ul")
    wiki.appendChild(editedList)

    var editedPages = objects.filter(e => e.title && e.lastEdited).sort((a, b) => b.lastEdited - a.lastEdited)

    editedPages.forEach((page, i) => {
      var editedItem = document.createElement("li")
      editedList.appendChild(editedItem)

      if (i > 4) editedItem.style.display = "none"

      var editedLink = document.createElement("a")
      editedLink.href = `?id=${window["id"]}&page=${page.title.replaceAll(" ", "_")}`
      editedLink.innerText = page.title
      editedLink.setAttribute("link-desc", page.description || "No description")
      editedItem.appendChild(editedLink)
    })

    if (editedPages.length > 5) {
      var editedButton = document.createElement("li")
      editedButton.innerText = "Show More"
      editedButton.classList.add("showMore")
      editedButton.onclick = () => {
        var hidden = editedList.querySelectorAll("li[style='display: none;']")
        var del = true;
        hidden.forEach((e, i) => {
          if (i < 4) e.style.display = "revert"
          else {
            del = false
            return
          }
        })

        if (del) editedButton.remove()
      }
      editedList.appendChild(editedButton)
    }

    // Create a list of additional links
    var links = document.createElement("ul")

    var linksTitle = document.createElement("h3")
    linksTitle.innerText = "Additional Links"
    wiki.appendChild(linksTitle)

    var linksDescription = document.createElement("p")
    linksDescription.innerText = "Quick links to useful pages."
    wiki.appendChild(linksDescription)

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

    wiki.appendChild(links)
  }
  // If it has a query, search for pages that match the query
  else if (query != null) {
    // Add the title
    titleText.innerText += "Search Results"

    // Create the subtitle
    var subtitle = document.createElement("h2")
    subtitle.innerText = `Search Results for "${query}"`
    wiki.appendChild(subtitle)

    // Search for pages that contain the query in it's title, or in any of it's redirects (if any)
    // Sort by total visits, with alphabetical order as a tiebreaker
    var pages = objects.filter(e => `${e.title} ${e.redirects ? e.redirects.join(" ") : ""}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
      var aVisits = a.visits || 0
      var bVisits = b.visits || 0

      if (aVisits == bVisits) {
        if (a.title < b.title) return -1
        else if (a.title > b.title) return 1
        else return 0
      }
      else return bVisits - aVisits
    })

    var numPages = document.createElement("p")
    numPages.innerText = `${pages.length || "No"} result${pages.length == 1 ? "" : "s"} found.`
    wiki.appendChild(numPages)

    // Show the pages, if there are any
    if (pages.length > 0) {
      // Create the list of pages
      var pagesList = document.createElement("ul")
      pages.forEach(page => {
        var pageItem = document.createElement("li")
        pagesList.appendChild(pageItem)

        var pageLink = document.createElement("a")
        pageLink.href = `?id=${window["id"]}&page=${page.title.replaceAll(" ", "_")}`
        pageLink.innerText = page.title
        pageLink.setAttribute("link-desc", page.description || "No description")
        pageItem.appendChild(pageLink)
      })
      wiki.appendChild(pagesList)
    }
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
    var pagesList = document.createElement("ul")

    pages.forEach(page => {
      var pageItem = document.createElement("li")
      pagesList.appendChild(pageItem)

      var pageLink = document.createElement("a")
      pageLink.href = `?id=${window["id"]}&page=${page.title.replaceAll(" ", "_")}`
      pageLink.innerText = page.title
      pageLink.setAttribute("link-desc", page.description || "No description")
      pageItem.appendChild(pageLink)
    })

    wiki.appendChild(pagesList)
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

      // Get a random number between 0 and the number of categories + objects(without links) + 1 (for the main page)
      var random = Math.floor(Math.random() * (categories.length + objects.filter(e => e.class != "link").length + 1))

      if (random == 0) {
        // Go to the main page
        window.location.href = `?id=${window["id"]}`
      }
      else if (random <= categories.length) {
        // Go to a random category page
        window.location.href = `?id=${window["id"]}&page=Category:${categories[random - 1].replaceAll(" ", "_")}`
      }
      else {
        // Go to a random object page
        window.location.href = `?id=${window["id"]}&page=${objects.filter(e => e.class != "link")[random - categories.length - 1].title.replaceAll(" ", "_")}`
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

      // Get all tags that don't have a corresponding object (will not match a title or redirect
      var invalidTags = new Set(objects.filter(e => e.tags).map(e => e.tags).flat().filter(e => !objects.find(o => o.title && (o.title.toLowerCase() == e.toLowerCase() || o.redirects && o.redirects.some(r => r.toLowerCase() == e.toLowerCase())))))

      invalidTags = Array.from(invalidTags).sort()

      // Get all links within infoboxes that don't have a corresponding object
      objects.forEach(object => {
        if (object.header && object.header[0] && object.header[0].type && object.header[0].type == "infobox") {
          var i = object.header[0]

          // Loop through each object within the infobox's content
          i.content.forEach(key => {
            // Make a copy of the cell content
            var cellContent = key.value

            // Loop and extract until there are no more links / text
            while (cellContent) {
              if (cellContent.startsWith("[")) {
                // Get the link block
                var link = cellContent.substring(cellContent.indexOf("[") + 1, cellContent.indexOf("]"))

                // Get the destination
                var destination = link.split("|")[0]

                // Add to the list if it is not valid
                if (!objects.find(o => o.title && (o.title.toLowerCase() == destination.toLowerCase() || o.redirects && o.redirects.some(r => r.toLowerCase() == destination.toLowerCase())))) {
                  invalidTags.push(destination)
                }

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
        invalidTagLink.href = `?id=${window["id"]}&page=${tag.replaceAll(" ", "_")}`
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
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title.replaceAll(" ", "_")}`
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
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title.replaceAll(" ", "_")}`
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
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title.replaceAll(" ", "_")}`
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
              weakObjectLink.href = `?id=${window["id"]}&page=${object.title.replaceAll(" ", "_")}`
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

      // Loop through all the objects, only adding the ones that have no header and no content (or if they are empty)
      objects.filter(object => ["Head", "Era", "Info"].includes(object.class) && (!object.content || object.content == []) && (!object.header || object.header == [])).sort((a, b) => a.title.localeCompare(b.title)).forEach(object => {
        var emptyObjectItem = document.createElement("li")
        emptyObjectList.appendChild(emptyObjectItem)

        var emptyObjectLink = document.createElement("a")
        emptyObjectLink.href = `?id=${window["id"]}&page=${object.title.replaceAll(" ", "_")}`
        emptyObjectLink.innerText = object.title
        emptyObjectLink.setAttribute("link-desc", object.description || "No description")

        emptyObjectItem.appendChild(emptyObjectLink)
      })

      wiki.appendChild(emptyObjectList)
    }
    else if (special == "Pages") {
      // Add the title
      titleText.innerText += "Special Page"

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `All Pages`
      wiki.appendChild(subtitle)

      // Create the list of all pages
      var pagesList = document.createElement("ul")
      pagesList.setAttribute("headerText", "All Pages")

      // Get all tags, tags of number type will be ignored (as they will be added later)
      var tagsList = new Set(objects.filter(e => e.tags).map(e => e.tags).flat().filter(e => isNaN(e)))

      tagsList = Array.from(tagsList).sort()

      // Get all links within infoboxes
      objects.forEach(object => {
        if (object.content && object.content[0] && object.content[0].type && object.content[0].type == "infobox") {
          var i = object.content[0]

          // Loop through each object within the infobox's content
          i.content.forEach(key => {
            // Make a copy of the cell content
            var cellContent = key.value

            // Loop and extract until there are no more links / text
            while (cellContent) {
              if (cellContent.startsWith("[")) {
                // Get the link block
                var link = cellContent.substring(cellContent.indexOf("[") + 1, cellContent.indexOf("]"))

                // Get the destination
                var destination = link.split("|")[0]

                // Add to the list
                tagsList.push(destination)

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

      // Add all page titles (for pages that have titles) and sort alphabetically and remove any duplicates
      var allPages = Array.from(new Set(tagsList.concat(objects.filter(e => e.title).map(e => e.title)))).sort()

      allPages.forEach(pg => {
        var pageItem = document.createElement("li")
        pagesList.appendChild(pageItem)

        var pageLink = document.createElement("a")
        pageLink.href = `?id=${window["id"]}&page=${pg.replaceAll(" ", "_")}`
        pageLink.innerText = pg
        if (!objects.find(e => e.title && (e.title.toLowerCase() == pg.toLowerCase() || e.redirects.find(r => r.toLowerCase() == pg.toLowerCase())))) pageLink.classList.add("invalid")

        pageItem.appendChild(pageLink)
      })

      wiki.appendChild(pagesList)
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
        <li><a href="?id=${window["id"]}&page=Special:Pages">All Pages</a></li>
        <li><a href="?id=${window["id"]}&page=Special:Categories">All Categories</a></li>
        <li><a href="?id=${window["id"]}&page=Special:Random">Random Page</a></li>
        <li><a href="?id=${window["id"]}&page=Special:Weak">Weak and Invalid Pages</a></li>
        <li><a href="?id=${window["id"]}&page=Special:SpecialPages">Special Pages</a></li>
      `
      wiki.appendChild(specialPageList)
    }
  }
  else {
    // Add a button to either 'talk' or 'wiki' depending on which you are on (if needed)
    try {
      var titleMenuButton = document.createElement("a")
      if (url.searchParams.get("talk") != undefined) {
        titleMenuButton.innerText = "Wiki"
        titleMenuButton.href = `wiki.html?id=${window["id"]}&page=${pageId.replaceAll(" ", "_")}`
        titleMenuButton.setAttribute("link-desc", "Go to the wiki page for this topic")
      }
      else {
        titleMenuButton.innerText = `Talk (${objects.find(e => e.title && (e.title.toLowerCase() == pageId.toLowerCase() || e.redirects.find(r => r.toLowerCase() == pageId.toLowerCase()))).talk.length})`
        titleMenuButton.href = `wiki.html?id=${window["id"]}&page=${pageId.replaceAll(" ", "_")}&talk`
        titleMenuButton.setAttribute("link-desc", "Go to the talk page for this topic")
      }
      title.appendChild(titleMenuButton)
    }
    catch (e) { }

    // If a page ID is provided, then get that object
    var page = objects.find(e => e.title && (e.title.toLowerCase() == pageId.toLowerCase() || e.redirects.find(r => r.toLowerCase() == pageId.toLowerCase())))

    // If that id doesn't exist, then set 'page.class' to null
    if (page == undefined) {
      page = { class: null }
    }
    // Check if this is the 'talk' page
    else if (url.searchParams.get("talk") !== null) {
      // Add the title
      titleText.innerText += "Talk Page"

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `${page.title} - Talk Page`
      wiki.appendChild(subtitle)

      // Create the talk page
      var talkPage = document.createElement("div")
      talkPage.id = "talkPage"
      talkPage.classList.add("talkPage")
      wiki.appendChild(talkPage)

      // Create the topic field + button
      var topicDiv = document.createElement("div")
      topicDiv.classList.add("replies")
      talkPage.appendChild(topicDiv)

      var topicHeader = document.createElement("h3")
      topicHeader.innerText = "Add Topic/Message"
      topicDiv.appendChild(topicHeader)

      var topicTitle = document.createElement("input")
      topicTitle.placeholder = "Topic Title"
      topicDiv.appendChild(topicTitle)

      var topicText = document.createElement("textarea")
      topicText.placeholder = "Message Content"
      topicDiv.appendChild(topicText)

      var addBtn = document.createElement("button")
      addBtn.innerText = "Add Topic"
      addBtn.addEventListener("click", () => {
        page.talk.push({
          id: genID(),
          title: topicTitle.value,
          text: topicText.value,
          author: sessionStorage.getItem("name"),
          date: new Date().toLocaleString(),
          talk: []
        })

        // Save and reload
        saveObjects(function () {
          window.location.reload();
        })
      })
      topicDiv.appendChild(addBtn)

      // Add the content
      page.talk.forEach((t, i) => { genContent(talkPage, { ...t, type: "talk" }, `talk[${i}]`) })

      // Set the title of the tab
      var titleVar = `${document.querySelector("h2").innerText} | ${window["mapSettings"].title}`
      document.getElementsByTagName("title")[0].innerText = titleVar
      document.querySelector('meta[property="og:title"]').setAttribute("content", titleVar)
      document.querySelector('meta[property="og:description"]').setAttribute("content", `Talk page for ${pageId} on ${window["mapSettings"].title}`)

      return
    }
    else {
      window["page"] = page.id
    }

    // Create the top section
    var topSection = document.createElement("div")
    wiki.appendChild(topSection)

    var topBar = document.createElement("div")
    topBar.classList.add("topBar")
    topSection.appendChild(topBar)

    if (["Head", "Era", "Sub"].includes(page.class)) {
      // Create a new document element for the timeline
      var iframe = document.createElement("iframe")
      iframe.id = "wikiMap"
      iframe.src = "../map/map.html?id=wikiMap"

      // Create a map editor button
      var toMap = document.createElement("span")
      toMap.classList.add("note")
      var mapLink = document.createElement("a")
      mapLink.href = `../map/map.html?id=${window["id"]}#${page.title.replaceAll(" ", "_")}`
      mapLink.innerText = "Open in timeline mode"
      toMap.appendChild(mapLink)

      // Append the map editor button
      topBar.appendChild(toMap)
    }

    // Create redirect notice if needed (get the redirect page title)
    var from = objects.find(e => e.redirects && e.redirects.find(r => r.toLowerCase() == pageId.toLowerCase()))

    // If there is a redirect, then create the notice
    if (from) {
      // Get the redirect title
      var redirectTitle = from.redirects.find(r => r.toLowerCase() == pageId.toLowerCase())

      // Create the redirect link
      var redirectLink = document.createElement("a")
      redirectLink.href = `?id=${window["id"]}&page=${redirectTitle}`
      redirectLink.innerText = redirectTitle

      // Create the redirect text
      var redirectText = document.createElement("span")
      redirectText.classList.add("note")
      redirectText.innerText = "Redirected from: "

      // Add the main article link to the text and then to the section
      redirectText.appendChild(redirectLink)
      topBar.appendChild(redirectText)
    }

    const storage = firebase.storage();

    if (page.header && page.header[0] && page.header[0].type == "infobox") {
      var ib = page.header[0]

      // Make the infobox table
      var infobox = document.createElement("table")
      infobox.id = ib.id
      infobox.classList.add("infobox")
      topSection.appendChild(infobox)

      // Make the infobox caption
      var caption = document.createElement("caption")
      infobox.appendChild(caption)

      // Make the caption title
      var captionTitle = document.createElement("h3")
      captionTitle.setAttribute("prop-ref", "header[0].banner.title")
      caption.appendChild(captionTitle)
      textSet(captionTitle, ib.banner.title)

      // Make the caption subtitle
      var captionSubtitle = document.createElement("h4")
      captionSubtitle.setAttribute("prop-ref", "header[0].banner.subtitle")
      caption.appendChild(captionSubtitle)
      textSet(captionSubtitle, ib.banner.subtitle)

      // Make the infobox image (fetching the image with file name '{infobox id}' from storage) (it may not exist)
      var image = document.createElement("img")
      image.setAttribute("prop-ref", "header[0].banner.image")
      // on resolve, set the image source to the url
      // on reject, do nothing
      image.src = ""

      storage.ref().child(ib.id).getDownloadURL().then((url) => {
        image.src = url
        // Show the image in full if clicked
        image.addEventListener("click", () => {
          // If any images are showing, then hide them
          var el = document.getElementById("imageFull")
          if (el) el.remove();

          // Create the image, container, and buttons
          var imageContainer = document.createElement("div")
          var imageBackdrop = document.createElement("div")
          var imageFull = document.createElement("img")
          var imageClose = document.createElement("span")

          // Coming soon
          var imagePrev = document.createElement("span")
          var imageNext = document.createElement("span")

          imageContainer.id = "imageFull"
          imageFull.src = url

          // If the cross is clicked, then remove the image
          imageClose.addEventListener("click", () => { imageContainer.remove() })

          // If the backdrop is clicked, then open the image in a new tab
          imageBackdrop.addEventListener("click", () => { window.open(url) })

          // Add everything to the page
          imageBackdrop.appendChild(imageFull)
          imageContainer.appendChild(imageBackdrop)
          imageContainer.appendChild(imageClose)
          document.getElementById("wikiPage").appendChild(imageContainer)
        })
      }).catch(() => { })

      caption.appendChild(image)

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
        keyCell.setAttribute("prop-ref", `header[0]content[${i}].key`)
        row.appendChild(keyCell)
        textSet(keyCell, r.key)

        // Make the value cell
        var valueCell = document.createElement("td")
        valueCell.setAttribute("prop-ref", `header[0]content[${i}].value`)
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
      topSection.appendChild(subtitle);
      textSet(subtitle, page.title)

      // Create the description
      var description = document.createElement("p")
      description.setAttribute("prop-ref", "description")
      topSection.appendChild(description)
      textSet(description, page.description)

      // Fill the embed with the events
      topSection.appendChild(iframe)

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
        headPage.href = `?id=${window["id"]}&page=${head.title.replaceAll(" ", "_")}`
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
          mainArticleLink.href = `?id=${window["id"]}&page=${objects.find(e => e.id == head.mainArticle).title.replaceAll(" ", "_")}`
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
            var article = objects.find(e => e.title && e.title.toLowerCase() == sub.mainArticle.toLowerCase() || e.redirects.find(r => r.toLowerCase() == sub.mainArticle.toLowerCase()))
            // Create the main article link
            var mainArticleLink = document.createElement("a")
            mainArticleLink.href = `?id=${window["id"]}&page=${article.title.replaceAll(" ", "_")}`
            mainArticleLink.innerText = article.title
            mainArticleLink.setAttribute("link-desc", article.description || "No description")

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
      topSection.appendChild(subtitle)
      textSet(subtitle, page.title)

      // Create the description
      var description = document.createElement("p")
      description.setAttribute("prop-ref", "description")
      topSection.appendChild(description)
      textSet(description, page.description)

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
      topSection.appendChild(iframe)

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
        subPage.href = `?id=${window["id"]}&page=${sub.title.replaceAll(" ", "_")}`
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
          var article = objects.find(e => e.title && e.title.toLowerCase() == sub.mainArticle.toLowerCase() || e.redirects.find(r => r.toLowerCase() == sub.mainArticle.toLowerCase()))
          // Create the main article link
          var mainArticleLink = document.createElement("a")
          mainArticleLink.href = `?id=${window["id"]}&page=${article.title.replaceAll(" ", "_")}`
          mainArticleLink.innerText = article.title
          mainArticleLink.setAttribute("link-desc", article.description || "No description")

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
      topSection.appendChild(subtitle)
      textSet(subtitle, page.title)

      // Create the description
      var description = document.createElement("p")
      description.setAttribute("prop-ref", "description")
      topSection.appendChild(description)
      textSet(description, page.description)
    }
    // If the page is a wiki page, then show the plaintext with a message stating this is not yet implemented
    else if (page.class == "Info") {
      // Add the title
      titleText.innerText += "Custom Page"

      var subtitle = document.createElement("h2")
      subtitle.innerText = page.title
      subtitle.setAttribute("prop-ref", "title")
      topSection.appendChild(subtitle)

      // Create the description
      var description = document.createElement("p")
      description.setAttribute("prop-ref", "description")
      topSection.appendChild(description)
      textSet(description, page.description)
    }
    // If the class is unknown, then tell the user the classic "this page does not exist... make one if you want" stuff
    else if (page.class == null && url.searchParams.get("new") == null) {
      // Add the title
      titleText.innerText += "Non-Existent Page"

      var subtitle = document.createElement("h2")
      subtitle.innerText = pageId
      topSection.appendChild(subtitle)

      // Create the description (with a link inside)
      var description = document.createElement("p")
      description.innerText = `This page does not exist. You can create it or redirect it to an existing page by clicking the link below.\n`
      topSection.appendChild(description)

      var link = document.createElement("a")
      link.href = `?id=${window["id"]}&new&page=${pageId.replaceAll(" ", "_")}`
      link.innerText = `Create "${pageId}" Page`
      description.appendChild(link)
    }
    // If the page is new, then show the new page form
    else if (url.searchParams.get("new") != null) {
      // Add the title
      titleText.innerText += "New Page"

      var subtitle = document.createElement("h2")
      subtitle.innerText = "Create New Page or Redirect"
      topSection.appendChild(subtitle)

      // Create the new form
      var form = document.createElement("form")
      form.id = "newPageForm"
      topSection.appendChild(form)

      // Create the title input
      var titleLabel = document.createElement("h3")
      titleLabel.innerText = "Page Title:"
      form.appendChild(titleLabel)

      var title = document.createElement("input")
      title.type = "text"
      title.id = "title"
      title.value = pageId
      title.placeholder = "Title"
      title.required = true
      form.appendChild(title)

      form.appendChild(document.createElement("br"))

      // Show list of templates
      var tempsText = document.createElement("h4")
      tempsText.innerText = "Create New Page (Pick Template):"
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
      var options = objects.filter(e => e.categories && e.categories.includes("Templates")).sort((a, b) => a.title.localeCompare(b.title))

      options.forEach(e => {
        var option = document.createElement("option")
        option.value = e.id
        option.innerText = e.title
        temps.appendChild(option)
      })

      // Add the 'create' button
      var create = document.createElement("button")
      create.innerText = "Create From Template"
      create.type = "submit"
      form.appendChild(create)

      // Configure the submit event
      form.onsubmit = function (e) {
        e.preventDefault()

        // Get the title
        var title = document.getElementById("title").value

        // Make sure the title is available
        if (objects.some(obj => obj.title && (obj.title.toLowerCase() == title.toLowerCase() || obj.redirects.some(r => r.toLowerCase() == title.toLowerCase())))) {
          notify("Page already exists with that title!")
          return
        }

        // Get the template
        var template = document.getElementById("templates").value

        // Copy the template (if selected)
        var temp = (template == "none") ? {} : JSON.parse(JSON.stringify(objects.find(e => e.id == template)))

        // Create the object, with a new ID and carrying over a copy of the template's header and content (not a reference)
        var obj = {
          "id": genID(),
          "class": "Info",
          "title": title,
          "description": "Short description...",
          "header": temp.header,
          "content": temp.content,
          "talk": [],
          "tags": [],
          "categories": [],
          "redirects": [],
          "template": template
        }

        // If any infoboxes exist in the header, regenerate their IDs
        if (obj.header) {
          obj.header.forEach((e, i) => {
            if (e.type == "infobox") {
              e.id = genID()
            }
          })
        }

        // Add the object to the list
        objects.push(obj)

        // Save the list of objects (with callback)
        saveObjects(function () {
          // Redirect to the new page
          window.location.href = `?id=${window["id"]}&edit&page=${obj.title.replaceAll(" ", "_")}`
        })
      }

      // Add redirect form
      var redirectForm = document.createElement("form")
      redirectForm.id = "redirectForm"
      topSection.appendChild(redirectForm)

      // Show a list of all valid pages
      var redirectText = document.createElement("h4")
      redirectText.innerText = "Create Redirect (Pick Page):"
      redirectForm.appendChild(redirectText)

      var redirect = document.createElement("select")
      redirect.id = "redirect"
      redirectForm.appendChild(redirect)

      // Add the default option ('none')
      var none = document.createElement("option")
      none.value = "none"
      none.innerText = "None"
      redirect.appendChild(none)

      // Add the other options (all pages with titles)
      var options = objects.filter(e => e.title).sort((a, b) => a.title.localeCompare(b.title))

      options.forEach(e => {
        var option = document.createElement("option")
        option.value = e.id
        option.innerText = e.title
        redirect.appendChild(option)
      })

      // Add the 'create' button
      var create = document.createElement("button")
      create.innerText = "Create Redirect"
      create.type = "submit"
      redirectForm.appendChild(create)

      // Configure the submit event
      redirectForm.onsubmit = function (e) {
        e.preventDefault()

        // Get the redirect
        var redirect = document.getElementById("redirect").value

        // Make sure the title is available
        if (objects.some(obj => obj.title && (obj.title.toLowerCase() == pageId.toLowerCase() || obj.redirects.some(r => r.toLowerCase() == pageId.toLowerCase())))) {
          notify("Page already exists with that title!")
          return
        }

        // Add the redirect to the object (if not set to none)
        if (redirect != "none") {
          objects.find(obj => obj.id == redirect).redirects.push(pageId)
        }

        // Save the list of objects (with callback)
        saveObjects(function () {
          // Redirect to the new page
          window.location.href = `?id=${window["id"]}&page=${pageId.replaceAll(" ", "_")}`
        })
      }

    }

    // If it is an existing page, then update it's 'lastVisited' and 'totalVisits' properties
    // May also need to create these variables
    // Save afterwards
    if (page.class != null) {
      page.lastVisited = new Date().getTime()
      page.totalVisits = (page.totalVisits || 0) + 1
      saveObjects()
    }

    // Do the rest of the header content
    page.header && page.header.forEach((e, i) => {
      if (e.type == "infobox" && i == 0) return

      genContent(topSection, e, `header[${i}]`)
    })

    // Do all the main content
    page.content && page.content.forEach((e, i) => {
      genContent(wiki, e, `content[${i}]`)
    })

    // Show the content section if not new, a sub, or a non
    if (![null, "Sub"].includes(page.class) && url.searchParams.get("new") == null) {
      // Create the raw data section
      var raw = document.createElement("div")
      raw.classList.add("collapsible", "collapsed")

      // Create the header
      var rawHeader = document.createElement("h3")
      raw.appendChild(rawHeader)

      // Toggle 'collapsed' class on click
      rawHeader.addEventListener("click", () => raw.classList.toggle("collapsed"))

      // Check if it needs to show the raw content or allow you to populate it from the content of a template
      if ((page.content && page.content.length > 0) || (page.header && page.header.length > 0)) {
        rawHeader.innerText = "View Raw Content"

        // Create the content
        var rawContent = document.createElement("pre")
        rawContent.innerText = JSON.stringify([page.header, ...page.content], null, 2)
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
        form.onsubmit = function (e) {
          // Prevent the default action
          e.preventDefault()

          // Error if you picked 'none'
          if (temps.value == "none") {
            notify("You must pick a template!")
            return
          }

          // Get the contents of template selected
          var tempHead = objects.find(obj => obj.id == temps.value).header
          var tempContent = objects.find(obj => obj.id == temps.value).content

          // Set the contents of the page to the template, removing the reference
          page.header = JSON.parse(JSON.stringify(tempHead))
          page.content = JSON.parse(JSON.stringify(tempContent))
          page.template = temps.value

          // If any infoboxes exist in the header, regenerate their IDs
          if (page.header) {
            page.header.forEach((e, i) => {
              if (e.type == "infobox") {
                e.id = genID()
              }
            })
          }

          // Save the list of objects (with callback to reload the page with edit mode on)
          saveObjects(function () {
            window.location.href = `?id=${window["id"]}&edit&page=${page.title.replaceAll(" ", "_")}`
          })
        }
      }

      wiki.appendChild(raw)
    }

    // Add 'tags' and 'categories' sections if they exist (in collapsible divs)
    if (page.tags) {
      // Create the tags section
      var tags = document.createElement("div")
      tags.classList.add("collapsible", "collapsed")

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
      textSet(tagsList, page.tags.map(e => `[${e}]`).join(", "))
      wiki.appendChild(tags)
    }

    if (page.categories) {
      // Create the categories section
      var categories = document.createElement("div")
      categories.classList.add("collapsible", "collapsed")

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

    // Add a redirects section to create links that will redirect to this page
    if (page.redirects) {
      // Create the redirects section
      var redirects = document.createElement("div")
      redirects.classList.add("collapsible", "collapsed")

      // Create the header
      var redirectsHeader = document.createElement("h3")
      redirectsHeader.innerText = "Redirects"
      redirects.appendChild(redirectsHeader)

      // Toggle 'collapsed' class on click
      redirectsHeader.addEventListener("click", () => redirects.classList.toggle("collapsed"))

      // Create the content
      var redirectsList = document.createElement("ul")
      redirectsList.setAttribute("prop-ref", "redirects")
      redirects.appendChild(redirectsList)
      wiki.appendChild(redirects)
      textSet(redirectsList, page.redirects.map(alt => `[${alt}]`).join(", "))
    }

    // Add a static 'from template' section if it exists
    if (page.template) {
      // Create the template section
      var template = document.createElement("div")
      template.classList.add("collapsible", "collapsed")

      // Create the header
      var templateHeader = document.createElement("h3")
      templateHeader.innerText = "From Template"
      template.appendChild(templateHeader)

      // Toggle 'collapsed' class on click
      templateHeader.addEventListener("click", () => template.classList.toggle("collapsed"))

      // Create the content
      var templateList = document.createElement("ul")
      template.appendChild(templateList)

      var templateLink = document.createElement("a")
      templateLink.href = `?id=${window["id"]}&page=${objects.find(e => e.id == page.template).title.replaceAll(" ", "_")}`
      templateLink.innerText = objects.find(e => e.id == page.template).title
      templateLink.setAttribute("link-desc", objects.find(e => e.id == page.template).description || "No description")
      templateList.appendChild(templateLink)
      wiki.appendChild(template)
    }

    // If not 'new' then add a 'what links here' section
    if (url.searchParams.get("new") == null) {
      var refsSection = document.createElement("div")
      refsSection.classList.add("collapsible", "collapsed")
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
      var pageRefs = Array.from(new Set(objects.filter(e => e.tags && e.tags.find(t => t.toLowerCase() == pageId.toLowerCase() || objects.find(o => o.title == pageId && o.redirects.find(r => r.toLowerCase() == t.toLowerCase())))).map(e => e.title)))

      // var id = objects.find(e => e.title && e.title.toLowerCase() == pageId.toLowerCase())
      var id = objects.find(e => e.title && (e.title.toLowerCase() == pageId.toLowerCase() || e.redirects.find(r => r.toLowerCase() == pageId.toLowerCase())))

      console.log(`id: ${id}, pageId: ${pageId}`)

      id = id ? id.id : undefined

      // Get all links within infoboxes that link to this page
      objects.forEach(object => {
        if (object.header && object.header[0] && object.header[0].type == "infobox" && !pageRefs.find(e => e.toLowerCase() == object.title.toLowerCase() || object.redirects.find(r => r.toLowerCase() == e.toLowerCase()))) {
          var ib = object.header[0]

          // Loop through the rows
          ib.content.forEach(row => {
            // Make a copy of the cell content
            var cellContent = row.value.toLowerCase()

            // Check if '[{title}]' or '[{title}|' is in the cell content 
            // Don't check id if it's undefined
            if (cellContent.includes(`[${pageId.toLowerCase()}]`) || cellContent.includes(`[${pageId.toLowerCase()}|`) || objects.find(obj => obj.title == pageId && obj.redirects.find(r => cellContent.toLowerCase().includes(`[${r.toLowerCase()}]`) || cellContent.toLowerCase().includes(`[${r.toLowerCase()}|`)))) {
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
        refLink.href = `?id=${window["id"]}&page=${ref.replaceAll(" ", "_")}`
        refLink.innerText = ref
        refLink.setAttribute("link-desc", (objects.find(e => e.title && (e.title.toLowerCase() == ref.toLowerCase() || e.redirects.find(r => r.toLowerCase() == ref.toLowerCase()))) || {}).description || "No description.")

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
  var titleVar = `${document.querySelector("h2").innerText} | ${window["mapSettings"].title}`
  document.getElementsByTagName("title")[0].innerText = titleVar
  document.querySelector('meta[property="og:title"]').setAttribute("content", titleVar)
  document.querySelector('meta[property="og:description"]').setAttribute("content", `Wiki page for ${pageId} on ${window["mapSettings"].title}`)

  // If page syncs on edit then re-enter edit mode, or if edit is in the url
  if (window["editing"]) {
    window["editing"] = false
    toggleEdit(false)
  }

  // If page isn't defined, then set it to null
  if (window["page"] == undefined) window["page"] = null

  // Finally, scroll to the documented coordinates
  window.scrollTo(window["scroll"].x, window["scroll"].y)
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
  raw.value = JSON.stringify(objects.map(e => Object.keys(e).reduce((obj, key) => (key != "hidden" && key != "toggle") ? { ...obj, [key]: e[key] } : obj, {})), null, 2);

  raw.style.height = "40em";
  popup.appendChild(raw);

  // Create the save button
  var save = document.createElement("button");
  save.innerText = "Save";
  save.onclick = function () {
    // Save the objects
    objects = JSON.parse(document.getElementById("raw").value);
    saveObjects(function () {
      // Refresh the page
      window.location.reload();
    })
  }
  popup.appendChild(save);
}

async function saveObjects(callback = null) {
  let data = JSON.stringify({
    ...window["mapSettings"],
    map: JSON.stringify(objects),
    project: undefined,
    lastChange: sessionStorage.getItem("ID")
  })

  // Leave if the doc id isn't in your permissions, or if it's project id isn't in your permissions
  let key = window["permissions"].find(e => [window["id"], window["mapSettings"].project].includes(e.entity))

  key = key.access
  key = await unlock(sessionStorage.getItem("access"), key)

  data = await lock(key, data)

  var toPush = {
    project: window["mapSettings"].project,
    data: data
  }

  // Update firestore document
  db.collection("timelines").doc(window["mapSettings"].id).update(toPush).then(() => {
    // If callback exists then call it
    if (callback) callback()
  })
}

function toggleEdit(alert = true) {
  const storage = firebase.storage();

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


      if (!["title", "description"].includes(e.getAttribute("prop-ref")) && !e.getAttribute("prop-ref").includes("banner") && e.getAttribute("prop-ref").endsWith("key") && false) {
        // Make the edit menu (only seen in edit mode)
        var editMenu = document.createElement("td")
        editMenu.classList.add("new")
        e.parentNode.insertBefore(editMenu, e.nextSibling)

        // Give it the options for 'add above', 'move up', 'delete', 'move down', and 'add below'
        var addAbove = document.createElement("button")
        addAbove.classList = "fa fa-plus"
        addAbove.title = "Add Above"
        editMenu.appendChild(addAbove)

        var moveUp = document.createElement("button")
        moveUp.classList = "fa fa-arrow-up"
        moveUp.title = "Move Up"
        editMenu.appendChild(moveUp)

        var deleteBtn = document.createElement("button")
        deleteBtn.classList = "fa fa-trash"
        deleteBtn.title = "Delete"
        editMenu.appendChild(deleteBtn)

        var moveDown = document.createElement("button")
        moveDown.classList = "fa fa-arrow-down"
        moveDown.title = "Move Down"
        editMenu.appendChild(moveDown)

        var addBelow = document.createElement("button")
        addBelow.classList = "fa fa-plus"
        addBelow.title = "Add Below"
        editMenu.appendChild(addBelow)
      }
      else if (!["title", "description"].includes(e.getAttribute("prop-ref")) && e.getAttribute("prop-ref").endsWith("banner.image")) {
        // Add a image upload option within the image, so that the user can upload a new image
        var label = document.createElement("label")
        label.classList = "new"
        label.innerText = "Upload Image"
        label.htmlFor = "upload"
        e.parentNode.insertBefore(label, e)

        var upload = document.createElement("input")
        upload.id = "upload"
        upload.type = "file"
        upload.classList = "new"
        upload.accept = "image/*"
        upload.onchange = function () {
          notify("Uploading image...")
          setTimeout(() => {
            notify("Do not close this tab until the image has finished uploading.")
          }, 2500)


          // Get the file
          var file = this.files[0]

          // Turn it into a base64 string, replacing the old image with the new one
          var reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = function () {
            e.src = reader.result

            // Save the new image as '{infobox id}.{file extension}' in the firestore storage
            var fileName = e.parentNode.parentNode.getAttribute("id")

            storage.ref().child(fileName).putString(reader.result, 'data_url').then(function (snapshot) {
              // Get the download URL
              snapshot.ref.getDownloadURL().then(function (url) {
                notify("Image upload complete!")
              });
            });
          }
        }

        e.parentNode.insertBefore(upload, e)
      }

      e.addEventListener("focus", () => {
        if (e.getAttribute("prop-ref").endsWith("banner.image")) return
        e.innerText = ["tags", "categories", "redirects"].includes(e.getAttribute("prop-ref")) ? page[e.getAttribute("prop-ref")].map(e => `[${e}]`).join(", ") : traverseObj(page, e.getAttribute("prop-ref"))
      })
      e.addEventListener("blur", () => {
        if (e.getAttribute("prop-ref").endsWith("banner.image")) return

        var set = e.innerText

        traverseObj(page, e.getAttribute("prop-ref"), set)

        // Update the 'lastEdited' of this page
        page.lastEdited = new Date().getTime()

        saveObjects()

        textSet(e, (typeof set == "object" ? set.map(e => `[${e}]`).join(", ") : set), typeof set == "object")
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
  if (["", "[]", null].includes(text)) text = "N/A"

  // If the value is "N/A" or [] then set the class to 'hidden', if not then remove the class
  // If it's a table cell or has a prop-ref of "categories" or "tags" then add the 'hidden' class to the parent element
  if (text == "N/A" || text == []) {
    if (element.tagName == "TD" || (element.getAttribute("prop-ref") && ["categories", "tags", "redirects"].includes(element.getAttribute("prop-ref")))) element.parentElement.classList.add("hidden")
    else element.classList.add("hidden")
  }
  else {
    if (element.tagName == "TD" || (element.getAttribute("prop-ref") && ["categories", "tags", "redirects"].includes(element.getAttribute("prop-ref")))) element.parentElement.classList.remove("hidden")
    else if (element.classList) element.classList.remove("hidden")
  }

  if (element.getAttribute("prop-ref") && element.getAttribute("prop-ref") == "categories" && text != "N/A") {
    text.split(", ").forEach((category, index) => {
      category = category.slice(1, -1)
      var categoryItem = document.createElement("li")
      element.appendChild(categoryItem)

      var categoryLink = document.createElement("a")
      categoryLink.href = `?id=${window["id"]}&page=Category:${category.replaceAll(" ", "_")}`
      categoryLink.innerText = category
      categoryLink.setAttribute("link-desc", (objects.find(e => e.title && (e.title.toLowerCase() == `Category:${category.toLowerCase()}`)) || { description: "No description" }).description)
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

      var isCategory = false
      var isLocal = true
      var branchObjs = objects
      var branchId = window["id"]

      // It may have one or two ":", each changing the destination
      var colons = destination.split(":")
      destination = colons[colons.length - 1]

      if (colons.length > 1) {
        // The last colon is the new destination, unless the second to last colon is "Category"
        if (colons[colons.length - 2] == "Category") {
          isCategory = true
          // Remove it from colons
          colons.pop()
        }

        // If there are still two entries, check the first for the branch/site destination
        if (colons.length == 2) {
          // Extract the branch/site destination
          var branch = colons[0].toUpperCase()

          switch (typeof window["sources"][branch]) {
            case "string": // Is a link to another site
              isLocal = false
              branchId = window["sources"][branch]
              break
            case "object": // Is a branch
              branchObjs = window["sources"][branch].objs
              branchId = window["sources"][branch].id
              break
            default: // Is invalid
            // Ignore for now
          }
        }
      }

      if (isLocal) {
        // Find the destination object (if it exists)
        var destObj = branchObjs.find(e => e.title && (e.title.toLowerCase() == destination.toLowerCase() || e.redirects.find(r => r.toLowerCase() == destination.toLowerCase())))

        // If it is valid, then set 'destination' to the title of that object (unless it's a redirect)
        if (destObj) destination = (destObj.redirects.find(r => r.toLowerCase() == destination.toLowerCase())) ? destination : destObj.title

        // Get the innerText (if it exists)
        var innerText = link.split("|")[1] || (isCategory ? "Category:" : "") + destination

        // Make the link
        var linkElement = document.createElement("a")
        linkElement.href = `?id=${branchId}&page=${isCategory ? "Category:" : ""}${destination.replaceAll(" ", "_")}`
        linkElement.innerText = innerText

        // If it's a category, check if it has any members, setting 'isCategory' to the resulting boolean
        var isValidCat = isCategory && branchObjs.some(e => e.categories && e.categories.includes(destination))

        if (destObj && destObj.description) {
          linkElement.setAttribute("link-desc", destObj.description)
        }
        else if (!destObj && !isValidCat) {
          linkElement.classList.add("invalid")
          linkElement.setAttribute("link-desc", `Non-existent ${isCategory ? "category" : "page"}`)
        }
        else linkElement.setAttribute("link-desc", "No description")
        element.appendChild(linkElement)
      }
      else {
        // Make the link
        var linkElement = document.createElement("a")
        linkElement.href = branchId + destination
        linkElement.innerText = link.split("|")[1] || destination
        linkElement.setAttribute("link-desc", "External link")
        element.appendChild(linkElement)
      }

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

window.onload = () => {
  loadTheme()
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
    // If within 1em (16px) of the left side of the screen, move the tooltip to the right by that amount
    else if (leftOffset < 16) {
      tooltip.style.left = left + Math.abs(leftOffset - 16) + "px"
    }
    // If within 1em (16px) of the right side of the screen, move the tooltip to the left by that amount
    else if (rightOffset < 8) {
      tooltip.style.left = left - Math.abs(rightOffset - 16) + "px"
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
      if (["tags", "categories", "redirects"].includes(key)) {
        set = set.split(", ").map(e => e.slice(1, -1))
      }
      sub[key] = set
    } else {
      return sub[key];
    }
  }, obj);
}

function genContent(parent, info, path, depth = 2) {
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
      break
    case "unordered-list":
      break
    case "image":
      break
    case "table":
      break
    case "infobox": // Additional
      break
    case "quote":
      break
    case "talk":
      // Create talk section, with header (author, date, and {edited bool}), text, reply field and replies
      var talk = document.createElement("div")
      talk.classList.add("talk")
      parent.appendChild(talk)

      // Create topic title if on it exists
      if (info.title) {
        var topic = document.createElement("h3")
        textSet(topic, info.title)
        talk.appendChild(topic)
      }

      // Create the header + span
      var header = document.createElement("h4")
      header.innerText = info.author
      var span = document.createElement("span")
      span.innerText = info.date
      header.appendChild(span)
      talk.appendChild(header)

      // Create the text
      var text = document.createElement("p")
      textSet(text, info.text)
      // text.setAttribute("prop-ref", `${path}.text`)
      talk.appendChild(text)

      // Create collapsible replies section
      var replies = document.createElement("div")
      replies.classList = "collapsible collapsed replies"
      talk.appendChild(replies)

      var repliesText = document.createElement("h5")
      repliesText.innerText = `Replies (${info.talk.length}):`
      repliesText.onclick = () => replies.classList.toggle("collapsed")
      replies.appendChild(repliesText)

      // Create the reply field + button
      var reply = document.createElement("textarea")
      reply.placeholder = "Add Reply..."
      replies.appendChild(reply)
      var replyBtn = document.createElement("button")
      replyBtn.innerText = "Reply"
      replyBtn.addEventListener("click", () => {
        info.talk.push({
          id: genID(),
          text: reply.value,
          author: sessionStorage.getItem("name"),
          date: new Date().toLocaleString(),
          talk: []
        })

        // Save and reload
        saveObjects(function () {
          window.location.reload();
        })
      })

      replies.appendChild(replyBtn)

      info.talk.forEach((e, i) => { genContent(replies, { ...e, type: "talk" }, `${path}.talk[${i}]`, depth) })

      break
  }
}