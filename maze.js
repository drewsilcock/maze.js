// Author: Drew Silcock
// TODO:
// * Select difficulty with keyboard
// * In game menu
// * Animate movement
// * Add ghosts that you have to avoid

"use strict";

var touchCapable = "ontouchstart" in document.documentElement;

// ----------------
// Canvas variables
// ----------------

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var canvasDiv = document.getElementById("canvas-div");

canvas.width = canvasDiv.clientWidth - 20;
canvas.height = canvasDiv.clientHeight - 20;

context.textAlign = "center";
context.textBaseline = "middle";

// --------------
// Maze variables
// --------------

var maze, m, n;
var start, end;

// ----------------------
// Maze drawing variables
// ----------------------

var cellWidth;
var cellHeight;

var playerWidth;
var playerHeight;

// --------------
// Game variables
// --------------

var playerPosX, playerPosY;

var timeLeft;
var timerInterval;
var hasStarted, hasWon, hasLost;

var INITIAL_TIME = 20;
var TIME_BOOST = 5;

// -------------
// Collectible variables
// -------------

var solutionCounter, solutionTotal;
var randomCounter, randomTotal;

// Radius of circles representing collectibles
var circleRad;

// Dimensions of counter tally boxes
var BOX_WIDTH = 75;
var BOX_HEIGHT = 50;

var BOX_WIDTH = 160;
var BOX_HEIGHT = 100;

// Spatial offsets of tally boxes
var BOX_OFFSET_X = BOX_WIDTH + 5;
var BOX_OFFSET_Y = 5;

// ------------------
// Colour definitions
// ------------------

var PLAYER_COLOUR = "#F3413E";
var PLAYER_TRIM_COLOUR = "#A62F2D";

var SOLUTION_FILL_COLOUR = "#FFCC00";
var SOLUTION_STROKE_COLOUR = "#755E02";
var RANDOM_FILL_COLOUR = "#40FA39";
var RANDOM_STROKE_COLOUR = "#0A540D";
var END_FILL_COLOUR = "#E739FA";
var END_STROKE_COLOUR = "#A028AD";

var MESSAGE_FILL_COLOUR = "#90EBF0";
var MESSAGE_STROKE_COLOUR = "blue";

// Colours for the touchscreen areas
var UP_COLOUR = "#F2B01F";
var DOWN_COLOUR = "#73F175";
var LEFT_COLOUR = "#73CDF1";
var RIGHT_COLOUR = "#E773F1";

// Colours for the timer
var TIMER_FILL_COLOUR = MESSAGE_FILL_COLOUR;
var TIMER_STROKE_COLOUR = MESSAGE_STROKE_COLOUR;

var WARNING_FILL_COLOUR = "#FF8400";
var WARNING_STROKE_COLOUR = "#8A4700";

var DANGER_FILL_COLOUR = "#FF7661";
var DANGER_STROKE_COLOUR = "#C93018";

// --------------
// Start the fun!
// --------------

drawMenu();

// -----------------------------------------------
// The starting point of the game, the menu screen
// -----------------------------------------------

