// Author: Drew Silcock
// TODO:
// * Should canvas objects be globals or not?
// * Should there be separate controllers for drawing and game manipulation?

"use strict";

var touchCapable = "ontouchstart" in document.documentElement;

// ----------------
// Canvas variables
// ----------------

var mazeCanvas = document.getElementById("maze-canvas");
var mazeContext = mazeCanvas.getContext("2d");

var menuCanvas = document.getElementById("menu-canvas");
var menuContext = menuCanvas.getContext("2d");

var canvasDiv = document.getElementById("canvas-div");

menuCanvas.width = mazeCanvas.width = canvasDiv.clientWidth - 20;
menuCanvas.height = mazeCanvas.height = canvasDiv.clientHeight - 20;

menuContext.textAlign = mazeContext.textAlign = "center";
menuContext.textBaseline = mazeContext.textBaseline = "middle";

var menuCanvas = document.getElementById("menu-canvas");
var menuContext = menuCanvas.getContext("2d");

// ----------------
// Useful functions
// ----------------

function createArray(width, height) {
    // Creates an m by n array

    var array = [];
    var column = [];

    while (column.push(0) < height) {}
    while (array.push(column) < width) {}

    return arr;
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

// -----------------------
// Maze object and methods
// -----------------------

var Maze = function(difficulty) {
    // The constructor for the maze object

    switch (difficulty) {
        case "easy":
            this.m = 10;
            this.n = 10;
            break;
        case "medium":
            this.m = 15;
            this.n = 15;
            break;
        case "hard":
            this.m = 20;
            this.n = 20;
            break;
        case "insane":
            this.m = 50;
            this.n = 50;
            break;
    }

    this.startX = 0;
    this.startY = 0;
    this.endX = m - 1;
    this.endY = n - 1;

    this.cellWidth = mazeCanvas.width / m;
    this.cellHeight = mazeCanvas.height / n;
    this.playerWidth = 0.85 * cellWidth;
    this.playerHeight = 0.85 * cellHeight;
    this.circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    var INITIAL_TIME = 20;
    var TIME_BOOST = 5;

    this.playerPosX = this.playerPosY = 0;
    this.hasStarted = this.hasWon = this.hasLost = false;
    this.solutionCounter = this.solutionTotal = 0;
    this.randomCounter = this.randomTotal = 0;
    this.timeLeft = this.INITIAL_TIME;

    // Bits for maze walls
    this.LEFT = 1;
    this.BOTTOM = 2;
    this.RIGHT = 4;
    this.TOP = 8;

    // Bits for counters
    this.SOLUTION = 16;
    this.RANDOM = 32;

    // What sides are opposite what other sides
    this.opposite = {
        1: 4,
        4: 1,
        2: 8,
        8: 2
    };

    this.values = createArray(m, n);

    this.prototype.initialiseMaze();
    this.prototype.buildMaze();
    this.prototype.placeCounters();
};

Maze.prototype.initialiseMaze = function() {
    // Initialise the m by n maze with all walls up

    // Inside maze cells
    for (var i = 1; i < this.m - 1; i++) {
        for (var j = 1; j < this.n - 1; j++) {
            this.values[i][j] |= this.LEFT + this.BOTTOM + this.RIGHT + this.TOP;
        }
    }

    // The top and bottom border cells
    for (var i = 1; i < this.m - 1; i++) {
        this.values[i][0] |= this.LEFT + this.BOTTOM + this.RIGHT;
        this.values[i][this.n - 1] |= this.LEFT + this.TOP + this.RIGHT;
    }

    // The left and right border cells
    for (var i = 1; i < this.n - 1; i++) {
        this.values[0][i] |= this.RIGHT + this.BOTTOM + this.TOP;
        this.values[this.m - 1][i] |= this.LEFT + this.BOTTOM + this.TOP;
    }

    // The corner cells
    this.values[0][0] |= this.BOTTOM + this.RIGHT;  // Top-left corner

    this.values[this.m - 1][0] |= this.BOTTOM + this.LEFT;  // Top right corner

    this.values[0][this.n - 1] |= this.TOP + this.RIGHT;  // Bottom left corner

    this.values[this.m - 1][this.n - 1] |= this.TOP + this.LEFT;  // Bottom right corner
};

Maze.prototype.buildMaze = function() {
    // Construct a perfect maze in `maze` that is m by n

    var cellStack, totalCells, currentCell, visitedCells, newCell;
    var visitedArray, validNeighbours, neighbour;

    // Stack to hold the cell locations
    cellStack = [];

    totalCells = this.m * this.n;

    // Array containing whether each cell has been visited
    visitedArray = createArray(this.m, this.n);

    currentCell = getRandomCell();

    visitedCells = 1;

    while (visitedCells < totalCells) {
        // Set this cell as visited
        visitedArray[currentCell[0]][currentCell[1]] = true;

        // Get byte describing which neighbours haven't been visited
        validNeighbours = Maze.prototype.getNeighbours(visitedArray, currentCell);

        if (validNeighbours === 0) {
            currentCell = cellStack.pop();
        }
        else {
            // Choose one valid neighbour at random
            neighbour = getRandomFlag(validNeighbours);
            switch (neighbour) {
                case this.LEFT:  // Left of original cell
                    newCell = [currentCell[0] - 1, currentCell[1]];
                    break;
                case this.BOTTOM:  // Below original cell
                    newCell = [currentCell[0], currentCell[1] + 1];
                    break;
                case this.RIGHT:  // Right of original cell
                    newCell = [currentCell[0] + 1, currentCell[1]];
                    break;
                case this.TOP:  // Above original cell
                    newCell = [currentCell[0], currentCell[1] - 1];
                    break;
                default:
                    console.log("Error: Invalid choice of neighbour.");
                    return false;
            }

            Maze.prototype.knockDownWall(currentCell, neighbour);
            Maze.prototype.knockDownWall(newCell, this.opposite[neighbour]);

            cellStack.push(currentCell);
            currentCell = newCell;
            visitedCells++;
        }

    }
};

Maze.prototype.removeCounters = function() {
    // Remove all current counters from the maze

    for (var i = 0; i < this.m; i++) {
        for (var j = 0; j < this.n; j++) {
            this.values[i][j] &= ~(this.SOLUTION + this.RANDOM);
        }
    }
};

Maze.prototype.placeCounters = function() {
    // Place the random and solution counters on the maze

    this.prototype.placeSolutionCounters();
    this.prototype.placeRandomCounters();
};

Maze.prototype.placeSolutionCounters = function() {
    // Marks the solution to the maze using similar method to construction

    var cellStack, currentCell, visitedCells, newCell;
    var visitedArray, unvisitedNeighbours, validNeighbours, neighbour;

    // Stack to hold the cell locations
    cellStack = [];

    // Array containing whether each cell has been visited
    visitedArray = createArray(this.m, this.n);

    currentCell = [this.startX, this.startY];

    while (!(currentCell[0] === this.endX && currentCell[1] === this.endY)) {
        // Set this cell as visited
        visitedArray[currentCell[0]][currentCell[1]] = true;

        // Get byte describing which neighbours haven't been visited
        unvisitedNeighbours = Maze.prototype.getNeighbours(
                visitedArray,
                currentCell);

        // Here we also require no intervening wall
        validNeighbours = Maze.prototype.unsetWalledNeighbours(
                unvisitedNeighbours,
                currentCell);

        if (validNeighbours === 0) {
            currentCell = cellStack.pop();
        }
        else {
            // Choose one valid neighbour at random
            neighbour = Maze.prototype.getRandomFlag(validNeighbours);
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

    // Reset solution total in case of game restart
    this.solutionTotal = 0;

    // Mark half the cells in the stack as solution
    for (var i = 0; i < cellStack.length; i += 2) {
        this.solutionTotal++;
        this.values[cellStack[i][0]][cellStack[i][1]] |= this.SOLUTION;
    }
};

Maze.prototype.placeRandomCounters = function() {
    // Place random counters that the players needs to pick up throughout the
    // maze

    // One fifth as many random counters to pick up as solution counters
    this.randomTotal = Math.ceil(0.2 * this.solutionTotal);

    var i = 0, cell;
    while (i < this.randomTotal) {
        cell = Maze.prototype.getRandomCell();

        if (Maze.prototype.validRandomCounterCell(cell)) {
            this.values[cell[0]][cell[1]] |= this.RANDOM;
            i++;
        }
    }
};

Maze.prototype.knockDownWall = function(cell, wall) {
    // Knock down the wall between cellOne and cellTwo

    var wallmask;

    switch (wall) {
        case "top":
            wallmask = this.TOP;
            break;
        case "right":
            wallmask = this.RIGHT;
            break;
        case "bottom":
            wallmask = this.BOTTOM;
            break;
        case "left":
            wallmask = this.LEFT;
            break;
        default:
            console.log("Error: Invalid wall to destroy.");
            return false;
    }

    this.values[cell[0]][cell[1]] &= ~wallmask;
};

Maze.prototype.getNeighbours = function(visitedArray, cell) {
    // Get all unvisited neighbours of `cell` in `maze` as byte

    var validNeighbours = 0;

    // Check left
    if ((cell[0] != 0) && (!visitedArray[cell[0] - 1][cell[1]])) {
        validNeighbours |= this.LEFT;
    }

    // Check below
    if ((cell[1] != this.n - 1) && (!visitedArray[cell[0]][cell[1] + 1])) {
        validNeighbours |= this.BOTTOM;
    }

    // Check right
    if ((cell[0] != this.m - 1) && (!visitedArray[cell[0] + 1][cell[1]])) {
        validNeighbours |= this.RIGHT;
    }

    // Check above
    if ((cell[1] != 0) && (!visitedArray[cell[0]][cell[1] - 1])) {
        validNeighbours |= this.TOP;
    }

    return validNeighbours;
};

Maze.prototype.unsetWalledNeighbours = function(neighbours, cell) {
    // Unset all flags in byte `neighbours` where there's a wall between `cell`
    // and that neighbour

    var cellval = this.values[cell[0]][cell[1]];

    // Bits representing left, bottom, right and top walls respectively
    var wallmasks = [this.LEFT, this.BOTTOM, this.RIGHT, this.TOP];

    // Check if cell has walls and unset corresponding neighbour bit
    wallmasks.forEach(function(mask) {
        if (cellval & mask) {
            neighbours &= ~mask;
        }
    });

    return neighbours;
};

Maze.prototype.validRandomCounterCell = function(cell) {
    // Check whether `cell` is valid for placing a random counter at

    // Make sure it's not the start point
    if (cell[0] === this.startX && cell[1] === this.startY) {
        return false;
    }

    // Make sure it's not the end point
    if (cell[0] === this.endX && cell[1] === this.endX) {
        return false;
    }

    // Make sure there's not already a solution counter there
    if (this.values[cell[0]][cell[1]] & this.SOLUTION) {
        return false;
    }

    // Make sure there's not already a random counter there
    if (this.values[cell[0]][cell[1]] & this.RANDOM) {
        return false;
    }

    return true;
};

Maze.prototype.getRandomCell = function() {
    // Get a random cell in the maze

    return [getRandomInt(0, this.m - 1), getRandomInt(0, this.n - 1)];
}

// --------------------------------
// Controller for drawing to canvas
// --------------------------------

var Controller = function(maze) {
    // Constructor for the object that controls drawing and moving the player

    // Dimensions of counter tally boxes
    this.BOX_WIDTH = 75;
    this.BOX_HEIGHT = 50;

    this.BOX_WIDTH = 160;
    this.BOX_HEIGHT = 100;

    // Width and height of difficulty boxes
    this.diffBoxWidth;
    this.diffBoxHeight;

    // Position of easy box
    this.easyTopLeftX;
    this.easyTopLeftY;

    // Position of medium box
    this.mediumTopLeftX;
    this.mediumTopLeftY;

    this.hardTopLeftX;
    this.hardTopLeftY;

    // Spatial offsets of tally boxes
    this.BOX_OFFSET_X = BOX_WIDTH + 5;
    this.BOX_OFFSET_Y = 5;

    // Pause button spatial variables
    this.PAUSE_OFFSET_X = 5;
    this.PAUSE_OFFSET_Y = 5;

    // Colours of the player
    this.PLAYER_COLOUR = "#F3413E";
    this.PLAYER_TRIM_COLOUR = "#A62F2D";

    // Colours of the different counters
    this.SOLUTION_FILL_COLOUR = "#FFCC00";
    this.SOLUTION_STROKE_COLOUR = "#755E02";
    this.RANDOM_FILL_COLOUR = "#40FA39";
    this.RANDOM_STROKE_COLOUR = "#0A540D";
    this.END_FILL_COLOUR = "#E739FA";
    this.END_STROKE_COLOUR = "#A028AD";

    // Colours for standard message boxes
    this.MESSAGE_FILL_COLOUR = "#90EBF0";
    this.MESSAGE_STROKE_COLOUR = "blue";

    // Colours for the touchscreen areas
    this.UP_COLOUR = "#F2B01F";
    this.DOWN_COLOUR = "#73F175";
    this.LEFT_COLOUR = "#73CDF1";
    this.RIGHT_COLOUR = "#E773F1";

    // Colours for the timer
    this.TIMER_FILL_COLOUR = MESSAGE_FILL_COLOUR;
    this.TIMER_STROKE_COLOUR = MESSAGE_STROKE_COLOUR;

    this.WARNING_FILL_COLOUR = "#FF8400";
    this.WARNING_STROKE_COLOUR = "#8A4700";

    this.DANGER_FILL_COLOUR = "#FF7661";
    this.DANGER_STROKE_COLOUR = "#913324";
}

Controller.prototype.drawMenu = function() {
    // Draws the menu to the canvas, and initialises game on click

    Controller.prototype.clearCanvas();

    menuContext.lineWidth = 5;

    // Width and height of difficulty boxes
    this.diffBoxWidth = 0.5 * menuCanvas.width;
    this.diffBoxHeight = 0.1 * menuCanvas.height - 10;

    // Draw the difficulty boxes
    this.easyTopLeftX = 0.5 * (menuCanvas.width - this.diffBoxWidth);
    this.easyTopLeftY = 0.7 * menuCanvas.height - 0.5 * this.diffBoxHeight;

    drawRect(this.easyTopLeftX, this.easyTopLeftY,
             this.diffBoxWidth, this.diffBoxHeight,
             menuContext,
             this.RANDOM_FILL_COLOUR, this.RANDOM_STROKE_COLOUR);

    this.mediumTopLeftX = 0.5 * (menuCanvas.width - this.diffBoxWidth);
    this.mediumTopLeftY = 0.8 * menuCanvas.height - 0.5 * this.diffBoxHeight;

    drawRect(this.mediumTopLeftX, this.mediumTopLeftY,
             this.diffBoxWidth, this.diffBoxHeight,
             menuContext,
             this.WARNING_FILL_COLOUR, this.WARNING_STROKE_COLOUR);

    this.hardTopLeftX = 0.5 * (menuCanvas.width - this.diffBoxWidth);
    this.hardTopLeftY = 0.9 * menuCanvas.height - 0.5 * this.diffBoxHeight;
    drawRect(this.hardTopLeftX, this.hardTopLeftY,
             this.diffBoxWidth, this.diffBoxHeight,
             menuContext,
             this.DANGER_FILL_COLOUR, this.DANGER_STROKE_COLOUR);

    // Draw the "MAZE.js" icon
    Controller.prototype.drawIcon();

    // Headings
    menuContext.fillStyle = "black";
    menuContext.font = "40px Arial";
    menuContext.fillText("Rules:",
                         0.5 * menuCanvas.width,
                         0.2 * menuCanvas.height);
    menuContext.fillText("Please select difficulty:",
                         0.5 * menuCanvas.width,
                         0.6 * menuCanvas.height);

    menuContext.font = "30px Arial";

    Controller.prototype.wrapText(
            "The aim is to navigate the maze to the purple spot before " +
            "the time runs out. You need to collect the yellow and green " +
            "spots before you finish the game, and each green spot gives " +
            "you 5 more seconds on the clock. Good luck!",
            0.5 * menuCanvas.width, 0.3 * menuCanvas.height,
            0.75 * menuCanvas.width, 40
    );

    menuContext.fillStyle = this.RANDOM_STROKE_COLOUR;
    menuContext.fillText("(E)asy",
                         0.5 * menuCanvas.width,
                         0.7 * menuCanvas.height);
    menuContext.fillStyle = this.WARNING_STROKE_COLOUR;
    menuContext.fillText("(M)edium",
                         0.5 * menuCanvas.width,
                         0.8 * menuCanvas.height);
    menuContext.fillStyle = this.DANGER_STROKE_COLOUR;
    menuContext.fillText("(H)ard",
                         0.5 * menuCanvas.width,
                         0.9 * menuCanvas.height);

    window.addEventListener("resize", Maze.prototype.resizeMenu, false);
    window.addEventListener("click", Maze.prototype.menuCheckClick, false);
    window.addEventListener("touchstart", Maze.prototype.checkTouch, false);
    window.addEventListener("keydown", Maze.prototype.checkKey, false);
};

Controller.prototype.menuCheckClick = function(evt) {
    // Check whether the user has clicked within the easy, medium or hard
    // boxes

    var clickX = evt.pageX;
    var clickY = evt.pageY;

    Controller.prototype.menuCheckPos(clickX, clickY);
};

Controller.prototype.checkTouch = function(evt) {
    // Checks whether the player has touched one of the difficulty boxes

    // We want to record only individual touches
    evt.preventDefault();

    var touchX = evt.targetTouches[0].pageX;
    var touchY = evt.targetTouches[0].pageY;

    Controller.prototype.menuCheckPos(touchX, touchY);
};

Controller.prototype.menuCheckPos = function(x, y) {
    // Check whether x, y is within any of the difficulty boxes, and
    // initialise the game with the corresponding difficulty

    if (x >= this.easyTopLeftX && x <= this.easyTopLeftX + this.diffBoxWidth &&
        y >= this.easyTopLeftY && y <= this.easyTopLeftY + this.diffBoxHeight) {
        Controller.prototype.startGame("easy");
    }

    if (x >= this.mediumTopLeftX && x <= this.mediumTopLeftX + this.diffBoxWidth &&
        y >= this.mediumTopLeftY && y <= this.mediumTopLeftY + this.diffBoxHeight) {
        Controller.prototype.startGame("medium");
    }

    if (x >= this.hardTopLeftX && x <= this.hardTopLeftX + this.diffBoxWidth &&
        y >= this.hardTopLeftY && y <= this.hardTopLeftY + this.diffBoxHeight) {
        Controller.prototype.startGame("hard");
    }
};

Controller.prototype.checkKey = function(evt) {
    // Checks whether user has pressed `e`, `m`, or `h` for easy, medium
    // and hard difficulties

    switch (evt.keyCode) {
        case 69:  // `e` for easy
            Controller.prototype.startGame("easy");
            break;
        case 77:  // `m` for medium
            Controller.prototype.startGame("medium");
            break;
        case 72:  // 'h' for hard
            Controller.prototype.startGame("hard");
            break;
        case 73:  // 'i' for secret insane mode
            Controller.prototype.startGame("insane");
            break;
    }
};

Controller.prototype.startGame = function(difficulty) {
    // Remove all event listeners and initialise game with specifiied
    // difficulty

    window.removeEventListener(
            "click",
            Controller.prototype.menuCheckClick,
            false);
    window.removeEventListener(
            "touchstart",
            Controller.prototype.checkTouch,
            false);
    window.removeEventListener(
            "keydown",
            Controller.prototype.checkKey,
            false);
    window.removeEventListener(
            "resize",
            Controller.prototype.resizeMenu,
            false);

    Controller.prototype.initialiseGame(difficulty);
}

Controller.prototype.drawIcon = function() {
    // Draw the maze.js icon

    var icon = new Image();
    icon.src = "maze-icon.png";
    icon.onload = function() {
        menuContext.drawImage(icon,
                              0.5 * menuCanvas.width - 150,
                              0.025 * menuCanvas.height)
    }
};

Controller.prototype.wrapText = function(text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var line = "";

    for (var i = 0; i < words.length; i++) {
        var testLine = line + words[i] + " ";
        var metrics = menuContext.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && i > 0) {
            menuContext.fillText(line, x, y);
            line = words[i] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    menuContext.fillText(line, x, y);
}

// -----------------------------
// The player movement functions
// -----------------------------

Controller.prototype.movePlayerKeyboard = function(evt) {
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

    if (canMove) {
        movePlayer(newX, newY);
    }
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

    // If player pressed pause button, don't move
    if (touchX >= PAUSE_OFFSET_X &&
        touchX <= PAUSE_OFFSET_X + BOX_WIDTH &&
        touchY >= menuCanvas.height - PAUSE_OFFSET_Y - BOX_HEIGHT &&
        touchY <= menuCanvas.height - PAUSE_OFFSET_Y) {
        return;
    }

    if (touchY < 0.25 * mazeCanvas.height) {
        newX = playerPosX;
        newY = playerPosY - 1;
        canMove = canMoveTo("up");
    } else if (touchY > 0.75 * mazeCanvas.height) {
        newX = playerPosX;
        newY = playerPosY + 1;
        canMove = canMoveTo("down");
    } else if (touchX < 0.5 * mazeCanvas.width) {
        newX = playerPosX - 1;
        newY = playerPosY;
        canMove = canMoveTo("left");
    } else if (touchX > 0.5 * mazeCanvas.width) {
        newX = playerPosX + 1;
        newY = playerPosY;
        canMove = canMoveTo("right");
    }

    if (canMove) {
        movePlayer(newX, newY);
    }
}

function movePlayer(newX, newY) {
    // Make sure maze is unblurred
    unblurMaze();

    if (!hasStarted) {
        createTimer();
    }

    hasStarted = true;

    checkCounters(newX, newY);

    drawAll(newX, newY);
    playerPosX = newX;
    playerPosY = newY;

    if (playerPosX === end[0] && playerPosY === end[1] &&
        hasCollectedAllCounters()) {
        // Remove the movement event listeners
        window.removeEventListener("keydown", movePlayerKeyboard, false);
        window.removeEventListener("touchstart", movePlayerTouch, false);

        hasWon = true;
        clearInterval(timerInterval);
        drawAll(playerPosX, playerPosY);

        // Set event listeners so player can restart game
        window.addEventListener("keydown", restartGameKeyboard, false);
        window.addEventListener("touchstart", restartGameTouch, false);
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
        window.removeEventListener("keydown", restartGameKeyboard, false);
        window.removeEventListener("touchstart", restartGameTouch, false);
        drawMenu();
    }
}

function restartGameTouch(evt) {
    // Restart game upon user touching screen, unless they pressed pause

    var touchX = evt.targetTouches[0].pageX;
    var touchY = evt.targetTouches[0].pageY;

    if (touchX >= PAUSE_OFFSET_X &&
        touchX <= PAUSE_OFFSET_X + BOX_WIDTH &&
        touchY >= menuCanvas.height - PAUSE_OFFSET_Y - BOX_HEIGHT &&
        touchY <= menuCanvas.height - PAUSE_OFFSET_Y) {
        return;
    }

    window.removeEventListener("keydown", restartGameKeyboard, false);
    window.removeEventListener("touchstart", restartGameTouch, false);
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
            window.removeEventListener("keydown", movePlayerKeyboard, false);
            window.removeEventListener("touchstart", movePlayerTouch, false);

            hasLost = true;
            clearInterval(timerInterval);
            drawAll(playerPosX, playerPosY);

            window.addEventListener("keydown", restartGameKeyboard, false);
            window.addEventListener("touchstart", restartGameTouch, false);

            return;
        }
    }, 1000);
}

// --------------------------
// The main drawing functions
// --------------------------

function drawMaze() {
    // The overarching function to draw the maze walls and counters

    drawMazeWalls();
    drawCounters();
    drawEnd();
    drawCounterTallies();
    drawTimer(timeLeft);
}

function drawMazeWalls() {
    // Draw the produced maze walls to the canvas

    mazeContext.lineWidth = 2;

    // Draw the boundaries twice for consistent thickness with walls
    for (var i = 0; i < 2; i++) {
        drawLine(cellWidth, 0, m * cellWidth, 0, mazeContext);
        drawLine(0, 0, 0, n * cellHeight, mazeContext);
        drawLine(m * cellWidth, 0, m * cellWidth, n * cellHeight, mazeContext);
        drawLine(0, n * cellHeight, (m - 1) * cellWidth, n * cellHeight, mazeContext);
    }

    // Draw the walls
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            drawCellWalls([i, j]);
        }
    }

    mazeContext.lineWidth = 1;
}

