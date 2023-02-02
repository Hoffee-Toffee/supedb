window["ready"] = false
window["editing"] = false
window["newArrow"] = false
window["permissions"] = []

var objects = []

window["decrypt"] = false
window["subId"] = null

function display() {
    var scrollX = null
    var scrollY = null

    // Check if any objects already exist
    if (document.querySelectorAll(".object").length + document.querySelectorAll("svg").length > 1) {
        // Delete all the objects and svgs (except for the first svg) to recreate them using the objects array
        document.querySelectorAll(".object").forEach((obj) => { obj.remove() })
        document.querySelectorAll("svg").forEach((svg) => { if (svg.id !== "arrow-templates") { svg.remove() } })
    }
    else {
        // Get the scroll position from the url
        var url = new URL(window.location.href)
        if (url.searchParams.get("x") && url.searchParams.get("y")) {
            scrollX = url.searchParams.get("x")
            scrollY = url.searchParams.get("y")
        }
    }

    // Add the objects
    objects.forEach(obj => {
        newObj(obj.class, obj)
    })

    document.getElementById("addmenu").style.zIndex = 5

    // Reset the html size
    document.querySelector("html").style.height = "initial"
    document.querySelector("html").style.width = "initial"

    // Get the scrolling height and width of the screen
    var height = "calc(5em + " + document.scrollingElement.scrollHeight + "px)"
    var width = "calc(5em + " + document.scrollingElement.scrollWidth + "px)"

    // Set the html to the size of the map
    document.querySelector("html").style.height = height
    document.querySelector("html").style.width = width

    // Set the height of each era to the height of the map
    document.querySelectorAll(".era").forEach(era => {
        era.style.height = height
    })

    // Scroll to the position from the url (if supplied)
    if (scrollX && scrollY) {
        document.scrollingElement.scrollLeft = scrollX
        document.scrollingElement.scrollTop = scrollY
    }
}

