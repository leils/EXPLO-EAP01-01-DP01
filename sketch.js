const imgPathList = ["/assets/p4.jpg", "/assets/p6.jpg", "/assets/p8.jpg"]
let img;
let buttonHeight;

/*--------------------- Drawings variables -------------------------*/
/*
 * Drawings consist of an image index, color, and list of strokes 
 * strokeList holds the strokes in the current drawing 
 * currentStroke consists of a list of points 
 */
let drawingList = [];
let strokeList = [];
let currentStroke = [];

const setStrokeWeight = 10;
const colorList = ["red", "blue", "violet", "yellow"];
let currentColorIndex = 0;

/*--------------------- Classes -------------------------*/
/* 
 * class Drawing 
 * {String} drawing.colorStr
 * {Array.Array{x:number, y:number}} drawing.strokes
*/ 
class Drawing {
  constructor(colorStr, strokes) {
    this.colorStr = colorStr;
    this.strokes = strokes;
  }
}

/*--------------------- Setup -------------------------*/
function preload() {
  img = loadImage("/assets/p1.jpg");
}

function setup() {
  createMetaTag();
  createCanvas(window.innerWidth, window.innerHeight);
  buttonHeight = window.innerHeight - 130;

  resetBackground();

  let submitButton = createButton("submit");
  submitButton.position(20, buttonHeight);
  submitButton.mousePressed(submitDrawing);

  let seeAllDrawingsButton = createButton("see all drawings");
  seeAllDrawingsButton.position(150, buttonHeight);
  seeAllDrawingsButton.mousePressed(showAllDrawings);

  let undoButton = createButton("undo");
  undoButton.position(410, buttonHeight);
  undoButton.mousePressed(undo);

  let clearButton = createButton("clear");
  clearButton.position(520, buttonHeight);
  clearButton.mousePressed(clearCanvas);
  
  strokeWeight(setStrokeWeight);
  stroke(colorList[currentColorIndex]);
}

function draw() {
  drawPrompt();
}

function drawPrompt() {
  push();
  textSize(50);
  strokeWeight(3);
  stroke('black');
  fill('yellow');
  text("Do you see something in this image? Draw it!", 40, window.innerHeight-150);
  pop();
}

// ------------------- Draw Functions ----------------//
function resetBackground() {
  image(img, 0, 0, window.innerWidth, window.innerHeight);
}

/**
 * drawStroke draws a single stroke
 * @param {Array.{x:number, y:number}} s array of points
 **/
function drawStroke(s) {
  // the if is a double check, we may want to remove
  if (s.length > 1) {
    //ensure we have 2 or more points to draw a line
    for (var i = 1; i < s.length; i++) {
      var lastPoint = s[i - 1];
      var currentPoint = s[i];
      line(lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y);
    }
  }
}

/**
 * drawAllStrokes
 * @param {Array.Array.{x:number, y:number}} slist array of strokes
 **/
function drawAllStrokes(slist) {
  for (var stroke of slist) {
    drawStroke(stroke);
  }
}

function showAllDrawings() {
  for (var drawing of drawingList) {
    push();
    stroke(drawing.colorStr);
    drawAllStrokes(drawing.strokes);
    pop();
  }
}

function changeColor() {
  currentColorIndex =
    currentColorIndex >= colorList.length - 1 ? 0 : currentColorIndex + 1;
  console.log(currentColorIndex);

  stroke(colorList[currentColorIndex]);
}

//-------------------- IO ---------------------//
function mouseReleased() {
  endStroke();
}

function touchEnded() {
  endStroke();
}

// touch functionality means the mouse can "jump" across the screen 
// This is a hack to make sure the stroke starts where touch starts 
function touchStarted() {
  pmouseX = mouseX;
  pmouseY = mouseY;
}

function endStroke() {
  console.log('ending stroke');
  // commit this stroke to the StrokeList
  if (currentStroke.length > 1) {
    strokeList.push(currentStroke);
  }

  //clear stroke for next touch
  currentStroke = [];
}

// mouseDragged runs on touch on mobile, so long as touchMoved is not defined
function mouseDragged() {
  // add the first point to the stroke if not dragged yet
  // only useful for mouseDrag, not required for touch 
  if (currentStroke.length == 0) {
    console.log('taking last point ', pmouseX, pmouseY)
    currentStroke.push({ x: pmouseX, y: pmouseY });
  }

  line(pmouseX, pmouseY, mouseX, mouseY);
  currentStroke.push({ x: mouseX, y: mouseY });
}

function undo() {
  if (strokeList.length > 0) {
    strokeList.pop();
    resetBackground();
    drawAllStrokes(strokeList);
    console.log("undid");
  }
}

function clearCanvas() {
  strokeList = [];
  resetBackground();
  console.log("cleared");
}

function submitDrawing() {
  console.log("Submitting Drawing");
  if (strokeList.length > 0) {
    let d = new Drawing(colorList[currentColorIndex], strokeList);
    drawingList.push(d);
    strokeList = [];
    resetBackground();
    changeColor();
  }
}

function saveDrawingsToJson() {
  saveJSON(drawingList, 'drawings.json');
}

function keyPressed() {
  if (key == "s") {
    submitDrawing();
  } else if (key == "c") {
    clearCanvas();
  } else if (key == "u") {
    undo();
  } else if (key == "r") {
    resetBackground();
  } else if (key == "a") {
    showAllDrawings();
  } else if (key == "1") {
    saveDrawingsToJson();
  }
}

//Taken from Oren Shoham's work https://openprocessing.org/sketch/790331/
function createMetaTag() {
  let meta = createElement("meta");
  meta.attribute("name", "viewport");
  meta.attribute(
    "content",
    "user-scalable=no,initial-scale=1,maximum-scale=1,minimum-scale=1,width=device-width,height=device-height"
  );

  let head = select("head");
  meta.parent(head);
}
