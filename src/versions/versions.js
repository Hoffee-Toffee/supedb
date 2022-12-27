function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
    // Redirect to the login page
    window.location.href = "../login/login.html";
  }

  // Run the genLine function every 50 milliseconds
  setInterval(genLine, 50);

  let canvas = document.getElementById("canvas");

  // Make clickable points on the line
  // Clicking a line will alert the user of the line's index
  // 0 is the main line, and the off-shoots are from 1 onwards

  // Add a new event listener for the mouse down event
  canvas.addEventListener("mousedown", (event) => check(event, false));

  // Add a new event listener for the mouse move event
  canvas.addEventListener("mousemove", (event) => check(event));  
}

var offshoots = 6;

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
  ctx.shadowBlur = 15;

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
  for (let i = 0; i < offshoots; i++) {
    // Get the index of the coordinate to start from
    let coord = coords[(i * Math.round(coords.length / offshoots) + 30) % (coords.length - 15)];

    // Get the x and y values
    let x = coord.x;
    let y = coord.y;

    // Make a new line with a red color
    ctx.beginPath();
    ctx.strokeStyle = "#ff7f3f";
    ctx.shadowColor = "#ff7f3f";

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
  ctx.strokeStyle = "#dfffff";
  ctx.shadowColor = "#dfffff";

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
  let x = event.clientX;
  let y = event.clientY;

  let index = null;

  // Get window vars
  let coords = window["coords"];
  let offCoords = window["offCoords"];

  // Get the range of the click so that it doesn't have to be exact
  let range = 5;
  let xMin = x - range;
  let xMax = x + range;
  let yMin = y - range;
  let yMax = y + range;

  // Check if the click is on the main line
  let onMain = coords.some((coord) => { return coord.x > xMin && coord.x < xMax && coord.y > yMin && coord.y < yMax; });

  // Check if the click is on the main line
  if (onMain) {
    // Set the index to 0
    index = 0;
  } else {
    // Loop through the off-shoots
    offCoords.forEach((offshoot, i) => {
      // Check if the click is on the off-shoot
      let onOff = offshoot.some((coord) => { return coord.x > xMin && coord.x < xMax && coord.y > yMin && coord.y < yMax; });

      // If it is, alert the user of the index of the line
      if (onOff) {
        index = i + 1;
      }
    });
  }

  // If the index is null, then the user hasn't clicked or hovered on a line
  if (index == null) {
    // Reset the cursor
    document.body.style.cursor = "default";
    return;
  }

  // If the user has clicked, then alert the user of the index
  if (!e) alert("You clicked on line " + index + "!");
  // If the user has hovered, then change the cursor to a pointer
  else document.body.style.cursor = "pointer";
}