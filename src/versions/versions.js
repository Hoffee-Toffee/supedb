function start() {
  // Check if the user isn't logged in
  if (!auth.currentUser) {
    // Redirect to the login page
    window.location.href = "../login/login.html";
  }

  // Run the genLine function every 50 milliseconds
  setInterval(genLine, 50);
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

  // Set the line width
  ctx.lineWidth = 5;

  // Set the line cap to round
  ctx.lineCap = "round";

  // Set the line color to a off-whity blue
  ctx.strokeStyle = "#bfffff";

  // Set the line shadow color to white
  ctx.shadowColor = "#ffffff";

  // Set the line shadow blur
  ctx.shadowBlur = 10;


  // Start the line
  ctx.beginPath();
  // Draw the curves
  for (let i = 0; i < 105; i++) {
    // To allow change over time, we need to use the current time as a base
    let time = Date.now();

    // Get the x value
    let x = (window.innerWidth / 100) * i;

    // Get three sets of y values (from 3 sine waves)
    // Time will change the height of the waves, not the position

    let y1 = (Math.sin((time / 2500) + (i / 13)) * 15) + (window.innerHeight / 2);
    let y2 = (Math.sin((time / 2500) + (i / 7) + 2) * 2) + (window.innerHeight / 2);
    let y3 = (Math.sin((time / 2500) + (i / 5) + 3) * 7) + (window.innerHeight / 2);

    // Get the average of the three y values
    let y = (y1 + y2 + y3) / 3;

    // Some points will have off-shoots
    // Every 30th point will have an off-shoot upwards/down that curves further to the right
    if ([15, 0].includes(i % 20)) {
      // Close the line
      ctx.stroke();

      // Make a new line with an orange color
      ctx.beginPath();
      ctx.strokeStyle = "#ffaa00";

      // Make 10 points for the off-shoot

      for (let j = 0; j < 10; j++) {
        // Get the x value
        let x2 = x + (j * 10);

        // Get the y value, starting from the previous point
        // If the point is even, it will go up, if it's odd, it will go down

        let y2;
        if (i % 20 == 0) {
          y2 = y - Math.pow(j, 1.5);
        }
        else {
          y2 = y + Math.pow(j, 1.5);
        }

        // Draw the line
        ctx.lineTo(x2, y2);
      }

      // Move back to just before the off-shoot
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "#bfffff";
      ctx.moveTo((window.innerWidth / 100) * (i - 1), y);
      ctx.lineTo(x, y);

    }
    else if (i == 0) {
      ctx.moveTo(x, y);
    }
    else {
      ctx.lineTo(x, y);
    }
  }

  // End the line
  ctx.stroke();
}