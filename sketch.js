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
const afterSubmitText = "Great! Let's see what other people drew.";

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
const Modes = Object.freeze({
  DRAW: 0,
  SUBMIT: 1,
  SHOW: 2
});

let currentMode = Modes.DRAW;

let drawingsForCurrentImage = [];
let currentImageDrawingIndex = 0;
let drawingOpacity = 0;
let drawingColor;
let flashOpacity = 0;

//-------------------- Show Modes ---------------------//
function toggleMode() {
  if (currentMode == Modes.DRAW) { // draw -> submit -> show 
    for (b of allButtons) { // hide all buttons
      b.hide();
    }
    currentMode = Modes.SUBMIT;
    resetBackground();

    setTimeout(() => { showModeSetup(); },2000); //goes to ShowMode in 2 seconds

    // Set a timeout to return to draw mode after 30 seconds
    setTimeout(() => {
      if(currentMode == Modes.SHOW) {
        toggleMode();
      }
    }, 30000)

  } else { // show mode -> draw mode 
    clearCanvas();
    for (b of allButtons) { // show all buttons
      b.show();
    }
    currentMode = Modes.DRAW

    showModeTeardown();
  }
}

function showModeSetup() {
  resetBackground();
  drawingsForCurrentImage = drawingList.filter(d => d.imgIndex == currentImageIndex);
  currentImageDrawingIndex = 0;
  drawingOpacity = 0;
  drawingColor = color(drawingsForCurrentImage[currentImageDrawingIndex].colorStr);

  currentMode = Modes.SHOW;
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
  drawStrokes(drawing.strokes);
  
  if (drawingOpacity < 255) {
    drawingOpacity+=2;
  } else {
    getNextDrawing();
  }
  pop();
}

/*--------------------- Buttons -------------------------*/
let allButtons = [];
const buttonOffset = 100;

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

  buttonHeight = window.innerHeight - 120;
  promptTextSize = Math.floor(window.innerWidth/21);
  textSize(promptTextSize);
  textAlign(CENTER);
  strokeWeight(setStrokeWeight);
  stroke(colorList[currentColorIndex]);

  resetBackground();
  buttonInit();
}

function draw() {
  if (currentMode == Modes.SHOW) {
    renderShowModeFrame();
  }
  handleFlashAnimation();
  if (currentMode != Modes.SUBMIT) { drawPrompt(); }
  console.log(currentMode);
}

function buttonInit() {
  let totalWidth = 0;
  for (var i=0; i < buttonInfo.length; i++) {
    let bInfo = buttonInfo[i];
    let newButton = createButton(bInfo.label);
    if (bInfo.hasOwnProperty("className")) {
      newButton.class(bInfo.className);
    }
    newButton.mousePressed(bInfo.clickFunct);

    totalWidth += newButton.width;
    allButtons.push(newButton);
  }

  // centering the buttons on-screen
  totalWidth += (allButtons.length - 1) * buttonOffset;
  let spaceOffset = (window.innerWidth - totalWidth)/2;

  for (b of allButtons) {
    b.position(spaceOffset, buttonHeight);
    spaceOffset += (buttonOffset + b.width);
  }

}

function drawPrompt() {
  // TODO incorporate submit mode into promp drawing for clarity
  push();
  fill("black");
  noStroke();
  rectMode(CENTER);
  rect(window.innerWidth/2, window.innerHeight - 100, window.innerWidth, 200, 30);

  strokeWeight(3);
  stroke('black');
  fill('yellow');
  if (currentMode == Modes.DRAW) {
    text(drawPromptText, window.innerWidth/2, window.innerHeight-150);
  } else {
    text(showPromptText, window.innerWidth/2, window.innerHeight-100);
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

  stroke(colorList[currentColorIndex]);
}

//-------------------- Drawing & Mouse ---------------------//
function mouseReleased() {
  if (currentMode == Modes.DRAW) {
    endStroke();
  }
}

function touchEnded() {
  if (currentMode == Modes.DRAW) {
    endStroke();
  }
}

function touchStarted() {
  // touch functionality means the mouse can "jump" across the screen 
  // This is a hack to make sure the stroke starts where touch starts 
  pmouseX = mouseX;
  pmouseY = mouseY;
  if (currentMode == Modes.SHOW) {
    toggleMode();
  }
}

function endStroke() {
  // commit this stroke to the StrokeList
  if (currentStroke.length > 1) {
    strokeList.push(currentStroke);
  }

  //clear stroke for next touch
  currentStroke = [];
}

// mouseDragged runs on touch on mobile, so long as touchMoved is not defined
function mouseDragged() {
  if (currentMode == Modes.DRAW) {
    // add the first point to the stroke if not dragged yet
    // only useful for mouseDrag, not required for touch 
    if (currentStroke.length == 0) {
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
  }
}

//-------------------- Canvas ---------------------//
function clearCanvas() {
  strokeList = [];
  resetBackground();
}

function submitDrawing() {
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
    noStroke();
    fill('black');
    rectMode(CENTER);
    rect(window.innerWidth/2, window.innerHeight/2 - (promptTextSize/3), window.innerWidth, 100, 30);
    strokeWeight(3);
    stroke('black');
    fill('yellow');
    textAlign(CENTER);
    text(afterSubmitText, window.innerWidth/2, window.innerHeight/2);
    pop();

    push();
    noStroke();
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
