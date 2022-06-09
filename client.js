var xbias = 0

function display () {
    objects.forEach(obj => {
        switch (obj.constructor.name) {
            case "Head":
                var tag = document.createElement('div')
                var text = document.createTextNode( obj.title )

                tag.setAttribute( 'id', obj.title )
                tag.classList.add('head')
                tag.style.borderColor = ("#" + obj.color)
                tag.style.marginLeft = (obj.position[0] + "em")
                tag.style.marginTop = (obj.position[1] + "em")
                var desc = (obj.description != null) ? obj.description : "N/A"
                tag.setAttribute("tooltip", desc)

                tag.appendChild( text )

                var element = document.getElementsByTagName("BODY")[0]
                element.appendChild( tag )

                if (!document.getElementById(obj.color + "-arrow")) {
                    var tag = document.getElementById("arrow").cloneNode(true)

                    tag.setAttribute("id", obj.color + "-arrow")
    
                    tag.children[0].setAttribute("fill", "#" + obj.color)

                    var element = document.getElementsByTagName("defs")[0]
                    element.appendChild(tag)
                }
                break

            case "Sub":
                var tag = document.createElement('div')
                var text = document.createTextNode( obj.title )
                tag.setAttribute( 'id', obj.title )
                tag.classList.add('sub')
                var desc = (obj.description != null) ? obj.description : "N/A"
                tag.setAttribute("tooltip", desc)

                tag.style.borderColor = "#" + obj.head.color
                tag.style.marginLeft = (obj.position[0] + "em")
                tag.style.marginTop = (obj.position[1] + "em")
                tag.appendChild( text )
                var element = document.getElementsByTagName("BODY")[0]
                element.appendChild( tag )
                break

            case "Info":
                console.log("Info")
                break

            case "Era":
                var tag = document.createElement('div')
                tag.setAttribute( 'id', obj.title )
                var desc = (obj.description != null) ? obj.description : "N/A"
                tag.setAttribute("tooltip", desc)
                tag.classList.add('era')

                tag.style.left = (obj.position + 0.5) + "em"

                var element = document.getElementsByTagName("BODY")[0]
                element.appendChild( tag )
                break

            case "Link":
                var tag = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline")

                poly.style.fill = "none"
                poly.style.strokeWidth = "0.1em"
                var desc = (obj.description != null) ? obj.description : "N/A"
                tag.setAttribute("tooltip", desc)


                var points = []

                obj.line.forEach(el => {
                    var xreq = document.getElementById(el[0].title)
                    var yreq = document.getElementById(el[2].title)

                    var x = xreq.offsetLeft + (xreq.offsetWidth * (el[1] - 0.5) )
                    var y = yreq.offsetTop + (yreq.offsetHeight * el[3])
                    
                    points.push([x, y])
                })

                poly.setAttribute("points", points )

                if (obj.type != "f"){
                    if (obj.parent.constructor.name == "Head") {
                        poly.style.stroke = "#" + obj.parent.color
                    }
                    else {
                        poly.style.stroke = "#" + obj.parent.head.color
                    }
                }
                
                if (obj.type == "f") {
                    poly.setAttribute("marker-end", "url(#arrow)")
                    poly.style.stroke = "grey"
                }
                else if (obj.type == "c") {
                    if (obj.parent.constructor.name == "Head") {
                        poly.setAttribute("marker-end", "url(#" + obj.parent.color + "-arrow)")
                    }
                    else {
                        poly.setAttribute("marker-end", "url(#" + obj.parent.head.color + "-arrow)")
                    }
                }


                tag.appendChild(poly)
                var element = document.getElementsByTagName("BODY")[0]
                element.appendChild(tag)

                break
        }
    })
}

window["ready"] = false

window.onload = function() {
    if (window["ready"]) {
        display()
    }
    else {
        window["ready"] = true
    }
}

class Head {
    constructor(title, description = null, color = null, position = []) {
        this.class = "Head"
        this.title = title
        this.description = description
        this.color = color
        this.position = position
        this.position[0] += xbias
    }
}

class Sub {
    constructor(title, description = null, head, position = []) {
        this.class = "Sub"
        this.title = title
        this.description = description
        this.head = head
        this.position = position
        this.position[0] += xbias
    }
}

class Info {
    constructor(title, description = null, position = []) {
        this.class = "Info"
        this.title = title
        this.description = description
        this.position = position
        this.position[0] += xbias
    }
}

class Era {
    constructor(title, description = null, position = 0) {
        this.class = "Era"
        this.title = title
        this.description = description
        this.position = position + xbias
    }
}

