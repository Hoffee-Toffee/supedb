window["ready"] = false
window["permissions"] = []

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

  // If none is provided, then show links to all heads and all era pages
  if (pageId == null) {
    // Check if it has the 'new' param in the URL (won't be set, but will be present)
    if (url.searchParams.get("new") != undefined) {
        // Show a placeholder page
        var wiki = document.getElementById("wikiPage")

        // Create the title
        var title = document.createElement("h1")
        title.innerText = `${window["mapSettings"].title} - New Page`
        wiki.appendChild(title)

        // Create the subtitle
        var subtitle = document.createElement("h2")
        subtitle.innerText = "New Page"
        wiki.appendChild(subtitle)

        // Create the main description
        var description = document.createElement("p")
        description.innerText = "This feature is coming soon, but will allow you to create new custom pages."
        wiki.appendChild(description)

        return
    }
    // Get all eras
    var eras = objects.filter(e => e.class == "Era")

    // Order eras by position (lowest to highest)
    eras.sort((a, b) => a.position - b.position)

    // Get all heads
    var heads = objects.filter(e => e.class == "Head")

    // Order heads by position x (lowest to highest) then by position y (lowest to highest) for any with the same x value
    heads.sort((a, b) => a.position[0] - b.position[0] || a.position[1] - b.position[1])

    console.log(`All: ${objects.length}, Eras: ${eras.length}, Heads: ${heads.length}`)

    // Populate the page with the main wiki page
    var wiki = document.getElementById("wikiPage")

    // Create the title
    var title = document.createElement("h1")
    title.innerText = `${window["mapSettings"].title} - Main Page`
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

    // Create a list of additional links
    var links = document.createElement("ul")
    links.title = "Additional Links"
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

    // Populate the page with the contents of the category
    var wiki = document.getElementById("wikiPage")

    // Create the title
    var title = document.createElement("h1")
    title.innerText = `${window["mapSettings"].title} - Category Page`
    wiki.appendChild(title)

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
      pageLink.href = `?id=${window["id"]}&page=${page.id}`
      pageLink.innerText = page.title

      pageItem.appendChild(pageLink)
    })

    wiki.appendChild(pageList)
  }
  // If it starts with "special:", then show that special page
  else if (pageId.startsWith("Special:")) {
    // Get the special page name
    var special = pageId.substring(8)

    if (special == "Categories") {
      // Get all the categories
      var categories = Array.from(new Set(objects.filter(e => e.categories).flatMap(e => e.categories))).sort()

      // Populate the page with the contents of the category
      var wiki = document.getElementById("wikiPage")

      // Create the title
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Special Page`
      wiki.appendChild(title)

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
        window.location.href = `?id=${window["id"]}&page=${objects[random - categories.length - 1].id}`
      }
    }
    else if (special == "Weak") {
      // Create the page
      var wiki = document.getElementById("wikiPage")

      // Create the title
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Special Page`
      wiki.appendChild(title)

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `Weak and Invaild Pages`
      wiki.appendChild(subtitle)

      // Create the list of invalid tags
      var invalidTagList = document.createElement("ul")
      invalidTagList.title = "Non-Existent Pages"

      // Get all tags that don't have a corresponding object
      var invalidTags = Array.from(new Set(objects.filter(e => e.tags).map(e => e.tags).flat().filter(e => !objects.find(f => f.title == e))))

      invalidTags.forEach(tag => {
        var invalidTagItem = document.createElement("li")
        invalidTagList.appendChild(invalidTagItem)

        var invalidTagLink = document.createElement("a")
        invalidTagLink.href = `?id=${window["id"]}&new=${tag}`
        invalidTagLink.innerText = tag
        invalidTagLink.title = tag
        invalidTagLink.classList.add("invalid")

        invalidTagItem.appendChild(invalidTagLink)
      })

      wiki.appendChild(invalidTagList)

      // Create the list of weak objects
      var weakObjectList = document.createElement("ul")
      weakObjectList.title = "Pages with Default Values"

      // Loop through all the objects, checking them against their type's default title and description
      objects.forEach(object => {
        switch (object.class) {
          case "Head":
            if (["", "New Head Block"].includes(object.title) || ["", "A storyline, event or person."].includes(object.description)) {
              var weakObjectItem = document.createElement("li")
              weakObjectList.appendChild(weakObjectItem)

              var weakObjectLink = document.createElement("a")
              weakObjectLink.href = `?id=${window["id"]}&page=${object.id}`
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
              weakObjectLink.href = `?id=${window["id"]}&page=${object.id}`
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
              weakObjectLink.href = `?id=${window["id"]}&page=${object.id}`
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
      // Create the page
      var wiki = document.getElementById("wikiPage")

      // Create the title
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Special Page`
      wiki.appendChild(title)

      // Create the subtitle
      var subtitle = document.createElement("h2")
      subtitle.innerText = `Special Pages`
      wiki.appendChild(subtitle)

      // Create the list of special pages
      var specialPageList = document.createElement("ul")
      specialPageList.title = "Special Pages"
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
    var page = objects.find(e => e.id == pageId)

    // If that id doesn't exist, then set 'page.class' to null
    if (page == undefined) page = {class: null}

    // Create a new document element for the timeline
    var iframe = document.createElement("iframe")
    iframe.id = "wikiMap"
    iframe.src = "../map/map.html?id=wikiMap"

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

      // Populate the page with the era page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Era Page`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = page.title
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = "This is the era page for this timeline. Click on a link below to go to a specific event page."
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.innerText = page.description
      wiki.appendChild(description2)

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
        headPage.href = `?id=${window["id"]}&page=${head.id}`
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
          mainArticleLink.href = `?id=${window["id"]}&page=${head.mainArticle}`
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
            mainArticleLink.href = `?id=${window["id"]}&page=${sub.mainArticle}`
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
      // Populate the page with the head page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Head Page`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = page.title
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = "This is the event page for this timeline. Click on a link below to go to a specific sub page."
      wiki.appendChild(description)

      var description2 = document.createElement("p")
      description2.innerText = page.description
      wiki.appendChild(description2)

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

      console.log(destinations)

      // Add all links and destinations to the incLinks array (flattened)
      var incLinks = subs.concat([...destinations].flat())

      console.log(incLinks)

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

        // Check if it has a main article
        if (sub.mainArticle != undefined) {
          // Create the main article link
          var mainArticleLink = document.createElement("a")
          mainArticleLink.href = `?id=${window["id"]}&page=${sub.mainArticle}`
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
      // Populate the page with the head page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - ${page.class} Page`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = (page.title) ? page.title : `${objects.find(e => e.id == page.parentId).title} --${page.type.toUpperCase()}--> ${objects.find(e => e.id == page.childId).title}`
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = `This is the page for this ${page.class}. This feature is not yet implemented.`
      wiki.appendChild(description)
    }
    // If the page is a wiki page, then show the plaintext with a message stating this is not yet implemented
    else if (page.class == "Info") {
      // Populate the page with the head page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Custom Wiki Page`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = page.title
      wiki.appendChild(subtitle)

      // Create the descriptions
      var description = document.createElement("p")
      description.innerText = `This is the wiki page for a concept within this timeline, the raw data will be shown below.\nThe formatting of this page has not yet been implemented.`
      wiki.appendChild(description)

      // Create the raw data
      var raw = document.createElement("div")
      raw.innerText = page.content
      wiki.appendChild(raw)
    }
    // Lastly, if the class is unknown, then tell the user the classic "this page does not exist... make one if you want" stuff
    else if (page.class == null) {
      // Populate the page with the head page
      var wiki = document.getElementById("wikiPage")

      // Create the titles
      var title = document.createElement("h1")
      title.innerText = `${window["mapSettings"].title} - Non-Existent Page`
      wiki.appendChild(title)

      var subtitle = document.createElement("h2")
      subtitle.innerText = page.title
      wiki.appendChild(subtitle)

      // Create the description (with a link inside)
      var description = document.createElement("p")
      description.innerText = `This page does not exist. You can create it by clicking the link below.\n`
      wiki.appendChild(description)

      var link = document.createElement("a")
      link.href = `?id=${window["id"]}&new`
      link.innerText = `Create New Page`
      description.appendChild(link)
    }

    // Add 'tags' and 'categories' sections if they exist (in collapsable divs)
    if (page.tags && page.tags.length > 0) {
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
      tags.appendChild(tagsList)

      page.tags.forEach(tag => {
        var tagItem = document.createElement("li")
        tagsList.appendChild(tagItem)

        var tagDest = objects.find(e => e.title == tag)

        var tagLink = document.createElement("a")
        tagLink.href = (tagDest) ? `?id=${window["id"]}&page=${tagDest.id}` : `?id=${window["id"]}&new&title=${tag}`
        tagLink.innerText = tag
        if (!tagDest) tagLink.classList.add("invalid")
        tagItem.appendChild(tagLink)
      })

      wiki.appendChild(tags)
    }

    if (page.categories && page.categories.length > 0) {
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
      categories.appendChild(categoriesList)

      page.categories.forEach(category => {
        var categoryItem = document.createElement("li")
        categoriesList.appendChild(categoryItem)

        var categoryLink = document.createElement("a")
        categoryLink.href = `?id=${window["id"]}&page=Category:${category}`
        categoryLink.innerText = category
        categoryItem.appendChild(categoryLink)
      })

      wiki.appendChild(categories)
    }
  }

  // Remove the table of contents if it exists and is empty
  if (!document.querySelector(".toc > li")) document.querySelector(".toc").remove()
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

function saveObjects() {
  var data = JSON.stringify(objects)

  // Update firestore document
  db.collection("timelines").doc(window["mapSettings"].id).update({
      map: data,
      lastChange: sessionStorage.getItem("ID")
  })
}