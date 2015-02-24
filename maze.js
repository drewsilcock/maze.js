// Author: Drew Silcock
// TODO:
// * Add timer
// * Add difficulty option
// * Animate movement
// * Add ghosts that you have to avoid
// * Remove borders byte and shift counter bits

var touchCapable = 'ontouchstart' in document.documentElement;

// ----------------
// Canvas variables
// ----------------
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var canvasDiv = document.getElementById("canvas-div");

canvas.width = canvasDiv.clientWidth - 20;
canvas.height = canvasDiv.clientHeight - 20;

// --------------
// Maze variables
// --------------
var m = 10, n = 10;
var maze = createArray(m, n);

var cellWidth = canvas.width / m;
var cellHeight = canvas.height / n;
var playerWidth = 0.85 * cellWidth;
var playerHeight = 0.85 * cellHeight;

var playerPosX, playerPosY;

var start = [0, 0];
var end = [m - 1, n - 1];

var hasStarted, hasWon;

// -------------
// Game counters
// -------------

var solutionCounter, solutionTotal;
var randomCounter, randomTotal;

// Radius of circles representing collectibles
var collectRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

// Dimensions of counter tally boxes
var boxWidth = 75;
var boxHeight = 50;

// Spatial offsets of tally boxes
var boxXOffset = 80;
var boxYOffset = 5;

// ------------------
// Colour definitions
// ------------------

var playerColour = "#F3413E";
var playerTrimColour = "#A62F2D";

var solutionFillColour = "#FFCC00";
var solutionStrokeColour = "#CCA300";
var randomFillColour = "#40FA39";
var randomStrokeColour = "#2AB325";

var messageFillColour = "#90EBF0";
var messageStrokeColour = "blue";

var endFillColour = "#E739FA";
var endStrokeColour = "#A028AD";

var upColour = "#F2B01F";
var downColour = "#73F175";
var leftColour = "#73CDF1";
var rightColour = "#E773F1";

// --------------
// Start the fun!
// --------------

initialiseGame();

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

// TODO: Consider removing this altogether
function setBorders() {
    // Set flags for borders and walls on edge of maze

    // Set top and bottom borders
    for (var i = 0; i < m; i++) {
        maze[i][0] |= 128;
        maze[i][n - 1] |= 32;
    }

    // Set left and right border
    for (var i = 0; i < n; i++) {
        maze[0][i] |= 16;
        maze[m - 1][i] |= 64;
    }
}