function newObj(type, obj = null, e = null, headId = null) {
    if (e) {
        // Get the coordinates of the mouse including the scroll
        var x = e.clientX + document.scrollingElement.scrollLeft
        var y = e.clientY + document.scrollingElement.scrollTop

        // Create a blank element
        var test = document.createElement("div")
        test.style.width = "1000em"
        document.body.appendChild(test)

        // Get the width of the element in pixels
        var em = test.offsetWidth

        // Remove the element
        test.remove()

        em /= 1000

        // Convert the mouse coordinates to em
        x /= em
        y /= em

        // Round the coordinates to the nearest multiple of 5 (must be positive)
        x = (x <= 0.25) ? 0 : Math.round(x / 5) * 5
        y = (y <= 0.25) ? 0 : Math.round(y / 5) * 5
    }

    // Get the first ID that isn't already in use
    var id = 0
    while (objects.some(obj => obj.id == id)) {
        id++
    }

    // Add 1 again if the id already exists
    if (objects.some(obj => obj.id == id)) id++

    switch (type) {
        case "Head":
            if (obj == null) {
                var obj = {
                    "id": id,
                    "class": "Head",
                    "title": "New Head Block",
                    "description": "A storyline, event or person.",
                    "color": "FFFFFF",
                    "position": [
                        x,
                        y
                    ]
                }
                objects.push(obj)
            }

            var tag = document.createElement("div")
            tag.id = obj.id
            tag.classList.add("head")
            tag.classList.add("object")
            tag.addEventListener("dblclick", (e) => {
                // Make sure the user clicked on the object and not one of its children
                if (e.target == tag) {
                    moveObj(tag)
                } else {
                    // Make child not read-only
                    e.target.readOnly = false
                }
            })
            
            tag.style.borderColor = "#" + obj.color
            tag.style.boxShadow = "0 0 0.5em 0.01em black, 0 0 0.5em 0.01em #" + obj.color
            tag.style.marginLeft = (obj.position[0] + "em")
            tag.style.marginTop = (obj.position[1] + "em")
            // If mouse over but not over it's nodemenu
            tag.addEventListener("mouseover", (e) => { if (e.target == tag) { infobar.innerHTML = "Double click to move and add links." } })
            tag.addEventListener("mouseout", (e) => { infobar.innerHTML = "" })
            
            // If hovered over itself or any recursive children
            tag.addEventListener("mouseover", (e) => { if (e.target == tag || (e.target.parentElement && e.target.parentElement == tag) || (e.target.parentElement.parentElement && e.target.parentElement.parentElement == tag) || (e.target.parentElement.parentElement.parentElement && e.target.parentElement.parentElement.parentElement == tag)) { tag.style.zIndex = 5 } })
            tag.addEventListener("mouseout", (e) => { if (e.target == tag || (e.target.parentElement && e.target.parentElement == tag) || (e.target.parentElement.parentElement && e.target.parentElement.parentElement == tag) || (e.target.parentElement.parentElement.parentElement && e.target.parentElement.parentElement.parentElement == tag)) { tag.style.zIndex = "" } })

            var text = document.createElement("input")
            text.type = "text"
            text.setAttribute("oninput", "this.size = this.value.length")
            text.setAttribute("onchange", "updateLinks(this.parentElement)")
            text.addEventListener("mouseover", (e) => { infobar.innerHTML = "Double click to edit title." })
            text.addEventListener("mouseout", (e) => { infobar.innerHTML = "" })
            text.value = obj.title
            text.size = text.value.length
            text.readOnly = true
            text.classList.add("title")
            // Update the object once it loses focus
            text.addEventListener("blur", function() {
                updateObj(this, "title")
            })
            tag.appendChild(text)

            var color = document.createElement("input")
            color.type = "color"
            color.classList.add("colorPicker")
            color.style.backgroundColor = "#" + obj.color
            color.setAttribute("value", "#" + obj.color)
            color.setAttribute("list", "colors")
            color.addEventListener("change", function() { updateColor(color) })
            color.addEventListener("mouseover", function() { infobar.innerHTML = "Click to change the color of this node, it's links, and it's subnodes." })
            color.addEventListener("mouseout", function() { infobar.innerHTML = "" })
            tag.appendChild(color)

            var tooltip = document.createElement("textarea")
            tooltip.value = (obj.description != null) ? obj.description : ""
            tooltip.classList.add("tooltip")
            tooltip.size = tooltip.value.length
            tooltip.readOnly = true
            tooltip.setAttribute("oninput", `
                this.style.height = 'auto'
                this.style.height = this.scrollHeight+'px'
                this.scrollTop = this.scrollHeight
            `)
            tooltip.addEventListener("blur", function() {
                updateObj(this, "description")
            })
            tooltip.addEventListener("mouseover", function() { infobar.innerHTML = "Double click to edit the description of this node." })
            tooltip.addEventListener("mouseout", function() { infobar.innerHTML = "" })
            tag.appendChild(tooltip)
            
            document.getElementsByTagName("BODY")[0].appendChild(tag)

            tooltip.style.height = 'auto'
            tooltip.style.height = tooltip.scrollHeight+'px'
            tooltip.scrollTop = tooltip.scrollHeight

            if (!document.getElementById(obj.color + "-arrow")) {
                var arrow = document.getElementById("arrow").cloneNode(true)

                arrow.setAttribute("id", obj.color + "-arrow")

                arrow.children[0].setAttribute("fill", "#" + obj.color)

                var element = document.getElementsByTagName("defs")[0]
                element.appendChild(arrow)
            }
            break

        case "Sub":
            if (obj == null) {
                var obj = {
                    "id": id,
                    "class": "Sub",
                    "title": "New Sub Block",
                    "description": "A specific event",
                    "headId": headId,
                    "position": [
                        x + 5,
                        y + 5
                    ]
                }
                objects.push(obj)
            }

            var tag = document.createElement("div")
            tag.id = obj.id
            tag.classList.add("sub")
            tag.classList.add("object")
            tag.addEventListener("dblclick", (e) => {
                // Make sure the user clicked on the object and not one of its children
                if (e.target == tag) {
                    moveObj(tag)
                } else {
                    e.target.readOnly = false
                }
            })
            tag.style.borderColor = "#" + objects.find(e => e.id == obj.headId).color
            tag.style.boxShadow = "0 0 0.5em 0.01em black, 0 0 0.5em 0.01em #" + objects.find(e => e.id == obj.headId).color
            tag.style.marginLeft = (obj.position[0] + "em")
            tag.style.marginTop = (obj.position[1] + "em")
            tag.addEventListener("mouseover", function(e) { if (e.target == tag) { infobar.innerHTML = "Double click to move and add links to this node."; tag.style.zIndex = 5 } })
            tag.addEventListener("mouseout", function() { infobar.innerHTML = ""; tag.style.zIndex = "" })

            // If hovered over itself or any recursive children
            tag.addEventListener("mouseover", (e) => { if (e.target == tag || (e.target.parentElement && e.target.parentElement == tag) || (e.target.parentElement.parentElement && e.target.parentElement.parentElement == tag) || (e.target.parentElement.parentElement.parentElement && e.target.parentElement.parentElement.parentElement == tag)) { tag.style.zIndex = 5 } })
            tag.addEventListener("mouseout", (e) => { if (e.target == tag || (e.target.parentElement && e.target.parentElement == tag) || (e.target.parentElement.parentElement && e.target.parentElement.parentElement == tag) || (e.target.parentElement.parentElement.parentElement && e.target.parentElement.parentElement.parentElement == tag)) { tag.style.zIndex = "" } })


            var text = document.createElement("input")
            text.type = "text"
            text.setAttribute("oninput", "this.size = this.value.length")
            text.setAttribute("onchange", "updateLinks(this.parentElement)")
            text.addEventListener("blur", function() {
                updateObj(this, "title")
            })

            text.value = obj.title
            text.size = text.value.length
            text.readOnly = true
            text.classList.add("title")
            text.addEventListener("mouseover", function() { infobar.innerHTML = "Double click to edit the title of this node." })
            text.addEventListener("mouseout", function() { infobar.innerHTML = "" })
            tag.appendChild(text)

            var tooltip = document.createElement("textarea")
            tooltip.value = (obj.description != null) ? obj.description : ""
            tooltip.classList.add("tooltip")
            tooltip.size = tooltip.value.length
            tooltip.readOnly = true
            tooltip.setAttribute("oninput", `
                this.style.height = 'auto'
                this.style.height = this.scrollHeight+'px'
                this.scrollTop = this.scrollHeight
            `)
            tooltip.addEventListener("blur", function() {
                updateObj(this, "description")
            })
            tooltip.addEventListener("mouseover", function() { infobar.innerHTML = "Double click to edit the description of this node." })
            tooltip.addEventListener("mouseout", function() { infobar.innerHTML = "" })
            tag.appendChild(tooltip)
            
            document.getElementsByTagName("BODY")[0].appendChild(tag)

            tooltip.style.height = 'auto'
            tooltip.style.height = tooltip.scrollHeight+'px'
            tooltip.scrollTop = tooltip.scrollHeight
            break

        case "Info":
            break

        case "Era":
            if (obj == null) {
                var obj =     {
                    "id": id,
                    "class": "Era",
                    "title": "New Era",
                    "description": "Description of this era",
                    "position": x
                }
                objects.push(obj)
            }

            var tag = document.createElement("div")
            tag.setAttribute( "id", obj.id )
            var desc = (obj.title != null) ? obj.title : ""

            var text = document.createElement("input")
            text.type = "text"
            text.setAttribute("oninput", "this.size = this.value.length")
            text.setAttribute("onchange", "updateLinks(this.parentElement)")
            text.addEventListener("blur", function() {
                updateObj(this, "title")
            })

            text.value = obj.title
            text.size = text.value.length
            text.readOnly = true
            text.classList.add("title")
            text.addEventListener("mouseover", function() { infobar.innerHTML = "Double click to edit the title of this era." })
            text.addEventListener("mouseout", function() { infobar.innerHTML = "" })
            tag.appendChild(text)

            tag.classList.add("era")
            tag.classList.add("object")
            tag.addEventListener("dblclick", (e) => {
                // Make sure the user clicked on the object and not one of its children
                if (e.target == tag) {
                    moveObj(tag)
                } else {
                    e.target.readOnly = false
                }
            })
            tag.style.left = obj.position + "em"
            tag.addEventListener("mouseover", function(e) { infobar.innerHTML = "Double click to move this era." })
            tag.addEventListener("mouseout", function() { infobar.innerHTML = "" })

            var element = document.getElementsByTagName("BODY")[0]
            element.appendChild( tag )
            break

        case "Link":
            var tag = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline")

            tag.id = obj.id
            poly.style.fill = "none"
            poly.style.strokeWidth = "0.1em"
            var desc = (obj.description != null) ? obj.description : ""
            var tooltip = document.createElement("div")
            tooltip.classList.add("tooltip")
            tooltip.innerText = desc
            tag.appendChild(tooltip)

            tag.addEventListener("dblclick", (e) => {
                // Make sure the user clicked on the object and not one of its children
                if (e.target == tag) {
                    moveObj(tag)
                } else {
                    e.target.readOnly = false
                }
            })

            var points = []

            obj.line.forEach(el => {
                var xreq = document.getElementById(objects.find(e => e.id == el[0]).id)
                var yreq = document.getElementById(objects.find(e => e.id == el[2]).id)
        
                var x = xreq.offsetLeft + (xreq.offsetWidth * (el[1] - 0.5) )
                var y = yreq.offsetTop + (yreq.offsetHeight * el[3])
        
                points.push([x, y])
            })

            if (obj.childId == "mouse") {
                try {
                    points.push([window.event.pageX , window.event.pageY])
                }
                catch {
                    // Delete the link
                    objects.splice(objects.indexOf(obj), 1)
                    tag.remove()
                    window["newArrow"] = false

                    save()

                    return
                }

                document.addEventListener("mousemove", function() {
                    if (objects.find(e => e.childId == "mouse") == undefined) return
                    var el = document.getElementById(objects.find(e => e.childId == "mouse").id).children[1]
                    el.setAttribute("points", [el.getAttribute("points").split(",").slice(0, 2), [window.event.pageX , window.event.pageY]])
                })
            }
            else { // If the link is not being created, then it needs an edit button

                // Delete the button if it already exists
                var old = document.getElementById("editLink" + obj.id)

                if (old) old.remove()

                // Create the button
                var button = document.createElement("button")
                button.classList.add("editLink")
                button.id = "editLink" + obj.id

                var color = "grey"

                // Get the color of the line
                if (obj.type != "f"){
                    if (objects.find(e => e.id == obj.parentId).class == "Head") {
                        color = "#" + objects.find(e => e.id == obj.parentId).color
                    }
                    else {
                        color = "#" + objects.find(e => e.id == objects.find(e => e.id == obj.parentId).headId).color
                    }
                }
            
                // Color the border by default
                button.style.backgroundColor = "black"
                button.style.borderColor = color

                // Run the linkPoints function unless the link child is the mouse
                if (obj.childId != "mouse") linkPoints(button, obj, points)
        
                // When hovered, show the context menu
                button.addEventListener("mouseover", function() {
                    // Return if the context menu is already open elsewhere
                    if (document.getElementById("context-menu")) return

                    // Get the position of the button
                    var mid = linkPoints(button, obj, points)

                    // Create the event object
                    var e = {
                        clientX: mid[0] - window.scrollX,
                        clientY: mid[1] - window.scrollY
                    }

                    // Get the buttons for the context menu
                    var buttons = [
                        {
                            text: "Delete",
                            onclick: () => { objects.splice(objects.indexOf(obj), 1); tag.remove(); button.remove() },
                            key: "Del"
                        },
                        {
                            text: "Make Factor",
                            onclick: () => {
                                obj.type = "f"
                                newObj(obj.class, obj)
                            },
                            key: "F"
                        },
                        {
                            text: "Make Cause",
                            onclick: () => {
                                obj.type = "c"
                                newObj(obj.class, obj)
                            },
                            key: "C"
                        },
                        {
                            text: "Make Extension",
                            onclick: () => {
                                obj.type = "e"
                                newObj(obj.class, obj)
                            },
                            key: "E"
                        },
                        {
                            text: "Flip Direction",
                            onclick: () => {
                                // Swap the parent and child
                                var temp = obj.parentId
                                obj.parentId = obj.childId
                                obj.childId = temp
                                newObj(obj.class, obj)

                                // Reverse the points
                                obj.line = obj.line.reverse()
                                newObj(obj.class, obj)
                            }
                        }
                    ]

                    genContextMenu(e, buttons, true)
                })
            }

            poly.setAttribute("points", points)

            if (obj.type != "f") {
                if (objects.find(e => e.id == obj.parentId).class == "Head") {
                    poly.style.stroke = "#" + objects.find(e => e.id == obj.parentId).color
                }
                else {
                    poly.style.stroke = "#" + objects.find(e => e.id == objects.find(e => e.id == obj.parentId).headId).color
                }
            }
            
            if (obj.type == "f") {
                poly.setAttribute("marker-end", "url(#arrow)")
                poly.style.stroke = "grey"
            }
            else if (obj.type == "c") {
                if (objects.find(e => e.id == obj.parentId).class == "Head") {
                    poly.setAttribute("marker-end", "url(#" + objects.find(e => e.id == obj.parentId).color + "-arrow)")
                }
                else {
                    poly.setAttribute("marker-end", "url(#" + objects.find(e => e.id == objects.find(e => e.id == obj.parentId).headId).color + "-arrow)")
                }
            }

            tag.appendChild(poly)
            
            var element = document.getElementsByTagName("BODY")[0]
            element.appendChild(tag)

            // Append the button if it exists
            if (button) element.appendChild(button)

            break
    }

    tag.addEventListener("mouseover", function() {
        if (window["newArrow"] && document.querySelectorAll(".addLink").length == 0 && obj.class != "Era") {
            var linkTop = document.createElement("span")
            linkTop.classList.add("addLink")
            linkTop.id = "linkTop"
            this.appendChild(linkTop)
        
            var linkBottom = document.createElement("span")
            linkBottom.classList.add("addLink")
            linkBottom.id = "linkBottom"
            this.appendChild(linkBottom)
        
            var linkLeft = document.createElement("span")
            linkLeft.classList.add("addLink")
            linkLeft.id = "linkLeft"
            this.appendChild(linkLeft)
        
            var linkRight = document.createElement("span")
            linkRight.classList.add("addLink")
            linkRight.id = "linkRight"
            this.appendChild(linkRight)

            var links = [linkTop, linkBottom, linkLeft, linkRight]
            
            links.forEach(link => {
                link.classList.add("mouseLink")
                link.addEventListener("mouseout", function (e) {
                    // Get the element at the location of the mouse
                    if (window["newArrow"]) {
                        document.querySelectorAll(".addLink").forEach((button) => {
                            button.remove()
                        })
                    }
                })
            })
        }
    })

    tag.addEventListener("mouseout", function (e) {
        if (window["newArrow"] && e.relatedTarget && !e.relatedTarget.classList.contains("addLink")) {
            // Delete the buttons
            document.querySelectorAll(".addLink").forEach((button) => {
                button.remove()
            })
        }
    })
}