function drawMenu() {
    // Draws the menu to the canvas, and initialises game on click

    canvas.width = canvas.width;
    canvas.height = canvas.height;

    context.textAlign = "center";
    context.textBaseline = "middle";

    var diffBoxWidth = 0.5 * canvas.width;
    var diffBoxHeight = 0.1 * canvas.height - 10;

    // Draw the difficulty boxes
    var easyTopLeftX = 0.5 * (canvas.width - diffBoxWidth);
    var easyTopLeftY = 0.7 * canvas.height - 0.5 * diffBoxHeight;
    drawRect(easyTopLeftX, easyTopLeftY,
             diffBoxWidth, diffBoxHeight,
             RANDOM_FILL_COLOUR, RANDOM_STROKE_COLOUR);

    var mediumTopLeftX = 0.5 * (canvas.width - diffBoxWidth);
    var mediumTopLeftY = 0.8 * canvas.height - 0.5 * diffBoxHeight;
    drawRect(mediumTopLeftX, mediumTopLeftY,
             diffBoxWidth, diffBoxHeight,
             WARNING_FILL_COLOUR, WARNING_STROKE_COLOUR);

    var hardTopLeftX = 0.5 * (canvas.width - diffBoxWidth);
    var hardTopLeftY = 0.9 * canvas.height - 0.5 * diffBoxHeight;
    drawRect(hardTopLeftX, hardTopLeftY,
             diffBoxWidth, diffBoxHeight,
             DANGER_FILL_COLOUR, DANGER_STROKE_COLOUR);

    // Draw the "MAZE.js" icon
    drawIcon();

    context.fillStyle = "black";

    context.font = "40px Arial";

    // Headings
    context.fillText("Rules:", 0.5 * canvas.width, 0.2 * canvas.height);
    context.fillText("Please select difficulty:", 0.5 * canvas.width,
                     0.6 * canvas.height);

    context.font = "30px Arial";

    wrapText("The aim is to navigate the maze to the purple spot before " +
             "the time runs out. You need to collect the yellow and green " +
             "spots before you finish the game, and each green spot gives " +
             "you 5 more seconds on the clock. Good luck!",
             0.5 * canvas.width, 0.3 * canvas.height,
             0.75 * canvas.width, 40);

    context.fillText("(E)asy", 0.5 * canvas.width,
                     0.7 * canvas.height);
    context.fillText("(M)edium", 0.5 * canvas.width,
                     0.8 * canvas.height);
    context.fillText("(H)ard", 0.5 * canvas.width,
                     0.9 * canvas.height);

    window.addEventListener("resize", resizeMenuCanvas, false);
    window.addEventListener("click", checkClick, false);
    window.addEventListener("touchstart", checkTouch, false);
    window.addEventListener("keydown", checkKey, false);

    function checkClick(evt) {
        // Check whether the user has clicked within the easy, medium or hard
        // boxes

        var clickX = evt.pageX;
        var clickY = evt.pageY;

        checkPos(clickX, clickY);
    }

    function checkTouch(evt) {
        // Checks whether the player has touched one of the difficulty boxes

        // We want to record only individual touches
        evt.preventDefault();

        var touchX = evt.targetTouches[0].pageX;
        var touchY = evt.targetTouches[0].pageY;

        checkPos(touchX, touchY);
    }

    function checkPos(x, y) {
        // Check whether x, y is within any of the difficulty boxes, and
        // initialise the game with the corresponding difficulty

        if (x >= easyTopLeftX && x <= easyTopLeftX + diffBoxWidth &&
            y >= easyTopLeftY && y <= easyTopLeftY + diffBoxHeight) {
            startGame("easy");
        }

        if (x >= mediumTopLeftX && x <= mediumTopLeftX + diffBoxWidth &&
            y >= mediumTopLeftY && y <= mediumTopLeftY + diffBoxHeight) {
            startGame("medium");
        }

        if (x >= hardTopLeftX && x <= hardTopLeftX + diffBoxWidth &&
            y >= hardTopLeftY && y <= hardTopLeftY + diffBoxHeight) {
            startGame("hard");
        }
    }

    function checkKey(evt) {
        // Checks whether user has pressed `e`, `m`, or `h` for easy, medium
        // and hard difficulties

        switch (evt.keyCode) {
            case 69:  // `e` for easy
                startGame("easy");
                break;
            case 77:  // `m` for medium
                startGame("medium");
                break;
            case 72:  // 'h' for hard
                startGame("hard");
                break;
            case 73:  // 'i' for secret insane mode
                startGame("insane");
                break;
        }
    }

    function startGame(difficulty) {
        // Remove all event listeners and initialise game with specifiied
        // difficulty

        window.removeEventListener("click", checkClick, false);
        window.removeEventListener("touchstart", checkTouch, false);
        window.removeEventListener("keydown", checkKey, false);
        window.removeEventListener("resize", resizeMenuCanvas, false);

        initialiseGame(difficulty);
    }
}

function drawIcon() {
    // Draw the maze.js icon

    var icon = new Image();
    icon.src = "maze-icon.png";
    icon.onload = function() {
        context.drawImage(icon, 0.5 * canvas.width - 150,
                          0.025 * canvas.height)
    }
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var line = "";

    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

// --------------------------------------
// Useful function for creating 2D arrays
// --------------------------------------

function createArray(width, height) {
    // Creates an m by n array

    var arr = new Array(width);

    for (var i = 0; i < width; i++) {
        arr[i] = new Array(height);

        for (var j = 0; j < height; j++) {
            arr[i][j] = 0;
        }
    }

    return arr;
}

// -----------------------------------------
// The maze generation and solving functions
// -----------------------------------------

function initialiseMaze() {
    // Initialise the m by n maze with all walls up

    // Set all cells to zero
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            maze[i][j] = 0;
        }
    }

    // Inside maze cells
    for (var i = 1; i < m - 1; i++) {
        for (var j = 1; j < n - 1; j++) {
            maze[i][j] |= 15;
        }
    }

    // The top and bottom border cells
    for (var i = 1; i < m - 1; i++) {
        maze[i][0] |= 7;
        maze[i][n - 1] |= 13;
    }

    // The left and right border cells
    for (var i = 1; i < n - 1; i++) {
        maze[0][i] |= 14;
        maze[m - 1][i] |= 11;
    }

    // The corner cells
    maze[0][0] |= 6;  // Top-left corner

    maze[m - 1][0] |= 3;  // Top right corner

    maze[0][n - 1] |= 12;  // Bottom left corner

    maze[m - 1][n - 1] |= 9;  // Bottom right corner

    return maze;
}