function drawCounters() {
    // Draw the solution and random counters to the maze

    mazeContext.lineWidth = 5;

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

    mazeContext.lineWidth = 1;
}

function drawCircle(x, y, radius, fillStyle, strokeStyle) {
    // Draw a circle of radius `radius` centred on point (`x`, `y`)

    mazeContext.beginPath();
    mazeContext.arc(x, y, radius, 0, 2 * Math.PI, false);
    mazeContext.fillStyle = fillStyle;
    mazeContext.fill();
    mazeContext.strokeStyle = strokeStyle;
    mazeContext.stroke();
}

function drawEnd() {
    // Draw the start and end points as specially coloured circles

    mazeContext.lineWidth = 5;

    drawCircle((end[0] + 0.5) * cellWidth, (end[1] + 0.5) * cellHeight,
            circleRad, END_FILL_COLOUR, END_STROKE_COLOUR);

    mazeContext.lineWidth = 1;
}

function drawCellWalls(cell) {
    // Draws all existing walls around the cell at position `cell` of `maze`

    var cellval = maze[cell[0]][cell[1]];

    if (cellval & 1) {  // Left wall present
        drawLine(cell[0] * cellWidth, cell[1] * cellHeight,
                 cell[0] * cellWidth, (cell[1] + 1) * cellHeight,
                 mazeContext);
    }

    if (cellval & 2) { // Bottom wall present
        drawLine(cell[0] * cellWidth, (cell[1] + 1) * cellHeight,
                 (cell[0] + 1) * cellWidth, (cell[1] + 1) * cellHeight,
                 mazeContext);
    }

    if (cellval & 4) { // Right wall present
        drawLine((cell[0] + 1) * cellWidth, cell[1] * cellHeight,
                 (cell[0] + 1) * cellWidth, (cell[1] + 1) * cellHeight,
                 mazeContext);
    }

    if (cellval & 8) { // Top wall present
        drawLine(cell[0] * cellWidth, cell[1] * cellHeight,
                 (cell[0] + 1) * cellWidth, cell[1] * cellHeight,
                 mazeContext);
    }
}