function updateObj(el, attr, toSave = true) {
    objects.find(e => e.id == el.parentElement.id)[attr] = el.value
    if (toSave) {
        save()
    }
}

function updateColor(color) {
    var head = color.parentElement.id

    objects.find(e => e.id == head).color = color.value.slice(1)

    save()
}

document.addEventListener("click", function (event) {
    // Check if you clicked nothing or the html element
    if ((event.target == null || event.target.tagName == "HTML") && window["editing"]) {
        document.querySelectorAll(".editing").forEach((edit) => {
            edit.classList.remove("editing")
            Array.from(edit.children).forEach(child => {
                child.readOnly = true
            })

            window["editing"] = false
        })

        document.querySelectorAll(".addLink").forEach((button) => {
            button.remove()
        })

        save()
        
        return
    }

    if ( event.target.classList.contains("addLink") && !window["newArrow"] ) {
        window["newArrow"] = true

        var coords = [0, 0.5]
        if ( event.target.id == "linkRight" ) coords = [1, 0.5]
        if ( event.target.id == "linkTop" ) coords = [0.5, 0]
        if ( event.target.id == "linkBottom" ) coords = [0.5, 1]

        var obj = {
            "id": getNew(),
            "class": "Link",
            "line": [
                [
                    parseInt(event.target.parentElement.id),
                    coords[0],
                    parseInt(event.target.parentElement.id),
                    coords[1]
                ]
            ],
            "parentId": parseInt(event.target.parentElement.id),
            "childId": "mouse",
            "type": "c"
        }
        objects.push(obj)

        newObj("Link", obj)
    }
    else if ( event.target.classList.contains("addLink") && window["newArrow"] ) {
        window["newArrow"] = false

        var coords = [0, 0.5]
        if ( event.target.id == "linkRight" ) coords = [1, 0.5]
        if ( event.target.id == "linkTop" ) coords = [0.5, 0]
        if ( event.target.id == "linkBottom" ) coords = [0.5, 1]

        var obj = objects.find(obj => obj.childId === "mouse")

        obj.childId = parseInt(event.target.parentElement.id)

        if ( ["linkLeft", "linkRight"].includes(event.target.id) && objects.find(e => e.id == obj.parentId).position[1] !== objects.find(e => e.id == obj.childId).position[1] ) {
            obj.line.push(
                [
                    obj.line[0][0],
                    obj.line[0][1],
                    parseInt(event.target.parentElement.id),
                    coords[1]
                ]
            )

        }
        else if ( ["linkTop", "linkBottom"].includes(event.target.id) && objects.find(e => e.id == obj.parentId).position[0] !== objects.find(e => e.id == obj.childId).position[0] ) {
            obj.line.push(
                [
                    parseInt(event.target.parentElement.id),
                    coords[0],
                    obj.line[0][2],
                    obj.line[0][3]
                ]
            )
        }

        obj.line.push(
            [
                parseInt(event.target.parentElement.id),
                coords[0],
                parseInt(event.target.parentElement.id),
                coords[1]
            ]
        )

        document.getElementById(obj.id).remove()

        newObj("Link", obj)
    }

    if (Array.from(document.querySelectorAll(".editing")).includes(document.activeElement.parentElement)) {
        document.querySelectorAll(".addLink").forEach((button) => {
            button.remove()
        })
    }

    if (!(event.target.classList.contains("editing") || event.target.parentElement.classList.contains("editing")) && !event.ctrlKey) {
        document.querySelectorAll(".editing").forEach((edit) => {
            edit.classList.remove("editing")
            Array.from(edit.children).forEach(child => {
                child.readOnly = true
            })

            window["editing"] = false
        })
        document.querySelectorAll(".addLink").forEach((button) => {
            button.remove()
        })

        save()
    }
    else if (event.target.classList.contains("object") || event.target.parentElement.classList.contains("object")) {
        var obj = (event.target.classList.contains("object")) ? event.target : event.target.parentElement

        obj.classList.toggle("editing")
        Array.from(obj.children).forEach(child => {
            child.readOnly = false
        })
        window["editing"] = true

        var els = document.querySelectorAll(".editing")

        document.querySelectorAll(".addLink").forEach((button) => {
            button.remove()
        })

        if (els.length == 1 && !els[0].classList.contains("era")) {
            var linkTop = document.createElement("span")
            linkTop.classList.add("addLink")
            linkTop.id = "linkTop"
            els[0].appendChild(linkTop)
        
            var linkBottom = document.createElement("span")
            linkBottom.classList.add("addLink")
            linkBottom.id = "linkBottom"
            els[0].appendChild(linkBottom)
        
            var linkLeft = document.createElement("span")
            linkLeft.classList.add("addLink")
            linkLeft.id = "linkLeft"
            els[0].appendChild(linkLeft)
        
            var linkRight = document.createElement("span")
            linkRight.classList.add("addLink")
            linkRight.id = "linkRight"
            els[0].appendChild(linkRight)
        }
    }

    if (event.target.id == "addmenu" || (event.target.parentElement && event.target.parentElement.id == "addmenu")) {
        if (document.getElementById("addmenu").classList.contains("open")) {
            document.getElementById("addmenu").classList.remove("open")
        }
        else {
            document.getElementById("addmenu").classList.add("open")
        }
    }

    if (event.target.classList.contains("addClassObj")) {
        document.getElementById("addmenu").classList.remove("open")
        newObj(event.target.innerHTML)
    }

    // Check if updating a head (first click)
    if (window["subId"] && !window["subId"].endsWith("-")) {
        window["subId"] += "-"
    }
    // If clicking on a head (second click)
    else if (event.target && event.target.classList.contains("head")) {
        // Get the subId
        var subId = window["subId"].split("-")[0]

        // Loop through all objects
        objects.forEach(obj => {
            var el = document.getElementById(obj.id)
    
            // Reset all filters and pointer events
            if (obj.class != "Head") {
                el.style.filter = "none"
                el.style.pointerEvents = "initial"
    
                // If a link then remove the filter from the edit button
                if (obj.class == "Link") document.getElementById("editLink" + obj.id).style.filter = "none"
            }

            // Check if this is the subId
            if (obj.id == subId) {
                obj.headId = event.target.id
                el.remove()

                newObj("Sub", obj)
            }
        })
    }
    // Else if clicking nothing (second click)
    else if ([null, document.body].includes(event.target)) {
        // Loop through all objects
        objects.forEach(obj => {
            var el = document.getElementById(obj.id)
    
            // Reset all filters and pointer events
            if (obj.class != "Head") {
                el.style.filter = "none"
                el.style.pointerEvents = "initial"
    
                // If a link then remove the filter from the edit button
                if (obj.class == "Link") document.getElementById("editLink" + obj.id).style.filter = "none"
            }
        })
    }
}, false)