function buildMaze() {
    // Construct a perfect maze in `maze` that is m by n

    var cellStack, totalCells, currentCell, visitedCells, newCell;
    var visitedArray, validNeighbours, neighbour;

    // Stack to hold the cell locations
    cellStack = new Array();

    totalCells = m * n;

    // Array containing whether each cell has been visited
    visitedArray = createArray(m, n);

    currentCell = getRandomCell();

    visitedCells = 1;

    while (visitedCells < totalCells) {
        // Set this cell as visited
        visitedArray[currentCell[0]][currentCell[1]] = 1;

        // Get byte describing which neighbours haven't been visited
        validNeighbours = getNeighbours(visitedArray, currentCell);

        if (validNeighbours === 0) {
            currentCell = cellStack.pop();
        }
        else {
            // Choose one valid neighbour at random
            neighbour = getRandomFlag(validNeighbours);
            switch (neighbour) {
                case 1:  // Left of original cell
                    newCell = [currentCell[0] - 1, currentCell[1]];
                    knockDownWall(currentCell, "left");
                    knockDownWall(newCell, "right");
                    break;
                case 2:  // Below original cell
                    newCell = [currentCell[0], currentCell[1] + 1];
                    knockDownWall(currentCell, "bottom");
                    knockDownWall(newCell, "top");
                    break;
                case 4:  // Right of original cell
                    newCell = [currentCell[0] + 1, currentCell[1]];
                    knockDownWall(currentCell, "right");
                    knockDownWall(newCell, "left");
                    break;
                case 8:  // Above original cell
                    newCell = [currentCell[0], currentCell[1] - 1];
                    knockDownWall(currentCell, "top");
                    knockDownWall(newCell, "bottom");
                    break;
                default:
                    console.log("Error: Invalid choice of neighbour.");
                    return false;
            }

            cellStack.push(currentCell);
            currentCell = newCell;
            visitedCells++;
        }

    }
}

function solveMaze() {
    // Marks the solution to the maze using similar method to construction

    var cellStack, currentCell, visitedCells, newCell;
    var visitedArray, unvisitedNeighbours, validNeighbours, neighbour;

    // Stack to hold the cell locations
    cellStack = new Array();

    // Array containing whether each cell has been visited
    visitedArray = createArray(m, n);

    currentCell = start;

    while (!(currentCell[0] === end[0] && currentCell[1] === end[1])) {
        // Set this cell as visited
        visitedArray[currentCell[0]][currentCell[1]] = 1;

        // Get byte describing which neighbours haven't been visited
        unvisitedNeighbours = getNeighbours(visitedArray, currentCell);

        // Here we also require no intervening wall
        validNeighbours = unsetWalledNeighbours(unvisitedNeighbours,
                                                currentCell);

        if (validNeighbours === 0) {
            currentCell = cellStack.pop();
        }
        else {
            // Choose one valid neighbour at random
            neighbour = getRandomFlag(validNeighbours);
            switch (neighbour) {
                case 1:  // Left of original cell
                    newCell = [currentCell[0] - 1, currentCell[1]];
                    break;
                case 2:  // Below original cell
                    newCell = [currentCell[0], currentCell[1] + 1];
                    break;
                case 4:  // Right of original cell
                    newCell = [currentCell[0] + 1, currentCell[1]];
                    break;
                case 8:  // Above original cell
                    newCell = [currentCell[0], currentCell[1] - 1];
                    break;
                default:
                    console.log("Error: Invalid choice of neighbour.");
                    return false;
            }

            cellStack.push(currentCell);
            currentCell = newCell;
        }
    }

    // Remove the first element, starting point, which is special
    cellStack.splice(0, 1);

    // Mark all cells in the stack as solution
    for (var i = 0; i < cellStack.length; i += 2) {
        solutionTotal++;
        maze[cellStack[i][0]][cellStack[i][1]] |= 16;
    }
}

function placeRandomCounters() {
    // Place random counters that the players needs to pick up throughout the
    // maze

    // One fifth as many random counters to pick up as solution counters
    randomTotal = Math.ceil(solutionTotal / 5);

    var i = 0, cell;
    while (i < randomTotal) {
        cell = getRandomCell();

        if (validRandomCounterCell(cell)) {
            maze[cell[0]][cell[1]] |= 32;
            i++;
        }
    }
}

