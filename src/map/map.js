window["ready"] = false
window["editing"] = false
window["newArrow"] = false
window["permissions"] = []

var objects = []

window["decrypt"] = false

function display() {
    if (objects.includes(null)){
        // filter all the nulls and loop through them
        var nulls = objects.filter(e => e == null)
        nulls.forEach(obj => {
            var pos = objects.indexOf(obj)

            objects.forEach(e => {
                if (e !== null) {
                    e.id -= (e.id > pos) ? 1 : 0

                    if (e.class == "sub") {
                        e.headId -= (e.headId > pos) ? 1 : 0
                        e.headId = (e.headId == pos) ? null : e.headId
                    }

                    if (e.class == "link") {
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
    objects.forEach(obj => {
        try {
            getElementById(obj.id).remove()
        }
        catch (e) {}
        newObj(obj.class, obj)
    })

    document.getElementById("addmenu").style.zIndex = 3
}

function newObj(type, obj = null) {
    switch (type) {
        case "Head":
            if (obj == null) {
                var obj = {
                    "id": objects.length,
                    "class": "Head",
                    "title": "New Head Block",
                    "description": "A storyline, event or person.",
                    "color": "FFFFFF",
                    "position": [
                        5,
                        5
                    ]
                }
                objects.push(obj)
            }

            var tag = document.createElement("div")
            tag.id = obj.id
            tag.classList.add("head")
            tag.classList.add("object")
            tag.addEventListener("dblclick", function() { moveObj(tag) })
            
            tag.style.borderColor = "#" + obj.color
            tag.style.boxShadow = "0 0 0.5em 0.01em black, 0 0 0.5em 0.01em #" + obj.color
            tag.style.marginLeft = (obj.position[0] + "em")
            tag.style.marginTop = (obj.position[1] + "em")

            var text = document.createElement("input")
            text.type = "text"
            text.setAttribute("oninput", "this.size = this.value.length")
            text.value = obj.title
            text.size = text.value.length
            text.readOnly = true
            text.classList.add("title")
            text.addEventListener("input", function() {
                updateObj(this, "title")
            })
            tag.appendChild(text)

            var menu = document.createElement("div")
            menu.classList.add("nodeMenu")
            menu.style.outlineColor = "#" + obj.color
            menu.style.boxShadow = "0 0 0.5em 0.01em black, 0 0 0.5em 0.01em #" + obj.color

            var menuList = document.createElement("ul")
            menu.appendChild(menuList)

            var linkButton = document.createElement("li")
            linkButton.innerHTML = "🖇️"
            linkButton.addEventListener("click", function() { editLinks(tag) })
            linkButton.addEventListener("mouseover", function() {
                var toFade = objects.filter(e => e.id !== obj.id && ( e.class !== "Link" || (e.parentId !== obj.id && e.childId !== obj.id) ) )
                toFade.forEach(obj => {
                        document.getElementById(obj.id).style.transition = "opacity 0.5s"
                        document.getElementById(obj.id).style.opacity = 0.25
                })
            })
            linkButton.addEventListener("mouseout", function() {
                objects.forEach(obj => {
                    document.getElementById(obj.id).style.opacity = 1
                })
            })
            linkButton.classList.add("linkButton")
            menuList.appendChild(linkButton)

            var deleteButton = document.createElement("li")
            deleteButton.innerHTML = "🗑️"
            deleteButton.addEventListener("click", function() {
                var toRemove = objects.filter(e => e.class == "Link" && (e.childId == tag.id || e.parentId == tag.id) || e.id == tag.id)
                toRemove.forEach(obj => {
                    document.getElementById(obj.id).remove()
                    objects[obj.id] = null
                })

                // Remove all links to the now deleted nodes
                var toAdjust = objects.filter(e => e.headId == tag.id)
                toAdjust.forEach(obj => {
                    obj.headId = null
                })
                save()
            })

            deleteButton.addEventListener("mouseover", function() {
                var toFade = objects.filter(e => e.class == "Link" && (e.childId == tag.id || e.parentId == tag.id) || e.id == tag.id)
                toFade.forEach(obj => {
                    document.getElementById(obj.id).style.transition = "0.5s"
                    document.getElementById(obj.id).style.opacity = 0.25
                })
            })
            deleteButton.addEventListener("mouseout", function() {
                objects.forEach(obj => {
                    document.getElementById(obj.id).style.opacity = 1
                })
            })
            menuList.appendChild(deleteButton)

            tag.appendChild(menu)

            var color = document.createElement("input")
            color.type = "color"
            color.classList.add("colorPicker")
            color.setAttribute("value", "#" + obj.color)
            color.addEventListener("change", function() { updateColor(color) })
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
            tooltip.addEventListener("input", function() {
                updateObj(this, "description")
            })
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
                    "id": objects.length,
                    "class": "Sub",
                    "title": "New Sub Block",
                    "description": "A specific event",
                    "headId": 1,
                    "position": [
                        5,
                        5
                    ]
                }
                objects.push(obj)
            }

            var tag = document.createElement("div")
            tag.id = obj.id
            tag.classList.add("sub")
            tag.classList.add("object")
            tag.addEventListener("dblclick", function() { moveObj(tag) })
            tag.style.borderColor = "#" + objects[obj.headId].color
            tag.style.boxShadow = "0 0 0.5em 0.01em black, 0 0 0.5em 0.01em #" + objects[obj.headId].color
            tag.style.marginLeft = (obj.position[0] + "em")
            tag.style.marginTop = (obj.position[1] + "em")

            var text = document.createElement("input")
            text.type = "text"
            text.setAttribute("oninput", "this.size = this.value.length")
            text.addEventListener("input", function() {
                updateObj(this, "title")
            })

            text.value = obj.title
            text.size = text.value.length
            text.readOnly = true
            text.classList.add("title")
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
            tooltip.addEventListener("input", function() {
                updateObj(this, "description")
            })
            tag.appendChild(tooltip)

            var menu = document.createElement("div")
            menu.classList.add("nodeMenu")
            menu.style.outlineColor =  "#" + objects[obj.headId].color
            menu.style.boxShadow = "0 0 0.5em 0.01em black, 0 0 0.5em 0.01em #" + objects[obj.headId].color

            var menuList = document.createElement("ul")
            menu.appendChild(menuList)

            var linkButton = document.createElement("li")
            linkButton.innerHTML = "🖇️"
            linkButton.addEventListener("click", function() { editLinks(tag) })
            linkButton.addEventListener("mouseover", function() {
                var toFade = objects.filter(e => e.id !== obj.id && ( e.class !== "Link" || (e.parentId !== obj.id && e.childId !== obj.id) ) )
                toFade.forEach(obj => {
                    document.getElementById(obj.id).style.transition = "opacity 0.5s"
                    document.getElementById(obj.id).style.opacity = 0.25
                })
            })
            linkButton.addEventListener("mouseout", function() {
                objects.forEach(obj => {
                    document.getElementById(obj.id).style.opacity = 1
                })
            })
            linkButton.classList.add("linkButton")
            menuList.appendChild(linkButton)

            var changeParentButton = document.createElement("li")
            changeParentButton.innerHTML = "🔗"
            changeParentButton.addEventListener("mouseover", function() {
                // fades everything but this node's head and the link to the head
                var toFade = objects.filter(e => e.id !== obj.headId && !(e.parentId == obj.headId && e.childId == obj.id) )
                toFade.forEach(obj => {
                    document.getElementById(obj.id).style.transition = "opacity 0.5s"
                    document.getElementById(obj.id).style.opacity = 0.25
                })
            })
            changeParentButton.addEventListener("mouseout", function() {
                objects.forEach(obj => {
                    document.getElementById(obj.id).style.opacity = 1
                })
            })
            changeParentButton.classList.add("changeParentButton")
            menuList.appendChild(changeParentButton)

            var deleteButton = document.createElement("li")
            deleteButton.innerHTML = "🗑️"
            deleteButton.addEventListener("click", function() {
                var toRemove = objects.filter(e => e.class == "Link" && (e.childId == tag.id || e.parentId == tag.id) || e.id == tag.id)
                toRemove.forEach(obj => {
                    document.getElementById(obj.id).remove()
                    objects[obj.id] = null
                })
                save()
            })

            deleteButton.addEventListener("mouseover", function() {
                var toFade = objects.filter(e => e.class == "Link" && (e.childId == tag.id || e.parentId == tag.id) || e.id == tag.id)
                toFade.forEach(obj => {
                    document.getElementById(obj.id).style.transition = "0.5s"
                    document.getElementById(obj.id).style.opacity = 0.25
                })
            })
            deleteButton.addEventListener("mouseout", function() {
                objects.forEach(obj => {
                    document.getElementById(obj.id).style.opacity = 1
                })
            })
            menuList.appendChild(deleteButton)


            tag.appendChild(menu)
            
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
                    "id": objects.length,
                    "class": "Era",
                    "title": "New Era",
                    "description": "Description of this era",
                    "position": 0
                }
                objects.push(obj)
            }

            var tag = document.createElement("div")
            tag.setAttribute( "id", obj.id )
            var desc = (obj.title != null) ? obj.title : ""
            var tooltip = document.createElement("div")
            tooltip.classList.add("tooltip")
            tooltip.innerText = desc
            tag.appendChild(tooltip)

            tag.classList.add("era")
            tag.classList.add("object")
            tag.addEventListener("dblclick", function() { moveObj(tag) })

            tag.style.left = (obj.position + 0.5) + "em"

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

            tag.addEventListener("dblclick", function() { moveObj(tag) })

            var points = []

            obj.line.forEach(el => {
                var xreq = document.getElementById(objects[el[0]].id)
                var yreq = document.getElementById(objects[el[2]].id)

                var x = xreq.offsetLeft + (xreq.offsetWidth * (el[1] - 0.5) )
                var y = yreq.offsetTop + (yreq.offsetHeight * el[3])
                
                points.push([x, y])
            })

            if (obj.childId == "mouse") {
                
                points.push([window.event.pageX , window.event.pageY])

                document.addEventListener("mousemove", function() {
                    var el = document.getElementById(objects.find(e => e.childId == "mouse").id).children[1]
                    el.setAttribute("points", [el.getAttribute("points").split(",").slice(0, 2), [window.event.pageX , window.event.pageY]])
                })
            }

            poly.setAttribute("points", points)

            if (obj.type != "f"){
                if (objects[obj.parentId].class == "Head") {
                    poly.style.stroke = "#" + objects[obj.parentId].color
                }
                else {
                    poly.style.stroke = "#" + objects[objects[obj.parentId].headId].color
                }
            }
            
            if (obj.type == "f") {
                poly.setAttribute("marker-end", "url(#arrow)")
                poly.style.stroke = "grey"
            }
            else if (obj.type == "c") {
                if (objects[obj.parentId].class == "Head") {
                    poly.setAttribute("marker-end", "url(#" + objects[obj.parentId].color + "-arrow)")
                }
                else {
                    poly.setAttribute("marker-end", "url(#" + objects[objects[obj.parentId].headId].color + "-arrow)")
                }
            }

            tag.appendChild(poly)
            var element = document.getElementsByTagName("BODY")[0]
            element.appendChild(tag)

            break
    }

    tag.addEventListener("mouseover", function() {
        if (window["newArrow"] && document.querySelectorAll(".addLink").length == 0 ) {
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
                link.addEventListener("mouseout", function () {
                    if ( window["newArrow"] && document.elementFromPoint(window.event.pageX, window.event.pageY).classList.contains("object") ) {
                        document.querySelectorAll(".addLink").forEach((button) => {
                            button.remove()
                        })
                    }
                })
            })
        }
    })

    tag.addEventListener("mouseout", function () {
        if ( window["newArrow"] && !document.elementFromPoint(window.event.pageX, window.event.pageY).classList.contains("addLink") ) {
            document.querySelectorAll(".addLink").forEach((button) => {
                button.remove()
            })
        }
    })
}

function updateObj(el, attr) {
    objects[el.parentElement.id][attr] = el.value
    save()
}

function updateColor(color) {
    var head = color.parentElement.id

    objects[head].color = color.value.slice(1)

    var toUpdate = objects.filter(e => e.parentId == parseInt(head) || e.headId == parseInt(head) || (e.parentId && objects[e.parentId].headId == parseInt(head) ) )
    toUpdate.push(objects[head])

    toUpdate.forEach(obj => {
        document.getElementById(obj.id).remove()
        newObj(obj.class, obj)
    })
    save()
}

document.addEventListener("click", function (event) {
    if (event.target == null) {
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
        
        return
    }

    if ( event.target.classList.contains("addLink") && !window["newArrow"] ) {
        window["newArrow"] = true

        var coords = [0, 0.5]
        if ( event.target.id == "linkRight" ) coords = [1, 0.5]
        if ( event.target.id == "linkTop" ) coords = [0.5, 0]
        if ( event.target.id == "linkBottom" ) coords = [0.5, 1]

        var obj = {
            "id": objects.length,
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

        if ( ["linkLeft", "linkRight"].includes(event.target.id) && objects[obj.parentId].position[1] !== objects[obj.childId].position[1] ) {
            obj.line.push(
                [
                    obj.line[0][0],
                    obj.line[0][1],
                    parseInt(event.target.parentElement.id),
                    coords[1]
                ]
            )

        }
        else if ( ["linkTop", "linkBottom"].includes(event.target.id) && objects[obj.parentId].position[0] !== objects[obj.childId].position[0] ) {
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

    if ( event.target.getAttribute("id") == "addmenu" || event.target.parentElement.getAttribute("id") == "addmenu") {
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

            var elObj = objects[el.getAttribute("id")]

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
                var points = []

                element.line.forEach(line => {
                    var xreq = document.getElementById(objects[line[0]].id)
                    var yreq = document.getElementById(objects[line[2]].id)

                    var x = xreq.offsetLeft + (xreq.offsetWidth * (line[1] - 0.5) )
                    var y = yreq.offsetTop + (yreq.offsetHeight * line[3])
                    
                    points.push([x, y])
                })

                document.getElementById(element.id).children[1].setAttributeNS(null, "points", points)
            })
        })

        els[0].scrollIntoView({
            block: "nearest",
            inline: "center"
        })
    }
    else if (event.key == "Enter" && window["editing"]) {
        event.preventDefault()

        document.querySelectorAll(".editing").forEach(edit => {
            edit.classList.remove("editing")
            Array.from(edit.children).forEach(child => {
                child.readOnly = true
            })
        })
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
                    var xreq = document.getElementById(objects[line[0]].id)
                    var yreq = document.getElementById(objects[line[2]].id)
    
                    var x = xreq.offsetLeft + (xreq.offsetWidth * (line[1] - 0.5) )
                    var y = yreq.offsetTop + (yreq.offsetHeight * line[3])
                    
                    points.push([x, y])
                })
    
                document.getElementById(element.id).children[1].setAttributeNS(null, "points", points)
            })
          }, 10)
    }
    save()
}

