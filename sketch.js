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
let promptTextSize = 50; //Gets rewritten based on window width 
const drawPromptText = "Do you see something in this image? Draw it!";
const showPromptText = "Tap the screen to start drawing";

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

/* There are two modes; drawing mode, and showing mode 
 * Drawing + drawing IO, image navigation, only available in drawing mode 
 */ 
let drawMode = true; 
let drawingsForCurrentImage = [];
let currentImageDrawingIndex = 0;
let drawingOpacity = 0;
let drawingColor;
let tapForEscape = false;
let flashOpacity = 0;

/*--------------------- Buttons -------------------------*/
let drawModeButtons = [];
const buttonOffset = 40;

const buttonInfo = [ 
  {
    label: "Undo",
    clickFunct: undo
  }, 
  {
    label: "Submit",
    clickFunct: submitDrawing,
    className: "submitButton"
  }, 
  {
    label: "Next Image",
    clickFunct: nextImage
  }
]

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
  buttonInit();
  strokeWeight(setStrokeWeight);
  stroke(colorList[currentColorIndex]);
}


function draw() {
  if (!drawMode) {
    renderShowModeFrame();
  }
  handleFlashAnimation();
  drawPrompt();
}

function buttonInit() {
  let spaceOffset = buttonOffset;
  for (var i=0; i < buttonInfo.length; i++) {
    let bInfo = buttonInfo[i];
    let newButton = createButton(bInfo.label);
    if (bInfo.hasOwnProperty("className")) {
      newButton.class(bInfo.className);
    }
    newButton.position(spaceOffset, buttonHeight);
    newButton.mousePressed(bInfo.clickFunct);

    spaceOffset += (newButton.width + buttonOffset);
    drawModeButtons.push(newButton);
  }
}

function drawPrompt() {
  push();
  textSize(promptTextSize);
  strokeWeight(3);
  stroke('black');
  fill('yellow');
  if (drawMode) {
    text(drawPromptText, 40, window.innerHeight-150);
  } else {
    text(showPromptText, 150, window.innerHeight-100);
  }
  pop();
}

// ------------------- Draw Functions ----------------//
function resetBackground() {
  image(loadedImages[currentImageIndex], 0, 0, window.innerWidth, window.innerHeight);
}

/**
 * drawStrokes
 * @param {Array.Array.{x:number, y:number}} slist array of strokes
 **/
function drawStrokes(slist) {
  for (var stroke of slist) {
    if (stroke.length > 1) {
      for (var i = 1; i < stroke.length; i++) {
        var lastPoint = stroke[i - 1];
        var currentPoint = stroke[i];
        line(lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y);
      } 
    }
  }
}


function getNextDrawing() {
  currentImageDrawingIndex = currentImageDrawingIndex < drawingsForCurrentImage.length - 1 ? currentImageDrawingIndex + 1 : 0;
  drawingOpacity = 0;
  drawingColor = color(drawingsForCurrentImage[currentImageDrawingIndex].colorStr);
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

//-------------------- Drawing & Mouse ---------------------//
function mouseReleased() {
  if (drawMode) {
    endStroke();
  }
}

function touchEnded() {
  if (drawMode) {
    endStroke();
  }
}

function touchStarted() {
  // touch functionality means the mouse can "jump" across the screen 
  // This is a hack to make sure the stroke starts where touch starts 
  pmouseX = mouseX;
  pmouseY = mouseY;
  if (tapForEscape) {
    console.log("toggling");
    toggleMode();
  }
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
  if (drawMode) {
    // add the first point to the stroke if not dragged yet
    // only useful for mouseDrag, not required for touch 
    if (currentStroke.length == 0) {
      console.log('taking last point ', pmouseX, pmouseY)
      currentStroke.push({ x: pmouseX, y: pmouseY });
    }

    line(pmouseX, pmouseY, mouseX, mouseY);
    currentStroke.push({ x: mouseX, y: mouseY });
  }
}

function undo() {
  if (strokeList.length > 0) {
    strokeList.pop();
    resetBackground();
    drawStrokes(strokeList);
    console.log("undid");
  }
}

//-------------------- Canvas ---------------------//
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

    flashOpacity = 255;
    strokeList = [];
    resetBackground();
    changeColor();
    toggleMode();
  }
}

function handleFlashAnimation() {
  if (flashOpacity > 0) {
    push();
    resetBackground();
    let flashColor = color("white");
    flashColor.setAlpha(flashOpacity);
    fill(flashColor);
    rect(0,0,window.innerWidth, window.innerHeight);
    flashOpacity = flashOpacity - 10;
    pop(0);
  }
}

// browser can't actually save to a JSON file 
// instead it creates a downloadable JSON file 
function saveDrawingsToJson() {
  saveJSON(drawingList, 'drawings.json');
}

//-------------------- Show Modes ---------------------//
function toggleMode() {
  if (drawMode) { // draw mode -> show mode
    for (b of drawModeButtons) { // hide all buttons
      b.hide();
    }
    showModeSetup();

    // Needs some delay, otherwise the tap will be registered due to button click and toggle immediately
    setTimeout(() => { 
      tapForEscape = true;
    }, 200);

    // Set a timeout to return to draw mode after 30 seconds
    setTimeout(() => {
      if(!drawMode) {
        toggleMode();
      }
    }, 30000)
  } else { // show mode -> draw mode 
    clearCanvas();
    for (b of drawModeButtons) { // show all buttons
      b.show();
    }
    tapForEscape = false;
    drawMode = true;

    showModeTeardown();
  }
}

function showModeSetup() {
  console.log('show mode setup');
  resetBackground();
  drawingsForCurrentImage = drawingList.filter(d => d.imgIndex == currentImageIndex);
  currentImageDrawingIndex = 0;
  drawingOpacity = 0;
  drawingColor = color(drawingsForCurrentImage[currentImageDrawingIndex].colorStr);

  drawMode = false;
}

function showModeTeardown() {
  currentImageDrawingIndex = 0;
  drawingOpacity = 0;
  drawingsForCurrentImage = [];
}

function renderShowModeFrame() {
  resetBackground();
  
  push();
  let drawing = drawingsForCurrentImage[currentImageDrawingIndex];
  drawingColor.setAlpha(drawingOpacity);
  stroke(drawingColor);
  drawAllStrokes(drawing.strokes);
  
  if (drawingOpacity < 255) {
    drawingOpacity+=3;
    console.log(drawingOpacity)
  } else {
    getNextDrawing();
  }
  pop();
}

//-------------------- Admin ---------------------//
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
    toggleMode();
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