function getRandomInt(min, max) {
    // Return a random integer between `min` and `max`, as per MDN docs

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFlag(num) {
    // Choose a random set flag from a 4-bit number

    // Prevent infinite loop from incorrect argument
    if (num === 0) {
        console.log("Error: Cannot choose random set flag.");
        return false;
    }

    var rand, res;

    do {
        rand = Math.pow(2, getRandomInt(0, 4));
        res = num & rand;
    } while (res === 0);

    return res;
}

function knockDownWall(cell, wall) {
    // Knock down the wall between cellOne and cellTwo

    var wallmask;

    switch (wall) {
        case "top":
            wallmask = 8;
            break;
        case "right":
            wallmask = 4;
            break;
        case "bottom":
            wallmask = 2;
            break;
        case "left":
            wallmask = 1;
            break;
        default:
            console.log("Error: Invalid wall to destroy.");
            return false;
    }

    maze[cell[0]][cell[1]] &= ~wallmask;
}

function getNeighbours(visitedArray, cell) {
    // Get all unvisited neighbours of `cell` in `maze` as byte

    var validNeighbours = 0;

    // Check left
    if ((cell[0] != 0) && (!visitedArray[cell[0] - 1][cell[1]])) {
        validNeighbours |= 1;
    }

    // Check below
    if ((cell[1] != n - 1) && (!visitedArray[cell[0]][cell[1] + 1])) {
        validNeighbours |= 2;
    }

    // Check right
    if ((cell[0] != m - 1) && (!visitedArray[cell[0] + 1][cell[1]])) {
        validNeighbours |= 4;
    }

    // Check above
    if ((cell[1] != 0) && (!visitedArray[cell[0]][cell[1] - 1])) {
        validNeighbours |= 8;
    }

    return validNeighbours;
}

function unsetWalledNeighbours(neighbours, cell) {
    // Unset all flags in byte `neighbours` where there's a wall between `cell`
    // and that neighbour

    var cellval = maze[cell[0]][cell[1]];

    // Bits representing left, bottom, right and top walls respectively
    var wallmasks = [1, 2, 4, 8];

    // Check if cell has walls and unset corresponding neighbour bit
    wallmasks.forEach(function(mask) {
        if (cellval & mask) {
            neighbours &= ~mask;
        }
    });

    return neighbours;
}

function validRandomCounterCell(cell) {
    // Check whether `cell` is valid for placing a random counter at

    // Make sure it's not the start point
    if (cell[0] === start[0] && cell[1] === start[1]) {
        return false;
    }

    // Make sure it's not the end point
    if (cell[0] === end[0] && cell[1] === end[1]) {
        return false;
    }

    // Make sure there's not already a solution counter there
    if (maze[cell[0]][cell[1]] & 16) {
        return false;
    }

    // Make sure there's not already a random counter there
    if (maze[cell[0]][cell[1]] & 32) {
        return false;
    }

    return true;
}

function getRandomCell() {
    // Get a random cell in the maze

    return [getRandomInt(0, m - 1), getRandomInt(0, n - 1)];
}
// -----------------------------
// The player movement functions
// -----------------------------

function movePlayerKeyboard(evt) {
    // Check whether the player can move to the location specified by keyboard
    // input, and if so move them there. Check whether the player has won,
    // and display congratulations accordingly

    var newX;
    var newY;
    var canMove;

    switch (evt.keyCode) {
        case 38:  // Arrow up key
        case 87:  // w key
            newX = playerPosX;
            newY = playerPosY - 1;
            canMove = canMoveTo("up");
            break;
        case 37:  // Arrow left key
        case 65:  // a key
            newX = playerPosX - 1;
            newY = playerPosY;
            canMove = canMoveTo("left");
            break;
        case 40: // Arrow down key
        case 83: // s key
            newX = playerPosX;
            newY = playerPosY + 1;
            canMove = canMoveTo("down");
            break;
        case 39:  // Arrow right key
        case 68: // d key
            newX = playerPosX + 1;
            newY = playerPosY;
            canMove = canMoveTo("right");
            break;
        default:
            return;
    }

    movePlayer(canMove, newX, newY);
}

function movePlayerTouch(evt) {
    // Does same as moverPlayerKeyboard, but instead of taking keyboard input,
    // determine motion based on which section of the screen the user is touching

    // We want to record only individual touches
    evt.preventDefault();

    var touchX = evt.targetTouches[0].pageX;
    var touchY = evt.targetTouches[0].pageY;

    var newX;
    var newY;
    var canMove;

    if (touchY < 0.25 * canvas.height) {
        newX = playerPosX;
        newY = playerPosY - 1;
        canMove = canMoveTo("up");
    } else if (touchY > 0.75 * canvas.height) {
        newX = playerPosX;
        newY = playerPosY + 1;
        canMove = canMoveTo("down");
    } else if (touchX < 0.5 * canvas.width) {
        newX = playerPosX - 1;
        newY = playerPosY;
        canMove = canMoveTo("left");
    } else if (touchX > 0.5 * canvas.width) {
        newX = playerPosX + 1;
        newY = playerPosY;
        canMove = canMoveTo("right");
    }

    movePlayer(canMove, newX, newY);
}

function movePlayer(canMove, newX, newY) {
    if (canMove) {  // Can move
        if (!hasStarted) {
            createTimer();
        }

        hasStarted = true;

        checkCounters(newX, newY);

        drawAll(newX, newY);
        playerPosX = newX;
        playerPosY = newY;
    }

    if (playerPosX === end[0] && playerPosY === end[1] &&
        hasCollectedAllCounters()) {
        // Remove the movement event listeners
        window.removeEventListener("keydown", movePlayerKeyboard, true);
        window.removeEventListener("touchstart", movePlayerTouch, true);

        hasWon = true;
        clearInterval(timerInterval);
        drawAll(playerPosX, playerPosY);

        // Set event listeners so player can restart game
        window.addEventListener("keydown", restartGameKeyboard, true);
        window.addEventListener("touchstart", restartGameTouch, true);
    }
}

function hasCollectedAllCounters() {
    // Check whether the player has collected all counters

    if (solutionCounter === solutionTotal && randomCounter === randomTotal) {
        return true;
    }

    return false;
}

function checkCounters(x, y) {
    // Check whether there are any counters at (`x`,`y`)

    if (maze[x][y] & 16) {
        // Sitting on solution counter
        solutionCounter++;

        // Unset cell solution marker
        maze[x][y] &= ~16;
    }

    if (maze[x][y] & 32) {
        // Sitting on random counter
        randomCounter++;

        // Unset cell random counter
        maze[x][y] &= ~32;

        // Get more time!
        timeLeft += TIME_BOOST;
    }
}

function canMoveTo(direction) {
    // Check whether player can move from point `destX` to `destY`

    var cellval = maze[playerPosX][playerPosY];

    switch (direction) {
        case "left":
            if (playerPosX === 0 || cellval & 1) {
                return false;
            }
            break;
        case "down":
            if (playerPosY === n - 1 || cellval & 2) {
                return false;
            }
            break;
        case "right":
            if (playerPosX === m - 1 || cellval & 4) {
                return false;
            }
            break;
        case "up":
            if (playerPosY === 0 || cellval & 8) {
                return false;
            }
            break;
    }

    return true;
}

function restartGameKeyboard(evt) {
    // Restart game upon user pressing Enter

    if (evt.keyCode === 13) {
        window.removeEventListener("keydown", restartGameKeyboard, true);
        window.removeEventListener("touchstart", restartGameTouch, true);
        drawMenu();
    }
}

function restartGameTouch(evt) {
    // Restart game upon user touching screen

    window.removeEventListener("keydown", restartGameKeyboard, true);
    window.removeEventListener("touchstart", restartGameTouch, true);
    drawMenu();
}

// ------------------
// The timer function
// ------------------

function createTimer() {
    // Sets off a timer decrementing in seconds (1000 ms)

    timerInterval = setInterval(function() {
        timeLeft--;
        drawAll(playerPosX, playerPosY);
        if (timeLeft === 0) {
            window.removeEventListener("keydown", movePlayerKeyboard, true);
            window.removeEventListener("touchstart", movePlayerTouch, true);

            hasLost = true;
            clearInterval(timerInterval);
            drawAll();

            window.addEventListener("keydown", restartGameKeyboard, true);
            window.addEventListener("touchstart", restartGameTouch, true);

            return;
        }
    }, 1000);
}

// ----------------------
// The drawing functions
// ----------------------

function drawMaze() {
    // Draw the produced maze to the canvas

    context.lineWidth = 2;

    // Draw the boundaries twice for consistent thickness with walls
    for (var i = 0; i < 2; i++) {
        drawLine([cellWidth, 0], [m * cellWidth, 0]);
        drawLine([0, 0], [0, n * cellHeight]);
        drawLine([m * cellWidth, 0], [m * cellWidth, n * cellHeight]);
        drawLine([0, n * cellHeight], [(m - 1) * cellWidth, n * cellHeight]);
    }

    // Draw the walls
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            drawWalls([i, j]);
        }
    }

    context.lineWidth = 1;
}