document.onkeydown = (event) => {
    if ( window["newArrow"] && ["c", "f", "e"].includes(event.key) ) {
        var obj = objects.find(obj => obj.childId === "mouse")

        obj.type = event.key

        var el = document.getElementById(obj.id).children[1]
        points = el.getAttribute("points")

        document.getElementById(obj.id).remove()
        newObj("Link", obj)

        var el = document.getElementById(obj.id).children[1]
        el.setAttribute("points", points)
    }

    if( ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key) && window["editing"] ) {
        // If the user is also holding the shift key (and only editing one node) then toggle the selection of all the nodes in the direction of the arrow key
        if (event.shiftKey && document.querySelectorAll(".editing").length == 1) {
            // Get the id of the node that is being edited
            var id = document.querySelector(".editing").id

            // Get the x and y position of the selected node
            var position = objects.find(obj => obj.id == id).position

            // Run get a set of nodes in the direction of the arrow key
            var nodes = []

            // First check runs for sub, head, and info nodes
            var objs = objects.filter(obj => ["Sub", "Head", "Info"].includes(obj.class))

            if (event.key == "ArrowUp") nodes = objs.filter(obj => obj.position[1] <= position[1])
            else if (event.key == "ArrowDown") nodes = objs.filter(obj => obj.position[1] >= position[1])
            else if (event.key == "ArrowLeft") nodes = objs.filter(obj => obj.position[0] <= position[0])
            else if (event.key == "ArrowRight") nodes = objs.filter(obj => obj.position[0] >= position[0])

            // Second check runs for era nodes (only for left and right arrow keys)
            objs = objects.filter(obj => obj.class == "Era")

            if (event.key == "ArrowLeft") nodes = nodes.concat(objs.filter(obj => obj.position <= position[0]))
            else if (event.key == "ArrowRight") nodes = nodes.concat(objs.filter(obj => obj.position >= position[0]))

            // Toggle the selection of each in the set of nodes (except the selected node)
            nodes.forEach(node => {
                if (node.id != id) {
                    document.getElementById(node.id).classList.toggle("editing")
                }
            })

            return
        }

        var els = document.querySelectorAll(".editing")

        if (Array.from(els).includes(document.activeElement.parentElement)) {
            return
        }

        event.preventDefault()

        els.forEach(el => {
            var updated = 5

            if ( ["ArrowUp","ArrowLeft"].includes(event.key) ) {
                updated = -5
            }

            var elObj = objects.find(obj => obj.id == el.id)

            if ( ["ArrowLeft","ArrowRight"].includes(event.key) ) {
                if (elObj.class != "Era") {
                    updated += Number(el.style.marginLeft.slice(0, el.style.marginLeft.length - 2))
                }
                else {
                    updated += Number(el.style.left.slice(0, el.style.left.length - 2))
                }

                if (updated >= 0) {
                    if (elObj.class != "Era") {
                        el.style.marginLeft = updated + "em"
                        elObj.position[0] = updated
                    }
                    else {
                        el.style.left = updated + "em"
                        elObj.position = updated
                    }
                }
            }
            else {
                updated += Number(el.style.marginTop.slice(0, el.style.marginTop.length - 2))

                if (updated >= 0 && elObj.class != "Era") {
                    el.style.marginTop = updated + "em"
                    elObj.position[1] = updated
                }
                else if (elObj.class == "Era") {
                    elObj.position = updated
                }
            }

            var toUpdate = objects.filter(e => e.parentId == el.getAttribute("id") || e.childId == el.getAttribute("id") )

            toUpdate.forEach(element => {
                updateLinks(element)
            })
        })

        // Reset the height of each era
        document.querySelectorAll(".era").forEach(era => {
            era.style.height = "0px"
        })

        // Get the scrolling height of the screen
        var height = document.scrollingElement.scrollHeight + "px"

        // Set the height of each era to the height of the map
        document.querySelectorAll(".era").forEach(era => {
            era.style.height = height
        })

        // If only one node is selected then scroll the screen so that the node is on the screen (don't if already in view however)
        if (els.length == 1) {
            els[0].scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
        }
    }
    else if (event.key == "Enter" && window["editing"]) {
        event.preventDefault()

        document.querySelectorAll(".editing").forEach(edit => {
            edit.classList.remove("editing")
            Array.from(edit.children).forEach(child => {
                child.readOnly = true
            })
        })

        window["editing"] = false

        save()
    }
    else if (event.key == "Enter" && window["decrypt"]) {
        document.getElementById("subForm").click()
    }
    else if (Array.from(document.querySelectorAll(".editing")).includes(document.activeElement.parentElement)) {
        setTimeout(function (){
            var el = document.activeElement.parentElement

            var toUpdate = objects.filter(e => e.parentId == el.getAttribute("id") || e.childId == el.getAttribute("id") )
    
            toUpdate.forEach(element => {
                var points = []
    
                element.line.forEach(line => {
                    var xreq = document.getElementById(objects.find(obj => obj.id == line[0]).id)
                    var yreq = document.getElementById(objects.find(obj => obj.id == line[2]).id)
    
                    var x = xreq.offsetLeft + (xreq.offsetWidth * (line[1] - 0.5) )
                    var y = yreq.offsetTop + (yreq.offsetHeight * line[3])
                    
                    points.push([x, y])
                })
    
                document.getElementById(element.id).children[1].setAttributeNS(null, "points", points)
            })
          }, 10)
    }

    // Check if the 'p' key is pressed without there being any active elements or any other keys pressed
    if (event.key == "p" && document.activeElement == document.body && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        // Prevent the default action of the keypress
        event.preventDefault()

        // Html class will go through the following cycle:
        // {} -> {print} -> {print, print1} -> {print, print1, print2} -> {} -> ...

        // Check if it has the print2 class
        if (document.querySelector("html").classList.contains("print2")) {
            // If it does, remove all print classes and exit full screen
            document.querySelector("html").classList.remove("print")
            document.querySelector("html").classList.remove("print1")

            document.querySelectorAll(".print2").forEach(el => {
                el.classList.remove("print2")
            })

            document.exitFullscreen()

            // Reset each link
            objects.forEach(obj => {
                if (obj.class == "Link") {
                    updateLinks(obj)
                }
            })
        }
        // Check if it has the print1 class
        else if (document.querySelector("html").classList.contains("print1")) {
            // If it does, add the print2 class
            document.querySelector("html").classList.add("print2")

            // Hide all heads with "A storyline, event or person." as a tooltip, and hide all subs with "A specific event" as a tooltip
            objects.forEach(obj => {
                if (obj.class == "Head" && obj.description == "A storyline, event or person.") {
                    document.getElementById(obj.id).classList.add("print2")
                }
                else if (obj.class == "Sub" && obj.description == "A specific event") {
                    document.getElementById(obj.id).classList.add("print2")
                }
            })
        }
        // Check if it has the print class
        else if (document.querySelector("html").classList.contains("print")) {
            // If it does, add the print1 class
            document.querySelector("html").classList.add("print1")
        }
        // If it doesn't have any print classes
        else {
            // Add the print class and enter full screen
            document.querySelector("html").classList.add("print")

            document.documentElement.requestFullscreen()

            // Reset each link
            objects.forEach(obj => {
                if (obj.class == "Link") {
                    updateLinks(obj)
                }
            })
        }
    }
    // Same for the 'e' key
    else if (event.key == "e" && document.activeElement == document.body && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        // Get all heads with "A storyline, event or person." as a tooltip, and all subs with "A specific event" as a tooltip
        objects.forEach(obj => {
            if (obj.class == "Head" && obj.description == "A storyline, event or person.") {
                document.getElementById(obj.id).classList.toggle("print2")
            }
            else if (obj.class == "Sub" && obj.description == "A specific event") {
                document.getElementById(obj.id).classList.toggle("print2")
            }
        })
    }
}

