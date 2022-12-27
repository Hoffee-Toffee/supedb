function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
    // Redirect to the login page
    window.location.href = "../login/login.html";
  }

  // Run the genLine function every 50 milliseconds
  setInterval(genLine, 50);
}

var offshoots = 4;

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
  ctx.shadowBlur = 25;

  // Start the line
  ctx.beginPath();

  // Create an array for the coordinates
  let coords = [];

  // To allow change over time, we need to use the current time as a base
  let time = Date.now();
  
  // Draw the curves
  for (let i = 0; i < 105; i++) {
    // Get the x value
    let x = (window.innerWidth / 100) * i;

    // Get three sets of y values (from 3 sine waves)
    // Time will change the height of the waves, not the position

    let y1 = Math.sin(time / 3000 + i / 13) * 15 + window.innerHeight / 2;
    let y2 = Math.sin(time / 3000 + i / 7 + 2) * 2 + window.innerHeight / 2;
    let y3 = Math.sin(time / 3000 + i / 5 + 3) * 7 + window.innerHeight / 2;

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
    let coord = coords[i * Math.round(coords.length / offshoots)];

    // Get the x and y values
    let x = coord.x;
    let y = coord.y;

    // Make a new line with a red color
    ctx.beginPath();
    ctx.strokeStyle = "#ff7f3f";
    ctx.shadowColor = "#ff7f3f";

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
    }

    // Finish the line
    ctx.stroke();
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
}