function drawCounters() {
    // Draw the solution and random counters to the maze

    context.lineWidth = 5;

    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            if (maze[i][j] & 16) {
                // Draw solution counters
                drawCircle((i + 0.5) * cellWidth, (j + 0.5) * cellHeight,
                        circleRad, SOLUTION_FILL_COLOUR, SOLUTION_STROKE_COLOUR);
            }
            if (maze[i][j] & 32) {
                // Draw random counters
                drawCircle((i + 0.5) * cellWidth, (j + 0.5) * cellHeight,
                        circleRad, RANDOM_FILL_COLOUR, RANDOM_STROKE_COLOUR);
            }
        }
    }

    context.lineWidth = 1;
}

function drawCircle(x, y, radius, fillStyle, strokeStyle) {
    // Draw a circle of radius `radius` centred on point (`x`, `y`)

    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = fillStyle;
    context.fill();
    context.strokeStyle = strokeStyle;
    context.stroke();
}

function drawEnd() {
    // Draw the start and end points as specially coloured circles

    context.lineWidth = 5;

    drawCircle((end[0] + 0.5) * cellWidth, (end[1] + 0.5) * cellHeight,
            circleRad, END_FILL_COLOUR, END_STROKE_COLOUR);

    context.lineWidth = 1;
}

function drawWalls(cell) {
    // Draws all existing walls around the cell at position `cell` of `maze`

    var cellval = maze[cell[0]][cell[1]];

    if (cellval & 1) {  // Left wall present
        drawLine([cell[0] * cellWidth, cell[1] * cellHeight],
                 [cell[0] * cellWidth, (cell[1] + 1) * cellHeight]);
    }

    if (cellval & 2) { // Bottom wall present
        drawLine([cell[0] * cellWidth, (cell[1] + 1) * cellHeight],
                 [(cell[0] + 1) * cellWidth, (cell[1] + 1) * cellHeight]);
    }

    if (cellval & 4) { // Right wall present
        drawLine([(cell[0] + 1) * cellWidth, cell[1] * cellHeight],
                 [(cell[0] + 1) * cellWidth, (cell[1] + 1) * cellHeight]);
    }

    if (cellval & 8) { // Top wall present
        drawLine([cell[0] * cellWidth, cell[1] * cellHeight],
                 [(cell[0] + 1) * cellWidth, cell[1] * cellHeight]);
    }
}