function save() {
    var data = JSON.stringify(objects)

    if (window["mapSettings"].encrypted) {
        // Coming soon
        // data = encrypt(data, window["key"])
    }

    // Update firestore document
    db.collection("timelines").doc(window["mapSettings"].id).update({
        map: data
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

            if (window["id"] == null) {
                var options = {
                    method: 'POST',
                    url: 'https://timelines-3cbe.restdb.io/rest/timelines',
                    headers: {
                        'cache-control': 'no-cache',
                        'x-apikey': RestDB_API,
                        'content-type': 'application/json'
                    },
                    body: window["mapSettings"],
                    json: true
                }
    
                request(options, function (error, response, body) {
                    if (error) {
                        throw new Error(error)
                    }
                    else {
                        location.href = "./map.html?id=" + body._id
                    }
                })
            }
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
    // Check if the user isn't logged in
    if (!auth.currentUser) {
        // Redirect to the login page
        location.href = "/src/login/login.html"
    }

    // Check if the user has any associated permissions
    db.collection("permissions").where("user", "==", auth.currentUser.email).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            window["permissions"].push(doc.data())
        })
    })

    // If they don't have any permissions, redirect them to the dashboard
    if (window["permissions"] == null) {
        location.href = "/src/dash/dash.html"
    }

    // Get all 
    db.collection("timelines").get().then((querySnapshot) => {
        var url = new URL(window.location.href)
        window["id"] = url.searchParams.get("id")
    
        if (window["id"] == null) {
            mapMenu()
        }
    
        var maps = Array.from(querySnapshot.docs)
        var map = maps.filter(e => e.id == window["id"])[0]
    
        if (map) {
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
        }})
    
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