function getRandomInt(min, max) {
    // Return a random integer between `min` and `max`, as per MDN docs

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countFlags(num) {
    // Count the number of set flags (i.e. 1's) in a binary number

    var numFlags = 0;

    while (num > 0) {
        if (num & 1) {
            numFlags++;
        }

        num >>= 1;
    }

    return numFlags;
}

function getRandomFlag(num) {
    // Choose a random set flag from a 4-bit number

    // Prevent infinite loop from incorrect argument
    if (num === 0) {
        console.log("Error: Cannot choose random set flag.");
        return false;
    }

    var res;

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
        case 'top':
            wallmask = 8;
            break;
        case 'right':
            wallmask = 4;
            break;
        case 'bottom':
            wallmask = 2;
            break;
        case 'left':
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

    validNeighbours = 0;

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
                    knockDownWall(currentCell, 'left');
                    knockDownWall(newCell, 'right');
                    break;
                case 2:  // Below original cell
                    newCell = [currentCell[0], currentCell[1] + 1];
                    knockDownWall(currentCell, 'bottom');
                    knockDownWall(newCell, 'top');
                    break;
                case 4:  // Right of original cell
                    newCell = [currentCell[0] + 1, currentCell[1]];
                    knockDownWall(currentCell, 'right');
                    knockDownWall(newCell, 'left');
                    break;
                case 8:  // Above original cell
                    newCell = [currentCell[0], currentCell[1] - 1];
                    knockDownWall(currentCell, 'top');
                    knockDownWall(newCell, 'bottom');
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

    // Experimental: Have only every other solution counter
    for (var i = 0; i < cellStack.length; i++) {
        cellStack.splice(i, 1);
    }

    // Mark all cells in the stack as solution
    for (var i = 0; i < cellStack.length; i++) {
        solutionTotal++;
        maze[cellStack[i][0]][cellStack[i][1]] |= 256;
    }
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

function placeRandomCounters() {
    // Place random counters that the players needs to pick up throughout the
    // maze

    // One fifth as many random counters to pick up as solution counters
    randomTotal = Math.ceil(solutionTotal / 5);

    var i = 0;
    while (i < randomTotal) {
        cell = getRandomCell();

        if (validRandomCounterCell(cell)) {
            maze[cell[0]][cell[1]] |= 512;
            i++;
        }
    }
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
    if (maze[cell[0]][cell[1]] & 256) {
        return false;
    }

    // Make sure there's not already a random counter there
    if (maze[cell[0]][cell[1]] & 512) {
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
    evt = evt || window.event;
    switch (evt.keyCode) {
        case 38:  // Arrow up key
        case 87:  // w key
            newX = playerPosX;
            newY = playerPosY - 1;
            canMove = canMoveTo('up');
            break;
        case 37:  // Arrow left key
        case 65:  // a key
            newX = playerPosX - 1;
            newY = playerPosY;
            canMove = canMoveTo('left');
            break;
        case 40: // Arrow down key
        case 83: // s key
            newX = playerPosX;
            newY = playerPosY + 1;
            canMove = canMoveTo('down');
            break;
        case 39:  // Arrow right key
        case 68: // d key
            newX = playerPosX + 1;
            newY = playerPosY;
            canMove = canMoveTo('right');
            break;
        default:
            console.log("Movement key not recognised.");
            return false;
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
        canMove = canMoveTo('up');
    } else if (touchY > 0.75 * canvas.height) {
        newX = playerPosX;
        newY = playerPosY + 1;
        canMove = canMoveTo('down');
    } else if (touchX < 0.5 * canvas.width) {
        newX = playerPosX - 1;
        newY = playerPosY;
        canMove = canMoveTo('left');
    } else if (touchX > 0.5 * canvas.width) {
        newX = playerPosX + 1;
        newY = playerPosY;
        canMove = canMoveTo('right');
    }

    movePlayer(canMove, newX, newY);
}

function movePlayer(canMove, newX, newY) {
    if (canMove) {  // Can move
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
        drawAll(playerPosX, playerPosY);

        // Set event listener so player can restart game
        window.addEventListener("keydown", restartGame, true);
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

    if (maze[x][y] & 256) {
        // Sitting on solution counter
        solutionCounter++;

        // Unset cell solution marker
        maze[x][y] &= ~256;
    }

    if (maze[x][y] & 512) {
        // Sitting on random counter
        randomCounter++;

        // Unset cell random counter
        maze[x][y] &= ~512;
    }
}

function canMoveTo(direction) {
    // Check whether player can move from point `destX` to `destY`

    cellval = maze[playerPosX][playerPosY];

    switch (direction) {
        case 'left':
            if (playerPosX === 0 || cellval & 1) {
                return false;
            }
            break;
        case 'down':
            if (playerPosY === n - 1 || cellval & 2) {
                return false;
            }
            break;
        case 'right':
            if (playerPosX === m - 1 || cellval & 4) {
                return false;
            }
            break;
        case 'up':
            if (playerPosY === 0 || cellval & 8) {
                return false;
            }
            break;
    }

    return true;
}

function restartGame(evt) {
    // Remove the listener post-win restart listener and re-initliase the game

    if (evt.keyCode === 13) {
        window.removeEventListener("keydown", restartGame, true);
        initialiseGame();
    }
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
            cell = [i, j];
            drawWalls(cell);
        }
    }

    context.lineWidth = 1;
}

function drawCounters() {
    // Draw the solution and random counters to the maze

    context.lineWidth = 5;

    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            if (maze[i][j] & 256) {
                // Draw solution counters
                drawCircle((i + 0.5) * cellWidth, (j + 0.5) * cellHeight,
                        collectRad, solutionFillColour, solutionStrokeColour);
            }
            if (maze[i][j] & 512) {
                // Draw random counters
                drawCircle((i + 0.5) * cellWidth, (j + 0.5) * cellHeight,
                        collectRad, randomFillColour, randomStrokeColour);
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
            collectRad, endFillColour, endStrokeColour);

    context.lineWidth = 1;
}

function drawWalls(cell) {
    // Draws all existing walls around the cell at position `cell` of `maze`

    cellval = maze[cell[0]][cell[1]];

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
    context.fillStyle = fillStyle || "white";
    context.fill();
    context.strokeStyle = strokeStyle || "white";
    context.stroke();
}

function drawRectBorder(x, y, width, height, strokeStyle, lineWidth) {
    context.beginPath();
    context.rect(x, y, width, height);
    context.closePath();
    context.strokeStyle = strokeStyle || "white";
    context.lineWidth = 5;
    context.stroke();
}

function makeWhite(x, y, width, height) {
    drawRect(x, y, width, height);
}

function drawTouchControls() {
    // Draws coloured rectangles showing the touch screen control areas

    context.globalAlpha = 0.2;

    drawRect(0, 0, canvas.width, 0.25 * canvas.height, upColour, upColour);
    drawRect(0, 0.75 * canvas.height, canvas.width, 0.25 * canvas.height,
            downColour, downColour);
    drawRect(0, 0.25 * canvas.height, 0.5 * canvas.width, 0.5 * canvas.height,
            leftColour, leftColour);
    drawRect(0.5 * canvas.width, 0.25 * canvas.height,
            0.5 * canvas.width, 0.5 * canvas.height, rightColour, rightColour);

    context.globalAlpha = 1;
}

function drawPlayer(x, y) {
    // Draw the object representing the player, currently a square.
    // Note that a reduced cell is cleared to avoid erasing the walls.

    currTopLeftX = (playerPosX + 0.5) * cellWidth - 0.5 * playerWidth;
    currTopLeftY = (playerPosY + 0.5) * cellHeight - 0.5 * playerHeight;

    playerPosX = x;
    playerPosY = y;

    newTopLeftX = (x + 0.5) * cellWidth - 0.5 * playerWidth;
    newTopLeftY = (y + 0.5) * cellHeight - 0.5 * playerHeight;

    context.beginPath();
    context.rect(newTopLeftX, newTopLeftY, playerWidth, playerHeight);
    context.closePath();
    context.fillStyle = playerColour || "black";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = playerTrimColour || "white";
    context.stroke();
    context.lineWidth = 1;
}

function drawKeyboardStartMessage() {
    drawRect(canvas.width / 2 - 250, canvas.height / 2 - 50, 500, 100,
            messageFillColour, messageStrokeColour);
    context.font = "20px Arial";
    context.fillStyle = messageStrokeColour;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Use WASD to navigate the maze",
            canvas.width / 2, canvas.height / 2);
}

function drawTouchStartMessage() {
    drawRect(canvas.width / 2 - 300, canvas.height / 2 - 50, 600, 100,
            messageFillColour, messageStrokeColour);
    context.font = "20px Arial";
    context.fillStyle = messageStrokeColour;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Touch the top, left, right and bottom sections of the screen to move",
            canvas.width / 2, canvas.height / 2);
}

