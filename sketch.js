let bgColor = "black";
let frameColor = "teal";
let frameSize;
let numPixels = 200;
let circlePathRadius;
let pixelColors = ["#ffb703", "#fb8500"];
let pixelSize = 4;
let currentState;
let pixels = []; // Global pixels array
let buttonStartX, buttonStartY; // Global variables for button positions
let buttonSize = 50; // Assuming button size is constant
let spacing = 20; // Assuming spacing is constant

function setup() {
  createCanvas(min(windowWidth, 600), min(windowHeight, 600));
  frameSize = min(width, height) * 0.8;
  circlePathRadius = frameSize / 3;

  // Initialize pixels
  for (let i = 0; i < numPixels; i++) {
    let x = random((width - frameSize) / 2 + 10, (width + frameSize) / 2 - 10);
    let y = random(
      (height - frameSize) / 2 + 10,
      (height + frameSize) / 2 - 10
    );
    let color = random(pixelColors);
    pixels.push(new Pixel(x, y, color, (TWO_PI / numPixels) * i));
  }

  currentState = new PixelIdle(pixels); // Start with the PixelIdle state
}

function draw() {
  background(bgColor);
  drawFrame();
  currentState.update();
  currentState.display();
  drawButtons();
}
class Pixel {
  constructor(x, y, color, offsetAngle) {
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;
    this.color = color;
    this.offsetAngle = offsetAngle;
    this.movingBack = false; // New flag to indicate the transition back to the initial position
  }

  // New method to smoothly transition back to the initial position
  moveToInitial() {
    this.x = lerp(this.x, this.initialX, 0.1);
    this.y = lerp(this.y, this.initialY, 0.1);
    // Check if the pixel is close enough to its initial position to stop the transition
    if (dist(this.x, this.y, this.initialX, this.initialY) < 1) {
      this.x = this.initialX;
      this.y = this.initialY;
      this.movingBack = false; // Stop the transition
    }
  }

  vibrate() {
    if (!this.movingBack) {
      // Only vibrate if not moving back to the initial position
      this.x = this.initialX + random(-2, 2);
      this.y = this.initialY + random(-2, 2);
    }
  }

  moveToTarget(targetX, targetY) {
    this.x = lerp(this.x, targetX, 0.05);
    this.y = lerp(this.y, targetY, 0.05);
  }

  display() {
    fill(this.color);
    noStroke();
    rect(this.x, this.y, pixelSize, pixelSize);
  }
}

class State {
  constructor(pixels) {
    this.pixels = pixels;
  }

  update() {}

  display() {
    this.pixels.forEach((pixel) => pixel.display());
  }
}

class PixelIdle extends State {
  update() {
    this.pixels.forEach((pixel) => {
      if (pixel.movingBack) {
        pixel.moveToInitial(); // Move the pixel back to its initial position smoothly
      } else {
        pixel.vibrate(); // Allow the pixel to vibrate only if it's not moving back
      }
    });
  }
}

class CongregatedState extends State {
  constructor(pixels, pattern) {
    super(pixels);
    this.pattern = pattern;
  }

  update() {
    this.pixels.forEach((pixel) => {
      let { x, y } = this.pattern.getTargetPosition(pixel);
      pixel.moveToTarget(x, y);
    });
  }
}

class CirclePattern {
  constructor(radius) {
    this.radius = radius;
  }

  getTargetPosition(pixel) {
    let angle = pixel.offsetAngle + frameCount * 0.01;
    let x = width / 2 + this.radius * cos(angle);
    let y = height / 2 + this.radius * sin(angle);
    return { x, y };
  }
}

class TrianglePattern {
  constructor(radius) {
    this.radius = radius;
    this.vertices = [
      createVector(width / 2, height / 2 - this.radius),
      createVector(
        width / 2 - this.radius * sin(PI / 3),
        height / 2 + this.radius / 2
      ),
      createVector(
        width / 2 + this.radius * sin(PI / 3),
        height / 2 + this.radius / 2
      ),
    ];
  }

  getTargetPosition(pixel) {
    pixel.offsetAngle += 0.01; // Increment the angle to move the pixel
    let totalLength = this.radius * 3 * sqrt(3); // Total perimeter of the triangle
    let currentLength = ((pixel.offsetAngle % TWO_PI) / TWO_PI) * totalLength; // Current position along the perimeter
    let edgeLength = this.radius * sqrt(3); // Length of one edge
    let edgeIndex = Math.floor(currentLength / edgeLength); // Determine the current edge
    let lerpFactor = (currentLength % edgeLength) / edgeLength; // Factor for interpolation along the current edge

    let targetVertex = this.vertices[edgeIndex % 3];
    let nextVertex = this.vertices[(edgeIndex + 1) % 3];
    let x = lerp(targetVertex.x, nextVertex.x, lerpFactor);
    let y = lerp(targetVertex.y, nextVertex.y, lerpFactor);
    return { x, y };
  }
}

