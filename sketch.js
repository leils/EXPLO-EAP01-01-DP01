/*--------------------- Image variables -------------------------*/
// Asset order matters; index is used to create relation with drawings 
const imgPathList = [
  "assets/p1.jpg", 
  "assets/p2.jpg", 
  "assets/p3.jpg",
  "assets/p4.jpg"
]
let loadedImages = [];
let currentImageIndex = 0;
let buttonHeight;
let promptTextSize = 50;

/*--------------------- Drawings variables -------------------------*/
/*
 * Drawings consist of an image index, color, and list of strokes 
 * strokeList holds the strokes in the current drawing 
 * currentStroke consists of a list of points 
 */
const drawingStorePath = "drawings.json";
let drawingList = [];
let strokeList = [];
let currentStroke = [];

const setStrokeWeight = 10;
const colorList = ["red", "blue", "violet", "yellow"];
let currentColorIndex = 0;
let showingOldDrawings = false;
let seeAllDrawingsButton;

/*--------------------- Classes -------------------------*/
/* 
 * class Drawing 
 * {String} drawing.colorStr
 * {Array.Array{x:number, y:number}} drawing.strokes
*/ 
class Drawing {
  constructor(imgIndex, colorStr, strokes) {
    this.imgIndex = imgIndex;
    this.colorStr = colorStr;
    this.strokes = strokes;
  }
}

/*--------------------- Setup -------------------------*/
function preload() {
  for (path of imgPathList) {
    loadedImages.push(loadImage(path));
  }

  fetchJSONData();
}

// Adapted from https://www.geeksforgeeks.org/read-json-file-using-javascript/
function fetchJSONData() {
  fetch("./drawings.json")
      .then((res) => {
          if (!res.ok) {
              throw new Error
                  (`HTTP error! Status: ${res.status}`);
          }
          return res.json();
      })
      .then((data) => 
            drawingList = data)
      .catch((error) => 
             console.error("Unable to fetch data:", error));
}

function setup() {
  createMetaTag();
  createCanvas(window.innerWidth, window.innerHeight);
  buttonHeight = window.innerHeight - 130;
  promptTextSize = Math.floor(window.innerWidth/21);

  resetBackground();

  let submitButton = createButton("submit");
  submitButton.position(20, buttonHeight);
  submitButton.mousePressed(submitDrawing);

  seeAllDrawingsButton = createButton("see all drawings");
  seeAllDrawingsButton.position(150, buttonHeight);
  seeAllDrawingsButton.mousePressed(handleShowDrawingButton);

  let undoButton = createButton("undo");
  undoButton.position(410, buttonHeight);
  undoButton.mousePressed(undo);

  let clearButton = createButton("clear");
  clearButton.position(520, buttonHeight);
  clearButton.mousePressed(clearCanvas);

  let nextButton = createButton("next image");
  nextButton.position(630, buttonHeight);
  nextButton.mousePressed(nextImage);
  
  strokeWeight(setStrokeWeight);
  stroke(colorList[currentColorIndex]);
}

function draw() {
  drawPrompt();
}

function drawPrompt() {
  push();
  textSize(promptTextSize);
  strokeWeight(3);
  stroke('black');
  fill('yellow');
  text("Do you see something in this image? Draw it!", 40, window.innerHeight-150);
  pop();
}

// ------------------- Draw Functions ----------------//
function resetBackground() {
  image(loadedImages[currentImageIndex], 0, 0, window.innerWidth, window.innerHeight);
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

/* 
 * TODO: handle the on/off change also when moving to next image
*/
function handleShowDrawingButton() {
  if (!showingOldDrawings) {
    seeAllDrawingsButton.style("background-color","green");
    showAllDrawings();
    showingOldDrawings = true;
  } else {
    seeAllDrawingsButton.style("background-color","yellow");
    clearCanvas();
    showingOldDrawings = false;
  }
}

function showAllDrawings() {
  let relevantDrawings = drawingList.filter(d => d.imgIndex == currentImageIndex); 

  for (var drawing of relevantDrawings) {
    push();
    stroke(drawing.colorStr);
    drawAllStrokes(drawing.strokes);
    pop();
  }
}

function nextImage() {
  currentImageIndex = currentImageIndex >= loadedImages.length - 1 ? 0 : currentImageIndex + 1;
  clearCanvas(); // also remove the current drawings 
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
    let d = new Drawing(currentImageIndex, colorList[currentColorIndex], strokeList);
    drawingList.push(d);
    strokeList = [];
    resetBackground();
    changeColor();
  }
}

// browser can't actually save to a JSON file 
// instead it creates a downloadable JSON file 
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
  } else if (key == "n") {
    nextImage();
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