function drawLine(startX, startY, endX, endY, context) {
    // Draws a line from point startPos = [startPosX, startPosY] to
    // endPos = [endPosX, endPosY] using context `context`

    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
}

function drawRect(x, y, width, height, context, fillStyle, strokeStyle) {
    // Draw a rectangle on specified context

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

    menuContext.globalAlpha = 0.2;

    drawRect(0, 0,
             menuCanvas.width, 0.25 * menuCanvas.height,
             menuContext,
             UP_COLOUR, UP_COLOUR);
    drawRect(0, 0.75 * menuCanvas.height,
             menuCanvas.width, 0.25 * menuCanvas.height,
             menuContext,
             DOWN_COLOUR, DOWN_COLOUR);
    drawRect(0, 0.25 * menuCanvas.height,
             0.5 * menuCanvas.width, 0.5 * menuCanvas.height,
             menuContext,
             LEFT_COLOUR, LEFT_COLOUR);
    drawRect(0.5 * menuCanvas.width, 0.25 * menuCanvas.height,
             0.5 * menuCanvas.width, 0.5 * menuCanvas.height,
             menuContext,
             RIGHT_COLOUR, RIGHT_COLOUR);

    menuContext.globalAlpha = 1;
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

    mazeContext.beginPath();
    mazeContext.rect(newTopLeftX, newTopLeftY, playerWidth, playerHeight);
    mazeContext.closePath();
    mazeContext.fillStyle = PLAYER_COLOUR;
    mazeContext.fill();
    mazeContext.lineWidth = 5;
    mazeContext.strokeStyle = PLAYER_TRIM_COLOUR;
    mazeContext.stroke();
    mazeContext.lineWidth = 1;
}