class SquarePattern {
  constructor(radius) {
    this.radius = radius;
    this.vertices = [
      createVector(width / 2 - this.radius, height / 2 - this.radius),
      createVector(width / 2 + this.radius, height / 2 - this.radius),
      createVector(width / 2 + this.radius, height / 2 + this.radius),
      createVector(width / 2 - this.radius, height / 2 + this.radius),
    ];
  }

  getTargetPosition(pixel) {
    pixel.offsetAngle += 0.01; // Increment the angle to move the pixel
    let totalLength = this.radius * 8; // Total perimeter of the square
    let currentLength = ((pixel.offsetAngle % TWO_PI) / TWO_PI) * totalLength; // Current position along the perimeter
    let edgeLength = this.radius * 2; // Length of one edge
    let edgeIndex = Math.floor(currentLength / edgeLength); // Determine the current edge
    let lerpFactor = (currentLength % edgeLength) / edgeLength; // Factor for interpolation along the current edge

    let targetVertex = this.vertices[edgeIndex % 4];
    let nextVertex = this.vertices[(edgeIndex + 1) % 4];
    let x = lerp(targetVertex.x, nextVertex.x, lerpFactor);
    let y = lerp(targetVertex.y, nextVertex.y, lerpFactor);
    return { x, y };
  }
}

function drawFrame() {
  stroke(frameColor);
  noFill();
  rect((width - frameSize) / 2, (height - frameSize) / 2, frameSize, frameSize);
}

function drawButtons() {
  let buttonSize = 50; // Size of each button
  let spacing = 20; // Spacing between buttons
  let startY = height - 60; // Adjusted to draw buttons within the canvas
  let startX = width / 2 - (1.5 * buttonSize + spacing); // Center buttons horizontally

  fill("black"); // Set a fill color to ensure visibility
  stroke("teal"); // Outline color for buttons and shapes

  // Square button with a circle inside
  rect(startX, startY, buttonSize, buttonSize);
  ellipse(startX + buttonSize / 2, startY + buttonSize / 2, buttonSize / 2);

  // Square button with a square inside
  let squareButtonX = startX + buttonSize + spacing;
  rect(squareButtonX, startY, buttonSize, buttonSize);
  rect(
    squareButtonX + buttonSize / 4,
    startY + buttonSize / 4,
    buttonSize / 2,
    buttonSize / 2
  );

  // Square button with a triangle inside
  let triangleButtonX = squareButtonX + buttonSize + spacing;
  rect(triangleButtonX, startY, buttonSize, buttonSize);
  triangle(
    triangleButtonX + buttonSize / 2,
    startY + buttonSize / 4,
    triangleButtonX + buttonSize / 4,
    startY + (3 * buttonSize) / 4,
    triangleButtonX + (3 * buttonSize) / 4,
    startY + (3 * buttonSize) / 4
  );
}

function updateButtonPositions() {
  buttonStartY = height - 60; // Position buttons just above the bottom of the canvas
  buttonStartX = width / 2 - (1.5 * buttonSize + spacing); // Center buttons horizontally
}

function mousePressed() {
  let buttonSize = 50;
  let spacing = 20;
  let startY = height - 60; // This should match the startY in drawButtons()
  let startX = width / 2 - (1.5 * buttonSize + spacing);

  // Circle button click detection
  if (
    mouseX > startX &&
    mouseX < startX + buttonSize &&
    mouseY > startY &&
    mouseY < startY + buttonSize
  ) {
    currentState = new CongregatedState(
      pixels,
      new CirclePattern(circlePathRadius)
    );
    console.log("Circle button clicked"); // Debugging log
  }

  // Square button click detection
  let squareButtonX = startX + buttonSize + spacing;
  if (
    mouseX > squareButtonX &&
    mouseX < squareButtonX + buttonSize &&
    mouseY > startY &&
    mouseY < startY + buttonSize
  ) {
    currentState = new CongregatedState(
      pixels,
      new SquarePattern(circlePathRadius)
    );
    console.log("Square button clicked"); // Debugging log
  }

  // Triangle button click detection
  let triangleButtonX = squareButtonX + buttonSize + spacing;
  if (
    mouseX > triangleButtonX &&
    mouseX < triangleButtonX + buttonSize &&
    mouseY > startY &&
    mouseY < startY + buttonSize
  ) {
    currentState = new CongregatedState(
      pixels,
      new TrianglePattern(circlePathRadius)
    );
    console.log("Triangle button clicked"); // Debugging log
  }
}

function mouseReleased() {
  pixels.forEach((pixel) => (pixel.movingBack = true)); // Initiate the transition for each pixel
  currentState = new PixelIdle(pixels);
}