function updateLinks(element) {
    var points = []

    element.line.forEach(line => {
        var xreq = document.getElementById(objects.find(obj => obj.id == line[0]).id)
        var yreq = document.getElementById(objects.find(obj => obj.id == line[2]).id)

        var x = xreq.offsetLeft + (xreq.offsetWidth * (line[1] - 0.5) )
        var y = yreq.offsetTop + (yreq.offsetHeight * line[3])
        
        points.push([x, y])
    })

    // Run the linkPoints function to update the points of the link unless it's pointing to the mouse
    if (element.childId != "mouse") {
        linkPoints(document.getElementById("editLink" + element.id), objects.find(obj => obj.id == element.id), points)
    }

    document.getElementById(element.id).children[1].setAttributeNS(null, "points", points)
}

function save() {
    var data = JSON.stringify(objects)

    if (window["mapSettings"].encrypted) {
        // Coming soon
        // data = encrypt(data, window["key"])
    }

    // Update firestore document
    db.collection("timelines").doc(window["mapSettings"].id).update({
        map: data,
        lastChange: auth.currentUser.email
    })
}

function moveObj(obj) {
    document.querySelectorAll(".addLink").forEach((button) => {
        button.remove()
    })

    document.querySelectorAll(".editing").forEach(edit => {
        edit.classList.remove("editing")
        Array.from(edit.children).forEach(child => {
            child.readOnly = true
        })
    })

    obj.classList.add("editing")

    if (obj !== document.activeElement.parentElement && !obj.classList.contains("era") ) {
        var linkTop = document.createElement("span")
        linkTop.classList.add("addLink")
        linkTop.id = "linkTop"
        obj.appendChild(linkTop)

        var linkBottom = document.createElement("span")
        linkBottom.classList.add("addLink")
        linkBottom.id = "linkBottom"
        obj.appendChild(linkBottom)

        var linkLeft = document.createElement("span")
        linkLeft.classList.add("addLink")
        linkLeft.id = "linkLeft"
        obj.appendChild(linkLeft)

        var linkRight = document.createElement("span")
        linkRight.classList.add("addLink")
        linkRight.id = "linkRight"
        obj.appendChild(linkRight)
    }

    Array.from(obj.children).forEach(child => {
        child.readOnly = false
    })

    window["editing"] = true
}