class Link {
    constructor(description = null, parent, child, type = "c", line = []) {
        this.class = "Link"
        this.description = description
        this.line = []
        this.parent = parent
        this.child = child
        this.type = type /* Parent directly [c]auses Child,
                             Parent was a [f]actor in causing Child,
                             Child is an [e]xtension of Parent */

        line.forEach(el => {
            var x = (el[0] == "p") ? this.parent : this.child
            var y = (el[2] == "p") ? this.parent : this.child
            
            this.line.push([x, el[1], y, el[3]])
        })

    }
}

var objects = []

objects.push(
    new Era(
        "Ancient Era",
        `The universe was filled aliens, much like Start Trek.
        The Artifact changes all that and the universe is plunged into darkness.`,
        0
    )
)

let aw = new Head(
    "Alien Wars",
    "Ancient war between alien civilisations.",
    "E81313",
    [5, 5]
)
objects.push(aw)

let aw1 = new Sub(
    "Artifact Adrift",
    null,
    aw,
    [20, 0]
)
objects.push(aw1)

objects.push(
    new Link(
        "",
        aw,
        aw1,
        "c",
        [
            ["p", 0.5, "p", 0],
            ["p", 0.5, "c", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

let aw2 = new Sub(
    "Only Nayzarian Ruins Left",
    null,
    aw,
    [20, 5]
)
objects.push(aw2)

objects.push(
    new Link(
        "",
        aw,
        aw2,
        "c",
        [
            ["p", 1, "p", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

let aw3 = new Sub(
    "All Aliens Extinct",
    null,
    aw,
    [20, 10]
)
objects.push(aw3)

objects.push(
    new Link(
        "",
        aw,
        aw3,
        "c",
        [
            ["p", 0.5, "p", 1],
            ["p", 0.5, "c", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

xbias += 0

objects.push(
    new Era(
        "Main Era",
        "Future with humanity exploring the cosmos, things are fairly unstable and far from perfect.",
        30
    )
)

let ap = new Head(
    "Asper Pectal Born",
    `21st of March 2477, Probably on Fenrir Station
    Daughter of Daru Pectal`,
    "FFFFFF",
    [40, 20]
)
objects.push(ap)

let ap1 = new Sub(
    "Asper and Piol Become Friends",
    null,
    ap,
    [60, 20]
)
objects.push(ap1)

let ap2 = new Sub(
    "Asper and Piol Become a Couple",
    null,
    ap,
    [80, 20]
)
objects.push(ap2)

let ap3 = new Sub(
    "Asper and Piol Start at Vauban Station",
    null,
    ap,
    [100, 20]
)
objects.push(ap3)

let acsr = new Head(
    "Project ACSR",
    "A project for creating the perfect antibody",
    "FCCE14",
    [100, 10]
)
objects.push(acsr)

let acsr2 = new Sub(
    "Castus and Octavia Start Project ACSR",
    null,
    acsr,
    [120, 10]
)
objects.push(acsr2)

objects.push(
    new Link(
        null,
        acsr,
        acsr2,
        "e",
        [
            ["p", 1, "p", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

let acsr3 = new Sub(
    "Castus Becomes Obsessed",
    "Castus stresses himself out and takes it out on Octavia, he is always working on it and pushing Octavia to work an unhealthy amount also.",
    acsr,
    [140, 10]
)
objects.push(acsr3)

objects.push(
    new Link(
        null,
        acsr2,
        acsr3,
        "f",
        [
            ["p", 1, "p", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

let acsr4 = new Sub(
    "Octavia Leaves Castus and Project ACSR",
    "Octavia breaks up with Castus and leaves the project due to his obsession.",
    acsr,
    [160, 10]
)
objects.push(acsr4)

objects.push(
    new Link(
        null,
        acsr3,
        acsr4,
        "c",
        [
            ["p", 1, "p", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

let acsr5 = new Sub(
    "Castus Recruits New Members",
    "He looks for more members so he can be less stressed with the project, he also needs to fill Octavia's position.",
    acsr,
    [180, 10]
)
objects.push(acsr5)

objects.push(
    new Link(
        null,
        acsr4,
        acsr5,
        "c",
        [
            ["p", 1, "p", 0.5],
            ["c", 0, "c", 0.5]
        ]
    )
)

let ap4 = new Sub(
    "Asper and Piol Join Project ACSR",
    `Both were looking for a project to join.
    Piol was particularly interested due to his father's death.`,
    acsr,
    [180, 20]
)
objects.push(ap4)

objects.push(
    new Link(
        null,
        acsr5,
        ap4,
        "e",
        [
            ["p", 0.5, "p", 1],
            ["c", 0.5, "c", 0]
        ]
    )
)

// var objects = fs.readFileSync("./data.json", "utf8");

if (window["ready"]) {
    display()
}
else {
    window["ready"] = true
}

var comp = JSON.stringify(objects)
writeFile('./data.json', comp, function (err) {
    if (err) console.log(err);
  });

console.log(comp)