function drawStartMessage() {
    if (touchCapable) {
        drawTouchStartMessage();
    } else {
        drawKeyboardStartMessage();
    }
}

function drawEndMessage() {
    drawRect(canvas.width / 2 - 250, canvas.height / 2 - 50, 500, 150,
            messageFillColour, messageStrokeColour);
    context.font = "40px Arial";
    context.fillStyle = messageStrokeColour;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Congratulations!", canvas.width / 2, canvas.height / 2);
    context.font = "20px Arial";
    context.fillText("Press 'Enter' to play again",
            canvas.width / 2, canvas.height / 2 + 50);
}

function drawCounterTallies() {
    // Draws box stating number of counters picked up

    if (solutionCounter != solutionTotal) {
        context.globalAlpha = 0.5;
    }

    drawRect(canvas.width - boxXOffset, boxYOffset, boxWidth, boxHeight,
            solutionFillColour, solutionStrokeColour);
    context.font = "20px Arial";
    context.fillStyle = solutionStrokeColour;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(solutionCounter + " / " + solutionTotal,
            canvas.width - boxXOffset + 0.5 * boxWidth,
            boxYOffset + 0.5 * boxHeight);

    context.globalAlpha = 1;

    if (randomCounter != randomTotal) {
        context.globalAlpha = 0.5;
    }

    drawRect(canvas.width - boxXOffset, boxHeight + 2 * boxYOffset,
            boxWidth, boxHeight, randomFillColour, randomStrokeColour);
    context.fillStyle = randomStrokeColour;
    context.fillText(randomCounter + " / " + randomTotal,
            canvas.width - boxXOffset + 0.5 * boxWidth,
            2 * boxYOffset + 1.5 * boxHeight);

    context.globalAlpha = 1;
}

function drawAll(x, y) {
    // Redraws the whole maze, the controls and the player at position `x`, `y`
    //makeWhite(0, 0, canvas.width, canvas.height);

    canvas.width = canvas.width;
    canvas.height = canvas.height;

    drawMaze();
    drawCounters();
    drawEnd();
    drawPlayer(x, y);
    drawCounterTallies();

    if (touchCapable) {
        drawTouchControls();
    }

    if (!hasStarted) {
        drawStartMessage();
    }

    if (hasWon) {
        drawEndMessage();
    }
}

function resizeCanvas() {
    // Changes canvas size to be equal to window size

    canvas.width = canvasDiv.clientWidth - 20;
    canvas.height = canvasDiv.clientHeight - 20;

    cellWidth = canvas.width / m;
    cellHeight = canvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    collectRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    drawAll(playerPosX, playerPosY);
}

// ---------------------------------------------------------------------
// Function to initialise the maze, draw all the elements and set up the
// event listeners for movement
// ---------------------------------------------------------------------

function initialiseGame() {
    // Reset, build and solve maze, then draw all elements and set listeners

    playerPosX = 0;
    playerPosY = 0;

    hasStarted = false;
    hasWon = false;

    solutionCounter = 0;
    solutionTotal = 0;

    randomCounter = 0;
    randomTotal = 0;

    initialiseMaze();
    setBorders();
    buildMaze();
    solveMaze();
    placeRandomCounters();

    drawAll(start[0], start[1]);

    window.addEventListener("keydown", movePlayerKeyboard, true);
    window.addEventListener("touchstart", movePlayerTouch, true);
    window.addEventListener("resize", resizeCanvas, false);
}