function drawLine(startPos, endPos) {
    // Draws a line from point startPos = [startPosX, startPosY] to
    // endPos = [endPosX, endPosY]

    context.beginPath();
    context.moveTo(startPos[0], startPos[1]);
    context.lineTo(endPos[0], endPos[1]);
    context.stroke();
}

function drawRect(x, y, width, height, fillStyle, strokeStyle) {
    context.beginPath();
    context.rect(x, y, width, height);
    context.closePath();
    context.fillStyle = fillStyle;
    context.fill();
    context.strokeStyle = strokeStyle;
    context.stroke();
}

function drawTouchControls() {
    // Draws coloured rectangles showing the touch screen control areas

    context.globalAlpha = 0.2;

    drawRect(0, 0, canvas.width, 0.25 * canvas.height, UP_COLOUR, UP_COLOUR);
    drawRect(0, 0.75 * canvas.height, canvas.width, 0.25 * canvas.height,
            DOWN_COLOUR, DOWN_COLOUR);
    drawRect(0, 0.25 * canvas.height, 0.5 * canvas.width, 0.5 * canvas.height,
            LEFT_COLOUR, LEFT_COLOUR);
    drawRect(0.5 * canvas.width, 0.25 * canvas.height,
            0.5 * canvas.width, 0.5 * canvas.height, RIGHT_COLOUR, RIGHT_COLOUR);

    context.globalAlpha = 1;
}

function drawPlayer(x, y) {
    // Draw the object representing the player, currently a square.
    // Note that a reduced cell is cleared to avoid erasing the walls.

    var currTopLeftX = (playerPosX + 0.5) * cellWidth - 0.5 * playerWidth;
    var currTopLeftY = (playerPosY + 0.5) * cellHeight - 0.5 * playerHeight;

    playerPosX = x;
    playerPosY = y;

    var newTopLeftX = (x + 0.5) * cellWidth - 0.5 * playerWidth;
    var newTopLeftY = (y + 0.5) * cellHeight - 0.5 * playerHeight;

    context.beginPath();
    context.rect(newTopLeftX, newTopLeftY, playerWidth, playerHeight);
    context.closePath();
    context.fillStyle = PLAYER_COLOUR;
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = PLAYER_TRIM_COLOUR;
    context.stroke();
    context.lineWidth = 1;
}

