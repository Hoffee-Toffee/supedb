function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
        // Redirect to the login page with redirect params
        location.href = "../login/login.html?redirect=" + redir()
  }

  window["permissions"] = []

  // Check if the user has any associated permissions
  db.collection("permissions").where("user", "==", auth.currentUser.email).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        window["permissions"].push(doc.data())
    })

    // If empty, redirect to the dashboard
    if (window["permissions"].length == 0) {
        location.href = "../dash/dash.html"
    }
  })

  // Get the project ID from the URL
  var url = new URL(window.location.href)
  window["id"] = url.searchParams.get("id")

  // If null, redirect to the dashboard
  if (window["id"] == null) {
      location.href = "../dash/dash.html"
  }

  // Get the project info
  db.collection("projects").doc(window["id"]).get().then((doc) => {
    window["projectSettings"] = {
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description
    }
  })

  // Check if the user has access to the project
  db.collection("permissions").where("user", "==", auth.currentUser.email).where("type", "==", "P").where("entity", "==", window["id"]).get().then((querySnapshot) => {
    if (querySnapshot.empty) {
      // Redirect to the dashboard
      location.href = "../dash/dash.html"
    }

    // Get all the timelines under this project ID
    db.collection("timelines").where("project", "==", window["id"]).get().then((querySnapshot) => {
      // Get the body of the versions table
      var table = document.getElementById("versionsTable").getElementsByTagName("tbody")[0]

      // Set offshoots to the number of timelines
      window["offshoots"] = querySnapshot.size - 1

      // Loop through each timeline
      querySnapshot.forEach((doc) => {

        let types = {
          "M": "Main",
          "D": "Draft",
          "S": "Suggestion",
          "P": "Proposal",
          "A": "Archived"
        }

        // Create a table row for the timeline
        var row = document.createElement("tr")

        // Give the row four cells for the ID, title, options, and type
        var id = document.createElement("td")
        id.innerHTML = doc.id
        row.appendChild(id)

        var title = document.createElement("td")
        title.innerHTML = doc.data().title
        row.appendChild(title)

        var options = document.createElement("td")
        var wiki = document.createElement("button")
        wiki.innerHTML = "Wiki"
        wiki.addEventListener("click", () => window.location.href = "../wiki/wiki.html?id=" + doc.id)
        options.appendChild(wiki)

        var del = document.createElement("button")
        del.innerHTML = "Delete"
        del.addEventListener("click", () => alert("Will delete timeline " + doc.id))
        if (doc.data().type == "M") del.disabled = true
        options.appendChild(del)
        row.appendChild(options)

        var type = document.createElement("td")
        type.innerHTML = types[doc.data().type]
        row.appendChild(type)

        // If it's the main timeline, and the table already has a row, add this to the top
        if (doc.data().type == "M" && table.childNodes.length > 1) {
          table.insertBefore(row, table.rows[1])
        } else {
          // Otherwise, add it to the bottom
          table.appendChild(row)
        }
      });

      // Add a event listeners for each table row
      document.querySelectorAll("#versionsTable tr").forEach((row, index) => {
        // Ignore the first row
        if (index == 0) return;

        // Mouseover
        row.addEventListener("mouseover", () => {
          // Set the index
          window["index"] = index - 1; 
        });

        // Mouseout
        row.addEventListener("mouseout", () => {
          // Set the index
          window["index"] = -1;
        });

        // Click
        row.addEventListener("click", (e) => {
          // Trigger that index unless they clicked a button
          if (e.target.tagName != "BUTTON") trigger(index - 1);
        });

        // Show the table
        document.getElementById("list").style.opacity = 1;
      });
    });
  });

  // Run the genLine function every 50 milliseconds
  setInterval(genLine, 50);

  let body = document.querySelector("body");

  // Make clickable points on the line
  // Clicking a line will alert the user of the line's index
  // 0 is the main line, and the off-shoots are from 1 onwards

  // Add a new event listener for the mouse down event
  body.addEventListener("mousedown", (event) => check(event, false));

  // Add a new event listener for the mouse move event
  body.addEventListener("mousemove", (event) => {
    check(event, true);

    // Clear the interval (if it exists)
    if (window["interval"]) clearInterval(window["interval"]);

    // Run the check function every 50 milliseconds
    window["interval"] = setInterval(() => {
      check(event, true)
    }, 50);
  })
}