function drawStartMessage() {
    menuContext.font = "40px Arial";
    menuContext.lineWidth = 5;

    if (touchCapable) {
        drawRect(0.5 * menuCanvas.width - 350, 0.5 * menuCanvas.height - 50,
                 700, 140,
                 menuContext,
                 MESSAGE_FILL_COLOUR, MESSAGE_STROKE_COLOUR);
        menuContext.fillStyle = MESSAGE_STROKE_COLOUR;
        menuContext.fillText("Touch the top, left, right and bottom",
                         0.5 * menuCanvas.width, 0.5 * menuCanvas.height);
        menuContext.fillText("sections of the screen to move",
                         0.5 * menuCanvas.width, 0.5 * menuCanvas.height + 40);
    } else {
        drawRect(0.5 * menuCanvas.width - 300, 0.5 * menuCanvas.height - 50,
                 600, 100,
                 menuContext,
                 MESSAGE_FILL_COLOUR, MESSAGE_STROKE_COLOUR);
        menuContext.fillStyle = MESSAGE_STROKE_COLOUR;
        menuContext.fillText("Use WASD to navigate the maze",
                         0.5 * menuCanvas.width, 0.5 * menuCanvas.height);
    }

    drawIcon();
}

function drawWinMessage() {
    menuContext.lineWidth = 5;

    drawRect(0.5 * menuCanvas.width - 350, 0.5 * menuCanvas.height - 50,
             700, 225,
             menuContext,
             RANDOM_FILL_COLOUR, RANDOM_STROKE_COLOUR);
    menuContext.font = "60px Arial";
    menuContext.fillStyle = RANDOM_STROKE_COLOUR;
    menuContext.fillText("Congratulations!",
                     0.5 * menuCanvas.width, 0.5 * menuCanvas.height);
    menuContext.font = "40px Arial";
    menuContext.fillText("You finished with " + timeLeft + " seconds to spare.",
                         0.5 * menuCanvas.width, 0.5 * menuCanvas.height + 75);

    if (touchCapable) {
        menuContext.fillText("Touch the screen to play again.",
                             0.5 * menuCanvas.width,
                             0.5 * menuCanvas.height + 125);
    } else {
        menuContext.fillText("Press 'Enter' to play again.",
                             0.5 * menuCanvas.width,
                             0.5 * menuCanvas.height + 125);
    }

    drawIcon();
    blurMaze();
}

