// Author: Drew Silcock
// TODO:
// * Should canvas objects be globals or not?

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

// --------------------------------------
// Useful function for creating 2D arrays
// --------------------------------------

function createArray(width, height) {
    // Creates an m by n array

    var array = [];
    var column = [];

    while (column.push(0) < height) {}
    while (array.push(column) < width) {}

    return arr;
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
        this.LEFT: this.RIGHT,
        this.RIGHT: this.LEFT,
        this.BOTTOM: this.TOP,
        this.TOP: this.BOTTOM
    }

    this.values = createArray(m, n);

    this.prototype.initialiseMaze();
}

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

var Maze.prototype.buildMaze = function() {
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

            knockDownWall(currentCell, neighbour);
            knockDownWall(newCell, this.opposite[neighbour]);

            cellStack.push(currentCell);
            currentCell = newCell;
            visitedCells++;
        }

    }
};

var Maze.prototype.removeCounters = function() {
    // Remove all current counters from the maze

    for (var i = 0; i < this.m; i++) {
        for (var j = 0; j < this.n; j++) {
            this.values[i][j] &= ~(this.SOLUTION + this.RANDOM);
        }
    }
};

var Maze.prototype.placeCounters = function() {
    // Place the random and solution counters on the maze

    this.prototype.placeSolutionCounters();
    this.prototype.placeRandomCounters();
};

var Maze.prototype.placeSolutionCounters = function() {
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

    // Reset solution total in case of game restart
    this.solutionTotal = 0;

    // Mark half the cells in the stack as solution
    for (var i = 0; i < cellStack.length; i += 2) {
        this.solutionTotal++;
        this.values[cellStack[i][0]][cellStack[i][1]] |= 16;
    }
};

var Maze.prototype.placeRandomCounters = function() {
    // Place random counters that the players needs to pick up throughout the
    // maze

    // One fifth as many random counters to pick up as solution counters
    this.randomTotal = Math.ceil(solutionTotal / 5);

    var i = 0, cell;
    while (i < randomTotal) {
        cell = getRandomCell();

        if (validRandomCounterCell(cell)) {
            maze[cell[0]][cell[1]] |= 32;
            i++;
        }
    }
};

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

// --------------------------------
// Controller for drawing to canvas
// --------------------------------

var Controller = function() {
    // Constructor for the object that controls drawing and moving the player

    // Dimensions of counter tally boxes
    this.BOX_WIDTH = 75;
    this.BOX_HEIGHT = 50;

    this.BOX_WIDTH = 160;
    this.BOX_HEIGHT = 100;

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