// Generate the line
function genLine() {
  // This will generate a moving line on the screen
  // It will be horizontal, going from the left to the right with slight curves
  // These curves will be generated randomly, and will be what moves, not the line itself
  // The line will be generated using the canvas element

  // Get the canvas element
  let canvas = document.getElementById("canvas");

  // Set the canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Get the canvas context
  let ctx = canvas.getContext("2d");

  // Set basic line styles
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.shadowBlur = 10;

  // Start the line
  ctx.beginPath();

  // Create the arrays for the coordinates
  let coords = [];
  let offCoords = [];

  // To allow change over time, we need to use the current time as a base
  let time = Date.now();
  
  // Draw the curves
  for (let i = 0; i < 105; i++) {
    // Get the x value
    let x = (window.innerWidth / 100) * i;

    // Get three sets of y values (from 3 sine waves)
    // Time will change the height of the waves, not the position

    let y1 = Math.sin(time / 3000 + i / 13) * 15 + window.innerHeight / 4;
    let y2 = Math.sin(time / 3000 + i / 7 + 2) * 3 + window.innerHeight / 4;
    let y3 = Math.sin(time / 3000 + i / 5 + 3) * 7 + window.innerHeight / 4;

    // Get the average of the three y values
    let y = (y1 + y2 + y3) / 3;

    // Add the coordinates to the array
    coords.push({ x: x, y: y });

    if (i == 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  // Draw the off-shoots
  // Will be a random number of off-shoots, each with a random number of points
  for (let i = 0; i < window["offshoots"]; i++) {
    // Get the index of the coordinate to start from
    let coord = coords[(i * Math.round(coords.length / window["offshoots"]) + 30) % (coords.length - 15)];

    // Get the x and y values
    let x = coord.x;
    let y = coord.y;

    // Make a new line with a red/orange color
    ctx.beginPath();

    // Make red if hovered and orange if not
    if (window["index"] == i + 1) {
      ctx.strokeStyle = "#ff2f3f";
      ctx.shadowColor = "#ff2f3faa";

    } else {
      ctx.strokeStyle = "#ff7f3f";
      ctx.shadowColor = "#ff7f3faa";
    }

    // Make an array for the off-shoot coordinates
    var offshootCoords = [];

    // Make points for the off-shoot
    for (let j = 0; j < 15; j++) {
      // Get the x value
      let x2 = x + j * (x % 10 + 2) + Math.sin(time / 2000 + i / 2) * 5;

      // Set the stretch and span of the line
      let stretch = 1.5;

      let span1 = Math.sin(time / (20000 + i) % Math.PI) + 1;
      let span2 = Math.sin(time / (30000 + (i * 2)) % Math.PI) + 1;
      let span3 = Math.sin(time / (10000 + (i * 3)) % Math.PI) + 1;
      let span = (span1 + span2 + span3) / 6;

      if (i % 2 == 0) {
        y2 = y - Math.pow(j, stretch) * span;
      } else {
        y2 = y + Math.pow(j, stretch) * span;
      }

      // Draw the line
      ctx.lineTo(x2, y2);

      // Add the coordinates to the array
      offshootCoords.push({ x: x2, y: y2 });
    }

    // Finish the line
    ctx.stroke();

    // Add the off-shoot coordinates to the array
    offCoords.push(offshootCoords);
  }

  // Draw a blue line going through all of the points in the array
  ctx.beginPath();

  // Set the color to blue if hovered and white if not
  if (window["index"] == 0) {
    ctx.strokeStyle = "#6fffff";
    ctx.shadowColor = "#6fffffaa";
  } else {
    ctx.strokeStyle = "#dfffff";
    ctx.shadowColor = "#dfffffaa";
  }

  // Loop through the array
  coords.forEach((coord, i) => {
    if (i == 0) {
      ctx.moveTo(coord.x, coord.y);
    } else {
      ctx.lineTo(coord.x, coord.y);
    }
  });

  // Finish the line
  ctx.stroke();

  // Save the coordinates
  window["coords"] = coords;
  window["offCoords"] = offCoords;
}

function check(event, e = true) {
  // Clear the interval if the mouse isn't over the canvas
  if (event.target.id != "canvas") {
    clearInterval(window["interval"]);
    return;
  }

  let x = event.clientX;
  let y = event.clientY;

  let index = null;

  // Get window vars
  let coords = window["coords"];
  let offCoords = window["offCoords"];

  // Get the range of the click so that it doesn't have to be exact
  // The range will be deduced by the screen size
  let xRange = window.innerWidth / 100;
  let yRange = window.innerHeight / 100;

  let xMin = x - xRange;
  let xMax = x + xRange;
  let yMin = y - yRange;
  let yMax = y + yRange;

  // Get the shortest distance between the click and a point on the main line
  let main = coords.reduce((shortest, coord) => {
    // Return the shortest distance if the click is outside of the range
    if (coord.x < xMin || coord.x > xMax || coord.y < yMin || coord.y > yMax) return shortest;

    // If not then get the distance
    let dist = Math.sqrt(Math.pow(coord.x - x, 2) + Math.pow(coord.y - y, 2));
    
    if (dist < shortest) return dist;
    else return shortest;
  }, Infinity);

  // Get the each off-shoot's shortest distance to the click
  let off = offCoords.map((offshoot) => {
    return offshoot.reduce((shortest, coord) => {
      // Return the shortest distance if the click is outside of the range
      if (coord.x < xMin || coord.x > xMax || coord.y < yMin || coord.y > yMax) return shortest;

      // If not then get the distance
      let dist = Math.sqrt(Math.pow(coord.x - x, 2) + Math.pow(coord.y - y, 2));
      
      if (dist < shortest) return dist;
      else return shortest;
    }, Infinity);
  });

  // Join the results together
  let dists = [main, ...off];

  // Get the index of the shortest distance
  let min = Math.min(...dists);
  let minIndex = dists.indexOf(min);

  // If the shortest distance is Infinity, then set the index to null
  if (min == Infinity) minIndex = null;

  // Set the index
  index = minIndex;

  // Set the window variable to the index
  window["index"] = index;

  // If the index is null, then the user hasn't clicked or hovered on a line
  if (index == null) {
    // Reset the cursor
    event.target.style.cursor = "auto";
  }
  // If the user has clicked, then trigger that index
  else if (!e) trigger(index);
  // If the user has hovered, then change the cursor
  else {
    event.target.style.cursor = "pointer";
  }

  // Change the style of the ith row in the table
  let table = document.getElementById("versionsTable");

  // Reset the style of all of the rows (except for the index row)
  table.querySelectorAll("tr").forEach((row, i) => {
    if ((i - 1) != index) {
      row.style = "";
    }
    else {
      row.style.backgroundColor = "#ff884433";
      // Scroll the list so this row is in the middle
      row.scrollIntoView({ block: "center" });
    }
  });
}

function trigger(id) {
  // Get the table
  let table = document.getElementById("versionsTable");

  // Get the idth row
  let row = table.querySelectorAll("tr")[id + 1];

  // Get the value of the first cell in the row
  let value = row.querySelectorAll("td")[0].innerHTML;

  // Redirect to the timeline page
  window.location = `../map/map.html?id=${value}`;
}

function settingsMenu() {
  if (window["onMainMenu"]) {
    document.getElementById("popup").style = "";
    window["onMainMenu"] = false;
    return;
  }

  window["onMainMenu"] = true
  if (typeof window["projectSettings"] === 'undefined') {
      window["projectSettings"] = {
          id: null,
          title: "Map Title",
          description: "Map Description"
      }
  }

  document.getElementById("newTitle").value = window["projectSettings"].title
  document.getElementById("newDesc").value = window["projectSettings"].description

  // Remove all rows but the first and last, then populate permissions table
  Array.from(document.getElementById("newPerm").children[0].children).slice(1, -1).forEach((row) => {
      row.remove()
  })

  db.collection("permissions").where("type", "==", "P").where("entity", "==", window["projectSettings"].id).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
          let data = doc.data()
          let row = document.createElement("tr")
          let name = document.createElement("td")
          let role = document.createElement("td")
          let options = document.createElement("td")

          // Get the user's details (from firebase auth)
          console.log(data)
          db.collection("users").where("email", "==", data.user).get().then((querySnapshot) => {
              let userData = querySnapshot.docs[0].data()
              name.innerHTML = `<a href="#link" title="${userData.email}">${userData.name}</a>`
          })

          role.innerHTML = `<select name="level" id="level">
              <option ${data.level == "1" ? "selected" : ""} value="1" title="Read only">Minuteman</option>
              <option ${data.level == "2" ? "selected" : ""} value="2" title="Read and comment">Hunter</option>
              <option ${data.level == "3" ? "selected" : ""} value="3" title="Read, comment, contribute to drafts">Consultant</option>2
              <option ${data.level == "4" ? "selected" : ""} value="4" title="Read, comment, contribute to drafts, vote on drafts">Analyst</option>
              <option ${data.level == "5" ? "selected" : ""} value="5" title="Read, comment, contribute to drafts, vote on drafts, edit documents">Agent</option>
              <option ${data.level == "6" ? "selected" : ""} value="6" title="Read, comment, contribute to drafts, vote on drafts, edit documents, change permissions, project settings, and more">Judge</option>
          </select>`
          options.innerHTML = `<button class="remove">Remove</button>`
          row.setAttribute("user", data.user)

          row.appendChild(name)
          row.appendChild(role)
          row.appendChild(options)

          // add row before the last in the table body
          document.getElementById("newPerm").lastElementChild.insertBefore(row, document.getElementById("newPerm").lastElementChild.lastElementChild)
      })
  })


  document.getElementById("popup").style = "visibility: visible"

  Array.from(document.getElementById("popup").children).forEach(element => {
      if (!element.classList.length || element.classList.contains("editMenu")) {
          element.style.display = "block"
      }
      else {
          element.style.display = "none"
      }
  })

  // Code for save button

  document.getElementById("save").onclick = function () {
      window["projectSettings"].title = document.getElementById("newTitle").value
      window["projectSettings"].description = document.getElementById("newDesc").value

      // Save map settings
      save()

      // Save permissions
      Array.from(document.getElementById("newPerm").children).forEach(row => {
          // Skip if the row is not a user
          if (!row.hasAttribute("user")) return
          
          // Update the user's permissions (if changed)
          let user = row.getAttribute("user")
          let role = row.children[1].children[0].value

          db.collection("permissions").where("type", "==", "P").where("entity", "==", window["projectSettings"].id).where("user", "==", user).get().then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  let data = doc.data()
                  if (data.role != role) {
                      db.collection("permissions").doc(doc.id).update({
                          role: role
                      })
                  }
              })
          })
      })

      document.getElementById("popup").style = "visibility: hidden"
      window["onMainMenu"] = false
  }
}