function drawLostMessage() {
    menuContext.lineWidth = 5;

    drawRect(0.5 * menuCanvas.width - 300, 0.5 * menuCanvas.height - 60,
             600, 200,
             menuContext,
             DANGER_FILL_COLOUR, DANGER_STROKE_COLOUR);
    menuContext.font = "60px Arial";
    menuContext.fillStyle = DANGER_STROKE_COLOUR;
    menuContext.fillText("Time's up!",
                         0.5 * menuCanvas.width,
                         0.5 * menuCanvas.height);
    menuContext.font = "40px Arial";

    if (touchCapable) {
        menuContext.fillText("Touch the screen to play again",
                             0.5 * menuCanvas.width,
                             0.5 * menuCanvas.height + 75);
    } else {
        menuContext.fillText("Press 'Enter' to play again",
                             0.5 * menuCanvas.width,
                             0.5 * menuCanvas.height + 75);
    }

    drawIcon();
    blurMaze();
}

function drawCounterTallies() {
    // Draws box stating number of counters picked up

    menuContext.lineWidth = 5;

    if (timeLeft <= 0) {
        menuContext.globalAlpha = 1;
    } else if (solutionCounter != solutionTotal) {
        menuContext.globalAlpha = 0.25;
    } else {
        menuContext.globalAlpha = 0.75;
    }

    drawRect(menuCanvas.width - BOX_OFFSET_X, BOX_OFFSET_Y,
             BOX_WIDTH, BOX_HEIGHT,
             menuContext,
             SOLUTION_FILL_COLOUR, SOLUTION_STROKE_COLOUR);
    menuContext.font = "50px Arial";
    menuContext.fillStyle = SOLUTION_STROKE_COLOUR;
    menuContext.fillText(solutionCounter + " / " + solutionTotal,
                         menuCanvas.width - BOX_OFFSET_X + 0.5 * BOX_WIDTH,
                         BOX_OFFSET_Y + 0.5 * BOX_HEIGHT);

    menuContext.globalAlpha = 1;

    if (timeLeft <= 0) {
        menuContext.globalAlpha = 1;
    } else if (randomCounter != randomTotal) {
        menuContext.globalAlpha = 0.25;
    } else {
        menuContext.globalAlpha = 0.75;
    }

    drawRect(menuCanvas.width - BOX_OFFSET_X, BOX_HEIGHT + 2 * BOX_OFFSET_Y,
             BOX_WIDTH, BOX_HEIGHT,
             menuContext,
             RANDOM_FILL_COLOUR, RANDOM_STROKE_COLOUR);
    menuContext.fillStyle = RANDOM_STROKE_COLOUR;
    menuContext.fillText(randomCounter + " / " + randomTotal,
                         menuCanvas.width - BOX_OFFSET_X + 0.5 * BOX_WIDTH,
                         2 * BOX_OFFSET_Y + 1.5 * BOX_HEIGHT);

    menuContext.globalAlpha = 1;
}