function mapMenu() {
    document.getElementById("subForm").addEventListener("click", function() {
        if (window["decrypt"]) {
            document.getElementById("keyLabel").classList.remove("error")
            try {
                // Coming soon
                // objects = JSON.parse( decrypt( window["map"], document.getElementById("key").value ) )

            } catch (error) {
                document.getElementById("keyLabel").classList.add("error")
                return
            }

            if (window["ready"]) {
                display()
            }
            else {
                window["ready"] = true
            }

            window["key"] = document.getElementById("key").value
            document.getElementById("popup").style = null
            window["decrypt"] = false
        }
        else if (window["onMainMenu"]) {
            window["mapSettings"].title = document.getElementById("newTitle").value
            window["mapSettings"].description = document.getElementById("newDesc").value
    
            document.getElementById("popup").style = null
        }
        else {
            window["mapSettings"].encrypted = document.getElementById("isEncrypted").checked
    
            var data = JSON.stringify(objects)
    
            if (window["mapSettings"].encrypted) {
                window["key"] = document.getElementById("newKey").value

                // Coming soon
                // data = encrypt(data, window["key"])
            }
    
            window["mapSettings"].map = data
    
            window["onMainMenu"] = true
            Array.from(document.getElementById("popup").children).forEach(element => {
                if (!element.classList.length || element.classList.contains("editMenu")) {
                    element.style.display = "block"
                }
                else {
                    element.style.display = "none"
                }
            })
        }
    })

    document.getElementById("keyMenu").addEventListener("click", function() {
        window["onMainMenu"] = false
        document.getElementById("newTitle").value = window["mapSettings"].title
        document.getElementById("newDesc").value = window["mapSettings"].description
        document.getElementById("isEncrypted").checked = window["mapSettings"].encrypted
        document.getElementById("newKey").value = window["key"]

        Array.from(document.getElementById("popup").children).forEach(element => {
            if (!element.classList.length || element.classList.contains("editEncrypt")) {
                element.style.display = "block"
            }
            else {
                element.style.display = "none"
            }
        })
    })
    
    document.getElementById("backMenu").addEventListener("click", function() {
        window["onMainMenu"] = true
        Array.from(document.getElementById("popup").children).forEach(element => {
            if (!element.classList.length || element.classList.contains("editMenu")) {
                element.style.display = "block"
            }
            else {
                element.style.display = "none"
            }
        })
    })

    if (!window["decrypt"]) {
        window["onMainMenu"] = true
        if (typeof window["mapSettings"] === 'undefined') {
            window["mapSettings"] = {
                id: null,
                title: "Map Title",
                description: "Map Description",
                map: "[]",
                encrypted: false
            }
        }
        else {
            window["mapSettings"].map = JSON.stringify(objects)
            document.getElementsByTagName("title")[0].innerText = "New Map"
        }

        document.getElementById("newTitle").value = window["mapSettings"].title
        document.getElementById("newDesc").value = window["mapSettings"].description
        document.getElementById("isEncrypted").checked = window["mapSettings"].encrypted
        if (typeof window["mapSettings"].encrypted) {
            document.getElementById("newKey").value = window["key"]
        }

        document.getElementById("popup").style = "visibility: visible"

        Array.from(document.getElementById("popup").children).forEach(element => {
            if (!element.classList.length || element.classList.contains("editMenu")) {
                element.style.display = "block"
            }
            else {
                element.style.display = "none"
            }
        })
    }
}