function drawStartMessage() {
    context.font = "40px Arial";

    if (touchCapable) {
        drawRect(0.5 * canvas.width - 350, 0.5 * canvas.height - 50, 700, 140,
                 MESSAGE_FILL_COLOUR, MESSAGE_STROKE_COLOUR);
        context.fillStyle = MESSAGE_STROKE_COLOUR;
        context.fillText("Touch the top, left, right and bottom",
                         0.5 * canvas.width, 0.5 * canvas.height);
        context.fillText("sections of the screen to move",
                         0.5 * canvas.width, 0.5 * canvas.height + 40);
    } else {
        drawRect(0.5 * canvas.width - 300, 0.5 * canvas.height - 50, 600, 100,
                 MESSAGE_FILL_COLOUR, MESSAGE_STROKE_COLOUR);
        context.fillStyle = MESSAGE_STROKE_COLOUR;
        context.fillText("Use WASD to navigate the maze",
                         0.5 * canvas.width, 0.5 * canvas.height);
    }

    drawIcon();
}

function drawWinMessage() {
    drawRect(0.5 * canvas.width - 350, 0.5 * canvas.height - 50, 700, 225,
            RANDOM_FILL_COLOUR, RANDOM_STROKE_COLOUR);
    context.font = "60px Arial";
    context.fillStyle = RANDOM_STROKE_COLOUR;
    context.fillText("Congratulations!",
                     0.5 * canvas.width, 0.5 * canvas.height);
    context.font = "40px Arial";
    context.fillText("You finished with " + timeLeft + " seconds to spare.",
            0.5 * canvas.width, 0.5 * canvas.height + 75);

    if (touchCapable) {
        context.fillText("Touch the screen to play again.",
                         0.5 * canvas.width, 0.5 * canvas.height + 125);
    } else {
        context.fillText("Press 'Enter' to play again.",
                         0.5 * canvas.width, 0.5 * canvas.height + 125);
    }

    drawIcon();
}

function drawLostMessage() {
    drawRect(0.5 * canvas.width - 300, 0.5 * canvas.height - 60, 600, 200,
             DANGER_FILL_COLOUR, DANGER_STROKE_COLOUR);
    context.font = "60px Arial";
    context.fillStyle = DANGER_STROKE_COLOUR;
    context.fillText("Time's up!", 0.5 * canvas.width, 0.5 * canvas.height);
    context.font = "40px Arial";

    if (touchCapable) {
        context.fillText("Touch the screen to play again",
                         0.5 * canvas.width, 0.5 * canvas.height + 75);
    } else {
        context.fillText("Press 'Enter' to play again",
                         0.5 * canvas.width, 0.5 * canvas.height + 75);
    }

    drawIcon();
}

function drawCounterTallies() {
    // Draws box stating number of counters picked up

    if (solutionCounter != solutionTotal) {
        context.globalAlpha = 0.5;
    }

    drawRect(canvas.width - BOX_OFFSET_X, BOX_OFFSET_Y, BOX_WIDTH, BOX_HEIGHT,
             SOLUTION_FILL_COLOUR, SOLUTION_STROKE_COLOUR);
    context.font = "50px Arial";
    context.fillStyle = SOLUTION_STROKE_COLOUR;
    context.fillText(solutionCounter + " / " + solutionTotal,
                     canvas.width - BOX_OFFSET_X + 0.5 * BOX_WIDTH,
                     BOX_OFFSET_Y + 0.5 * BOX_HEIGHT);

    context.globalAlpha = 1;

    if (randomCounter != randomTotal) {
        context.globalAlpha = 0.5;
    }

    drawRect(canvas.width - BOX_OFFSET_X, BOX_HEIGHT + 2 * BOX_OFFSET_Y,
             BOX_WIDTH, BOX_HEIGHT, RANDOM_FILL_COLOUR, RANDOM_STROKE_COLOUR);
    context.fillStyle = RANDOM_STROKE_COLOUR;
    context.fillText(randomCounter + " / " + randomTotal,
                     canvas.width - BOX_OFFSET_X + 0.5 * BOX_WIDTH,
                     2 * BOX_OFFSET_Y + 1.5 * BOX_HEIGHT);

    context.globalAlpha = 1;
}