function drawTimer(time) {
    // Draws a timer displaying time

    menuContext.font = "50px Arial";
    menuContext.lineWidth = 5;
    menuContext.globalAlpha = 1;

    if (time <= 10 && time > 5) {
        menuContext.fillStyle = WARNING_FILL_COLOUR;
        menuContext.strokeStyle = WARNING_STROKE_COLOUR;
        menuContext.globalAlpha = 0.5;
    } else if (time <= 5) {
        menuContext.fillStyle = DANGER_FILL_COLOUR;
        menuContext.strokeStyle = DANGER_STROKE_COLOUR;
        menuContext.globalAlpha = 0.75;
    } else {
        menuContext.fillStyle = TIMER_FILL_COLOUR;
        menuContext.strokeStyle = TIMER_STROKE_COLOUR;
        menuContext.globalAlpha = 0.25;
    }

    if (hasWon || hasLost) {
        menuContext.globalAlpha = 1;
    }

    var minutesLeft = Math.floor(time / 60).toString();
    var secondsLeft = (time - minutesLeft * 60).toString();

    if (secondsLeft.length === 1) {
        secondsLeft = "0" + secondsLeft;
    }

    drawRect(menuCanvas.width - BOX_OFFSET_X,
             2 * BOX_HEIGHT + 3 * BOX_OFFSET_Y,
             BOX_WIDTH, BOX_HEIGHT,
             menuContext);

    menuContext.fillStyle = menuContext.strokeStyle;

    menuContext.fillText(minutesLeft + ":" + secondsLeft,
                         menuCanvas.width - BOX_OFFSET_X + 0.5 * BOX_WIDTH,
                         3 * BOX_OFFSET_Y + 2.5 * BOX_HEIGHT);

    menuContext.globalAlpha = 1;

}

function blurMaze() {
    // Use CSS to blur the maze canvas, leaving messages etc. unblurred

    mazeCanvas.style.filter = mazeCanvas.style.webkitFilter = "blur(5px)";
}

function unblurMaze() {
    // Remove the blur on the maze

    mazeCanvas.style.filter = mazeCanvas.style.webkitFilter = "blur(0px)";
}