function start() {
    const infobar = document.getElementById("infobar")

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

    // If they don't have any permissions, redirect them to the dashboard
    if (window["permissions"] == null) {
        location.href = "../dash/dash.html"
    }

    // Get the map ID from the URL
    var url = new URL(window.location.href)
    window["id"] = url.searchParams.get("id")

    if (window["id"] == null) {
        mapMenu()
    }

    window["mapSettings"] = null

    // Sync all data from the timeline (don't sync if the user is the one that made the last change unless they are loading for the first time)
    db.collection("timelines").doc(window["id"]).onSnapshot((map) => {
        if (map.data().lastChange != auth.currentUser.email || !window["mapSettings"]) {
            document.getElementsByTagName("title")[0].innerText = map.data().title
    
            window["mapSettings"] = {
                id: map.id,
                title: map.data().title,
                description: map.data().description,
                encrypted: map.data().encrypted
            }
    
            if (window["mapSettings"].encrypted) {
                document.getElementById("popup").style = "visibility: visible"
    
                Array.from(document.getElementById("popup").children).forEach(element => {
                    if (!element.classList.length || element.classList.contains("enterKey")) {
                        element.style.display = "block"
                    }
                    else {
                        element.style.display = "none"
                    }
                })
    
                document.getElementById("key").focus()
                window["decrypt"] = true
                window["map"] = map.data().map
                mapMenu()
            }
            else {
                objects = JSON.parse(map.data().map)
    
                if (window["ready"]) {
                    display()
                }
                else {
                    window["ready"] = true
                }
            }
        }
        else {
            // Reset the html size
            document.querySelector("html").style.width = "initial"
            
            // Reset the height of each era
            document.querySelectorAll(".era").forEach(era => {
                era.style.height = "0px"
            })

            // Get the scrolling height and width of the screen
            var height = document.scrollingElement.scrollHeight + "px"
            var width = "calc(5em + " + document.scrollingElement.scrollWidth + "px)"

            // Set the html to the size of the map
            document.querySelector("html").style.width = width

            // Set the height of each era to the height of the map
            document.querySelectorAll(".era").forEach(era => {
                era.style.height = height
            })
        }
    })
    
    if (window["ready"]) {
        display()
    }
    else {
        window["ready"] = true
    }

    document.getElementById("mapSettings").addEventListener("click", function() {
        mapMenu()
    })
}

function contextMenu(e) {
    e.preventDefault()

    // For clicking on the body/html
    if (["BODY", "HTML"].includes(e.target.tagName)) {
        var attr = [
            { // Era
                text: "New Era",
                onclick: () => newObj("Era", null, e)

            },
            {
                text: "New Head",
                onclick: () => newObj("Head", null, e)
            }
        ]
    }

    // For clicking on a head or sub (clicked element or its parent must have a class of "head" or "sub")
    // Note that the clicked element or its parent might not exist
    var tList = (e.target.classList) ? Array.from(e.target.classList) : []
    var pList = (e.target.parentElement) ? Array.from(e.target.parentElement.classList) : []

    if (tList.concat(pList).includes("head") || tList.concat(pList).includes("sub")) {
        // Get the parent/child that is the sub/head
        var el = (tList.includes("head") || tList.includes("sub")) ? e.target : e.target.parentElement

        // Get the head ID (or itself if it's a head)
        var head = (el.classList && el.classList.contains("head")) ? el.id : objects.find(obj => obj.id == el.id).headId

        var attr = [
            // Sub
            {
                text: "New Sub",
                onclick: () => newObj("Sub", null, e, head)
            },
            // Change Head (if the clicked element is a sub)
            {
                text: "Change Head",
                onclick: () => changeHead(el.id)
            },
            // Delete
            {
                text: "Delete",
                onclick: () => deleteObj(el.id),
                key: "Del"
            }
        ]

        // If the clicked element (or it's parent) is a head, remove the "Change Head"
        if (tList.includes("head") || pList.includes("head")) {
            attr.splice(1, 1)
        }

    }
    else if (tList.concat(pList).includes("era")) {
        // Get the parent/child that is the era
        var el = (tList.includes("era")) ? e.target : e.target.parentElement

        var attr = [
            // Wiki
            {
                text: "Era Wiki",
                onclick: () => window.location.href = "../wiki/wiki.html?id=" + window["id"] + "&page=" + el.id
            },
            // Delete
            {
                text: "Delete",
                onclick: () => deleteObj(el.id)
            }
        ]
    }

    // If it or it's parent is a head, add the "Wiki" option at the top
    if (tList.concat(pList).includes("head")) {
        attr.unshift({
            text: "Event Wiki",
            onclick: () => window.location.href = "../wiki/wiki.html?id=" + window["id"] + "&page=" + el.id
        })
    }

    return attr
}

window.addEventListener("scroll", function() {
    // Get the current scroll position
    var x = window.scrollX
    var y = window.scrollY

    // Update the url without reloading the page
    window.history.replaceState(null, null, "?id=" + window["id"] + "&x=" + x + "&y=" + y)

    if (window["newArrow"] && e.target.classList.contains("addLink")) {
        document.querySelectorAll(".addLink").forEach((button) => {
            button.remove()
        })
    }
})

document.onmousemove = function (event) {
    // If the user is holding the alt key while moving the mouse, scroll the page
    // e.g. if the mouse is right at the bottom-right corner of the screen, the page will scroll all the way to the bottom-right
    if (event.altKey) {
        var x = event.clientX - (window.innerWidth * 0.05)
        var y = event.clientY - (window.innerHeight * 0.05)

        // Get the whole page size (not just the visible part)
        var xMax = document.documentElement.offsetWidth - document.documentElement.clientWidth
        var yMax = document.documentElement.offsetHeight - document.documentElement.clientHeight

        // Get only the visible part of the page (where the mouse can be), with some leeway
        var xView = window.innerWidth * 0.9
        var yView = window.innerHeight * 0.9

        // Calculate the scroll amount
        var xScroll = (x / xView) * xMax 
        var yScroll = (y / yView) * yMax

        // Scroll the page
        window.scrollTo(xScroll, yScroll)

        console.log(`x: ${x}, y: ${y}\nxMax: ${xMax}, yMax: ${yMax}\nxView: ${xView}, yView: ${yView}\nxScroll: ${xScroll}, yScroll: ${yScroll}`)

        // Scroll the page
        // window.scrollTo(xScroll, yScroll)
    }
}