function drawTimer(time) {
    // Draws a timer displaying time

    context.font = "50px Arial";

    if (time <= 10 && time > 5) {
        context.fillStyle = WARNING_FILL_COLOUR;
        context.strokeStyle = WARNING_STROKE_COLOUR;
    } else if (time <= 5) {
        context.fillStyle = DANGER_FILL_COLOUR;
        context.strokeStyle = DANGER_STROKE_COLOUR;
    } else {
        context.fillStyle = TIMER_FILL_COLOUR;
        context.strokeStyle = TIMER_STROKE_COLOUR;
    }

    var minutesLeft = Math.floor(time / 60).toString();
    var secondsLeft = (time - minutesLeft * 60).toString();

    if (secondsLeft.length === 1) {
        secondsLeft = "0" + secondsLeft;
    }

    if (!hasWon && !hasLost) {
        context.globalAlpha = 0.5;
    }

    drawRect(canvas.width - BOX_OFFSET_X, 2 * BOX_HEIGHT + 3 * BOX_OFFSET_Y,
             BOX_WIDTH, BOX_HEIGHT);

    context.fillStyle = context.strokeStyle;

    context.fillText(minutesLeft + ":" + secondsLeft,
                     canvas.width - BOX_OFFSET_X + 0.5 * BOX_WIDTH,
                     3 * BOX_OFFSET_Y + 2.5 * BOX_HEIGHT);

    context.globalAlpha = 1;

}

// TODO: Finish this, decide on blur
function drawEscapeMenu() {
    // Draws the in-game menu brought up when player presses escape

    canvas.style.filter = canvas.style.webkitFilter = "blur(3px)";

    var menuCanvas = document.getElementById("menu-canvas");
    var menuContext = menuCanvas.getContext("2d");

    menuContext.fillStyle = "black";
    menuContext.fillText("TESTING", 0.5 * canvas.width, 0.5 * canvas.height);
}

function drawAll(x, y) {
    // Redraws the whole maze, the controls and the player at position `x`, `y`

    canvas.width = canvas.width;
    canvas.height = canvas.height;

    context.textAlign = "center";
    context.textBaseline = "middle";

    drawMaze();
    drawCounters();
    drawEnd();
    drawPlayer(x, y);
    drawCounterTallies();
    drawTimer(timeLeft);

    if (touchCapable) {
        drawTouchControls();
    }

    if (!hasStarted) {
        drawStartMessage();
    }

    if (hasWon) {
        drawWinMessage();
    }

    if (hasLost) {
        drawLostMessage();
    }
}

// ------------------------------
// Dynamic sesizability functions
// ------------------------------

function resizeMenuCanvas() {
    // Changes canvas size to be equal to window size

    canvas.width = canvasDiv.clientWidth - 20;
    canvas.height = canvasDiv.clientHeight - 20;

    context.textAlign = "center";
    context.textBaseline = "middle";

    cellWidth = canvas.width / m;
    cellHeight = canvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    drawMenu(playerPosX, playerPosY);
}

function resizeGameCanvas() {
    // Changes canvas size to be equal to window size

    canvas.width = canvasDiv.clientWidth - 20;
    canvas.height = canvasDiv.clientHeight - 20;

    context.textAlign = "center";
    context.textBaseline = "middle";

    cellWidth = canvas.width / m;
    cellHeight = canvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    drawAll(playerPosX, playerPosY);
}

// ---------------------------------------------------------------------
// Function to initialise the maze, draw all the elements and set up the
// event listeners for movement
// ---------------------------------------------------------------------

function initialiseGame(difficulty) {
    // Reset, build and solve maze, then draw all elements and set listeners

    switch (difficulty) {
        case "easy":
            m = 10, n = 10;
            break;
        case "medium":
            m = 15; n = 15;
            break;
        case "hard":
            m = 20, n = 20;
            break;
        case "insane":
            m = 50, n = 50;
            break;
    }

    // Calculate all the size dependent variables
    maze = createArray(m, n);
    start= [0, 0];
    end = [m - 1, n - 1];
    cellWidth = canvas.width / m;
    cellHeight = canvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    playerPosX = 0;
    playerPosY = 0;

    hasStarted = false;
    hasWon = false;
    hasLost = false;

    solutionCounter = 0;
    solutionTotal = 0;

    randomCounter = 0;
    randomTotal = 0;

    timeLeft = INITIAL_TIME;

    initialiseMaze();
    buildMaze();
    solveMaze();
    placeRandomCounters();

    drawAll(start[0], start[1]);

    window.addEventListener("keydown", movePlayerKeyboard, true);
    window.addEventListener("keydown", drawEscapeMenu, true);
    window.addEventListener("touchstart", movePlayerTouch, true);
    window.addEventListener("resize", resizeGameCanvas, false);
}