function drawAll(x, y) {
    // Redraws the whole maze, the controls and the player at position `x`, `y`

    clearCanvas();

    drawMaze();
    drawPlayer(x, y);
    drawPauseButton();

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

// ------------------------------------------
// In-game menu brought up by pressing escape
// ------------------------------------------

function checkEscape(evt) {
    // Check whether the user has brought up the in-game menu with Escape

    if (evt.keyCode === 27) {  // Escape button
        drawPauseMenu();
    }
}

function drawPauseMenu() {
    // Draws the in-game menu brought up when player presses escape

    // Remove the pause event listeners
    window.removeEventListener("keydown", checkEscape, false);
    window.removeEventListener("click", checkPauseClick, false);
    window.removeEventListener("touchstart", checkPauseTouch, false);

    // Remove the movement event listeners
    window.removeEventListener("keydown", movePlayerKeyboard, false);
    window.removeEventListener("keydown", drawPauseMenu, false);
    window.removeEventListener("touchstart", movePlayerTouch, false);
    window.removeEventListener("resize", resizeMaze, false);

    clearInterval(timerInterval);

    clearCanvas();

    drawMaze();
    drawPlayer(playerPosX, playerPosY);
    blurMaze();
    drawIcon();

    if (touchCapable) {
        drawTouchControls();
    }

    menuContext.font = "60px Arial";
    menuContext.fillStyle = "black";
    menuContext.strokeStyle = "black";
    menuContext.fillText("PAUSED",
                         0.5 * menuCanvas.width,
                         0.25 * menuCanvas.height);

    // Menu option sizes
    menuBoxWidth = 0.5 * menuCanvas.width;
    menuBoxHeight = 0.2 * menuCanvas.height - 10;

    // Draw the menu option boxes
    menuContTopLeftX = 0.5 * (menuCanvas.width - menuBoxWidth);
    menuContTopLeftY = 0.4 * menuCanvas.height - 0.5 * menuBoxHeight;
    drawRect(menuContTopLeftX, menuContTopLeftY,
             menuBoxWidth, menuBoxHeight,
             menuContext,
             RANDOM_FILL_COLOUR, "black");

    menuRestartTopLeftX = 0.5 * (menuCanvas.width - menuBoxWidth);
    menuRestartTopLeftY = 0.6 * menuCanvas.height - 0.5 * menuBoxHeight;
    drawRect(menuRestartTopLeftX, menuRestartTopLeftY,
             menuBoxWidth, menuBoxHeight,
             menuContext,
             MESSAGE_FILL_COLOUR, "black");

    menuQuitTopLeftX = 0.5 * (menuCanvas.width - menuBoxWidth);
    menuQuitTopLeftY = 0.8 * menuCanvas.height - 0.5 * menuBoxHeight;
    drawRect(menuQuitTopLeftX, menuQuitTopLeftY,
             menuBoxWidth, menuBoxHeight,
             menuContext,
             PLAYER_COLOUR, "black");

    menuContext.fillStyle = "black";
    menuContext.fillText("(C)ontinue",
                         0.5 * menuCanvas.width,
                         0.4 * menuCanvas.height);
    menuContext.fillText("(R)estart",
                         0.5 * menuCanvas.width,
                         0.6 * menuCanvas.height)
    menuContext.fillText("(Q)uit",
                         0.5 * menuCanvas.width,
                         0.8 * menuCanvas.height);

    // Add menu event listeners
    window.addEventListener("keydown", pauseMenuKeyboardSelection, false);
    window.addEventListener("click", pauseMenuMouseSelection, false);
    window.addEventListener("touchstart", pauseMenuTouchSelection, false);

    // Canvas resize event listener
    window.addEventListener("resize", resizePauseMenu, false);
}

function pauseMenuKeyboardSelection(evt) {
    // Check whether player is selecting something from pause menu

    switch (evt.keyCode) {
        case 67:  // `c` for continue
        case 27:  // Escape also unpauses
            resumeGame();
            break;
        case 82:  // `r` for restart
            restartCurrentGame();
            break;
        case 81:  // `q` for quit
            quitGame();
            break;
    }
}

function pauseMenuMouseSelection(evt) {
    // Check for clicking inside the continue, restart and quit boxes in the
    // in-game menu

    var clickX = evt.pageX;
    var clickY = evt.pageY;

    pauseMenuCheckPos(clickX, clickY);
}

function pauseMenuTouchSelection(evt) {
    // Check for touching one of the continue, restart and quit boxes in the
    // in-game menu

    // We want to record only individual touches
    evt.preventDefault();

    var touchX = evt.targetTouches[0].pageX;
    var touchY = evt.targetTouches[0].pageY;

    pauseMenuCheckPos(touchX, touchY);
}

function pauseMenuCheckPos(x, y) {
    // Check whether position (`x`,`y`) is within any option boxes

    if (x >= menuContTopLeftX && x <= menuContTopLeftX + menuBoxWidth &&
        y >= menuContTopLeftY && y <= menuContTopLeftY + menuBoxHeight) {
        resumeGame();
    }

    if (x >= menuRestartTopLeftX && x <= menuRestartTopLeftX + menuBoxWidth &&
        y >= menuRestartTopLeftY && y <= menuRestartTopLeftY + menuBoxHeight) {
        restartCurrentGame();
    }

    if (x >= menuQuitTopLeftX && x <= menuQuitTopLeftX + menuBoxWidth &&
        y >= menuQuitTopLeftY && y <= menuQuitTopLeftY + menuBoxHeight) {
        quitGame();
    }
}

function checkPauseClick(evt) {
    // Check whether the player has clicked the pause button

    var clickX = evt.pageX;
    var clickY = evt.pageY;

    checkPauseButton(clickX, clickY);
}

function checkPauseTouch(evt) {
    // Check whether the player has touched the pause button

    var touchX = evt.targetTouches[0].pageX;
    var touchY = evt.targetTouches[0].pageY;

    checkPauseButton(touchX, touchY);
}

function checkPauseButton(x, y) {
    // Check whether point (`x`,`y`) is within the pause button

    if (x >= PAUSE_OFFSET_X &&
        x <= PAUSE_OFFSET_X + BOX_WIDTH &&
        y >= menuCanvas.height - PAUSE_OFFSET_Y - BOX_HEIGHT &&
        y <= menuCanvas.height - PAUSE_OFFSET_Y) {
        drawPauseMenu();
    }
}

function resumeGame() {
    // Resume the game where the player left off
    unblurMaze();

    // Continue the timer from where it was if game is in progress
    if (hasStarted && !hasLost && !hasWon) {
        createTimer(timeLeft);
    }

    drawAll(playerPosX, playerPosY);

    // Remove the menu event listeners
    window.removeEventListener("keydown", pauseMenuKeyboardSelection, false);
    window.removeEventListener("click", pauseMenuMouseSelection, false);
    window.removeEventListener("touchstart", pauseMenuTouchSelection, false);

    window.removeEventListener("resize", resizePauseMenu);

    // Add back the normal game event listeners
    window.addEventListener("keydown", movePlayerKeyboard, false);
    window.addEventListener("touchstart", movePlayerTouch, false);

    window.addEventListener("keydown", checkEscape, false);
    window.addEventListener("click", checkPauseClick, false);
    window.addEventListener("touchstart", checkPauseTouch, false);

    window.addEventListener("resize", resizeMaze, false);
}

function restartCurrentGame() {
    // Keep the current maze, but restart the game, replacing all counters

    unblurMaze();

    // Reset game variables
    playerPosX = playerPosY = 0;
    hasStarted = hasWon = hasLost = false;
    randomCounter = solutionCounter = 0;
    timeLeft = INITIAL_TIME;

    // Replace all the collected counters
    removeCounters();
    placeCounters();

    drawAll(playerPosX, playerPosY);

    // Remove the menu event listeners
    window.removeEventListener("keydown", pauseMenuKeyboardSelection, false);
    window.removeEventListener("click", pauseMenuMouseSelection, false);
    window.removeEventListener("touchstart", pauseMenuTouchSelection, false);
    window.removeEventListener("resize", resizePauseMenu);

    // Add back the normal game event listeners
    window.addEventListener("keydown", movePlayerKeyboard, false);
    window.addEventListener("touchstart", movePlayerTouch, false);

    window.addEventListener("keydown", checkEscape, false);
    window.addEventListener("click", checkPauseClick, false);
    window.addEventListener("touchstart", checkPauseTouch, false);

    window.addEventListener("resize", resizeMaze, false);
}

function quitGame() {
    // Quit the current game and return to the main menu screen

    unblurMaze();

    // Redraw the main menu, exiting the current game
    drawMenu();

    // Remove the menu event listeners
    window.removeEventListener("keydown", pauseMenuKeyboardSelection, false);
    window.removeEventListener("click", pauseMenuMouseSelection, false);
    window.removeEventListener("touchstart", pauseMenuTouchSelection, false);
    window.removeEventListener("resize", resizePauseMenu);
}

function drawPauseButton() {
    // Draws a small pause button in bottom left for cilcking/touching in
    // place of Escape key

    menuContext.globalAlpha = 0.5;

    menuContext.fillStyle = END_FILL_COLOUR;
    menuContext.strokeStyle = END_STROKE_COLOUR;
    menuContext.lineWidth = 5;

    drawRect(PAUSE_OFFSET_X,
             menuCanvas.height - BOX_HEIGHT - PAUSE_OFFSET_Y,
             BOX_WIDTH,
             BOX_HEIGHT,
             menuContext,
             END_FILL_COLOUR, END_STROKE_COLOUR);

    menuContext.lineWidth = 10;
    drawLine(PAUSE_OFFSET_X + 0.33 * BOX_WIDTH,
             menuCanvas.height - PAUSE_OFFSET_Y - 0.75 * BOX_HEIGHT,
             PAUSE_OFFSET_X + 0.33 * BOX_WIDTH,
             menuCanvas.height - PAUSE_OFFSET_Y - 0.25 * BOX_HEIGHT,
             menuContext);
    drawLine(PAUSE_OFFSET_X + 0.66 * BOX_WIDTH,
             menuCanvas.height - PAUSE_OFFSET_Y - 0.75 * BOX_HEIGHT,
             PAUSE_OFFSET_X + 0.66 * BOX_WIDTH,
             menuCanvas.height - PAUSE_OFFSET_Y - 0.25 * BOX_HEIGHT,
             menuContext);
    menuContext.lineWidth = 1;

    menuContext.globalAlpha = 1;
}

// ------------------------------
// Dynamic sesizability functions
// ------------------------------

function clearCanvas() {
    // Clears the canvas by setting canvas width and height

    mazeCanvas.width = mazeCanvas.width;
    mazeCanvas.height = mazeCanvas.height;

    menuCanvas.width = menuCanvas.width;
    menuCanvas.height = menuCanvas.height;

    menuContext.textAlign = mazeContext.textAlign = "center";
    menuContext.textBaseline = mazeContext.textBaseline = "middle";
}

function resizeMenu() {
    // Changes canvas size to be equal to window size

    menuCanvas.width = mazeCanvas.width = canvasDiv.clientWidth - 20;
    menuCanvas.height = mazeCanvas.height = canvasDiv.clientHeight - 20;

    menuContext.textAlign = mazeContext.textAlign = "center";
    menuContext.textBaseline = mazeContext.textBaseline = "middle";

    cellWidth = mazeCanvas.width / m;
    cellHeight = mazeCanvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    drawMenu(playerPosX, playerPosY);
}

function resizePauseMenu() {
    // Dynamically resize the escape menu

    menuCanvas.width = mazeCanvas.width = canvasDiv.clientWidth - 20;
    menuCanvas.height = mazeCanvas.height = canvasDiv.clientHeight - 20;

    menuContext.textAlign = mazeContext.textAlign = "center";
    menuContext.textBaseline = mazeContext.textBaseline = "middle";

    cellWidth = mazeCanvas.width / m;
    cellHeight = mazeCanvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    drawPauseMenu();
}

function resizeMaze() {
    // Changes canvas size to be equal to window size

    menuCanvas.width = mazeCanvas.width = canvasDiv.clientWidth - 20;
    menuCanvas.height = mazeCanvas.height = canvasDiv.clientHeight - 20;

    menuContext.textAlign = mazeContext.textAlign = "center";
    menuContext.textBaseline = mazeContext.textBaseline = "middle";

    cellWidth = mazeCanvas.width / m;
    cellHeight = mazeCanvas.height / n;
    playerWidth = 0.85 * cellWidth;
    playerHeight = 0.85 * cellHeight;
    circleRad = cellWidth >= cellHeight ? 0.2 * cellHeight : 0.2 * cellWidth;

    drawAll(playerPosX, playerPosY);
}