function linkPoints(button, obj, points) {    
    // If the line has only two points, the midpoint is the average of the two points
    if (points.length == 2) {
        var midX = (parseInt(points[0][0]) + parseInt(points[1][0])) / 2
        var midY = (parseInt(points[0][1]) + parseInt(points[1][1])) / 2
        
        var mid = [midX, midY]
    }
    // If not then the line must have three points, so the midpoint is the middle point
    else {
        var midX = parseInt(points[1][0])
        var midY = parseInt(points[1][1])

        var mid = [midX, midY]
    }
    
    // Position the button at the midpoint
    button.style.left = mid[0] + "px"
    button.style.top = mid[1] + "px"

    // Return the midpoint
    return mid
}

function getNew() {
    var id = 0
    while (objects.some(obj => obj.id == id)) {
        id++
    }

    return id
}

function deleteObj(toDel) {
    var toRemove = objects.filter(e => e.class == "Link" && (e.childId == toDel || e.parentId == toDel) || e.id == toDel)
    toRemove.forEach(obj => {
        document.getElementById(obj.id).remove()
        objects.splice(objects.indexOf(obj), 1)
        
        if (obj.class == "Link") document.getElementById("editLink" + obj.id).remove()
    })
    save()
}

function changeHead(id) {
    // Set the changeHead variable to the ID of the sub
    window["subId"] = id

    // Run different code depending on the object types
    objects.forEach(obj => {
        // Change all to unclickable
        var el = document.getElementById(obj.id)

        // Set greyscale and brightness to 0.5 unless a head
        if (obj.class != "Head") {
            el.style.filter = "grayscale(0.5) brightness(0.5)"
            el.style.pointerEvents = "none"

            // If a link then apply the same filter to it
            if (obj.class == "Link") document.getElementById("editLink" + obj.id).style.filter = "grayscale(0.5) brightness(0.5)"
        }
    })
}

function helpMenu() {
    return {
        "Era Dividers": {
            desc: [
                "Eras are used to segment the timeline into different periods of time.",
            ],
            pages: [
                {
                    "Creating an Era": [
                        "To create an era, right click on the background and select \"New Era\"."
                    ],
                    "Editing an Era": [
                        "You can double click the title of an era to edit it."
                    ]
                }
            ]
        },
        "Head Nodes": {
            desc: [
                "Head nodes represent objects, people, groups, locations, or events.",
                "They are used to link sub nodes related to them."
            ],
            pages: [
                {
                    "Creating a Head Node": [
                        "To create a head node, right click on the background and select \"New Head\"."
                    ],
                    "Editing a Head Node": [
                        "You can double click the title or description of a head node to edit it."
                    ],
                    "Changing a Head Node's Color": [
                        "You can click the color picker to change the color of the head node.",
                        "This will also change the color of it's sub nodes and links."
                    ]
                }
            ]
        },
        "Sub Nodes": {
            desc: [
                "Sub nodes are used to represent individual events and actions that occur within, between, or are related to head nodes."
            ],
            pages: [
                {
                    "Creating a Sub Node": [
                        "To create a sub node, right click on a head node or another sub node and select \"New Sub\".",
                        "The sub node will then be created as a child of the head node or the head of the sub node you right clicked on."
                    ],
                    "Editing a Sub Node": [
                        "You can double click the title or description of a sub node to edit it."
                    ]
                },
                {
                    "Changing a Sub Node's Head": [
                        "Right click on a sub node and select \"Change Head\".",
                        "Then click on the head node you want to change it to."
                    ]
                }
            ]
        },
        "Selecting Nodes": {
            pages: [
                {
                    "Selecting a single node": [
                        "To select a single node, simply double click on it.",
                        "Click outside of the node to deselect it."
                    ],
                    "Selecting multiple nodes": [
                        "Press \"Ctrl\" and click on a node to toggle it's selection.",
                        "You can use this to select multiple nodes, or to deselect a node."
                    ]
                },
                {
                    "Directional Selection": [
                        "When a singular node is selected, you can use \"Shift\" and an arrow key to select all nodes in that direction."
                    ]
                }
            ]
        },
        "Links": {
            desc: [
                "Links can be used to show relationships between head and sub nodes.",
                "A link can be one of three types: \"Factor\", \"Cause\", or \"Extension\".",
                "",
                "Factor: Shows that one node was partially responsible for causing the other node.",
                "Cause: Shows that one node was directly responsible for causing the other node.",
                "Extension: Shows that two nodes were caused concurrently."
            ],
            pages: [
                {
                    "Creating a Link": [
                        "To create a link, select a singular node (by either double clicking or using \"Ctrl\" and clicking on it).",
                        "Four plus buttons will appear around the node, one for each direction links can stem from.",
                        "",
                        "Once you click one of the buttons, hover over the node you want to link it to.",
                        "Four similar buttons will appear around it.",
                        "Select one of these buttons to finish the link, or click the background to cancel the link."
                    ],
                    "Changing a Link's Type During Creation": [
                        "After clicking one of the plus buttons, you can press \"E\", \"F\", or \"C\" to change the type of link.",
                        "(\"E\" for \"Extension\", \"F\" for \"Factor\", and \"C\" for \"Cause\")",
                        "",
                        "You can only use this method during link creation.",
                        "However, you can change the type of a link after it has been created in the context menu."
                    ]
                },
                {
                    "Accessing a Link's Context Menu": [
                        "Hover over the circle at the mid-point of a link's line to access it's context menu.",
                        "Here you can do the following:"
                    ],
                    "Changing a Link's Type": [
                        "Click \"Make Factor\", \"Make Cause\", or \"Make Extension\" to change the type of the link.",
                        "Factor links are grey, showing an arrow from the first node to the second node.",
                        "Cause links are the same color as the first node, showing an arrow from the first node to the second node.",
                        "Extension links are the same color as the first node, showing a line between the two nodes.",
                    ],
                    "Flipping a Link's Direction": [
                        "Click \"Flip Direction\" to flip the direction of the link.",
                        "This will swap each end of the link, changing color if necessary."
                    ],
                    "Deleting a Link": [
                        "Click \"Delete\" to delete the link."
                    ]
                }
            ]
        },
        "Selection Actions": {
            desc: [
                "Here are some actions you can perform on selected nodes."
            ],
            pages: [
                {
                    "Moving Selected Nodes": [
                        "Use the arrow keys to move the selected nodes."
                    ],
                    "Deleting Selected Nodes": [
                        "Press the \"Delete\" key to delete the selected nodes.",
                        "This will delete all links connected to the nodes as well.",
                        "If any head nodes are deleted, their sub nodes will not be deleted, but will become 'orphaned'."
                    ]
                }
            ]
        }
    };
}