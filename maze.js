// Author: Drew Silcock
// TODO:
// * Consider removing altogether the byte for backtrack information
// * Implement a maze solver that marks the solution path
// * Change drawing so that playerWidth and playerHeight are different
// * Make the canvas always fill the screen and adjust variables accordingly

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 20;

var m = 10, n = 10;

var cellWidth = canvas.width / m;
var cellHeight = canvas.height / n;
var playerWidth = 0.9 * cellWidth;
var playerHeight = 0.9 * cellHeight;

var maze = createArray(m, n);

var playerPosX = 0;
var playerPosY = 0;

var start = [0, 0];
var end = [m - 1, n - 1];

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

    currentCell = [getRandomInt(0, m - 1), getRandomInt(0, n - 1)];

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

    // Push the final end tile onto the stack
    cellStack.push(currentCell);

    // Mark all cells in the stack as solution
    for (var i = 0; i < cellStack.length; i++) {
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

function drawMaze() {
    // Draw the produced maze to the canvas

    makeWhite(0, 0, canvas.width, canvas.height);

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
}

function drawSolution() {
    // Draw the solution to the maze

    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            if (maze[i][j] & 256) {
                highlightCell([i,j], "#FF0000");
            }
        }
    }
}

function highlightCell(cell, style) {
    // Highlight `cell` with `style`

    context.beginPath();
    context.rect((cell[0] + 0.1) * cellWidth, (cell[1] + 0.1) * cellHeight,
            cellWidth * 0.8, cellHeight * 0.8);
    context.closePath();
    context.fillStyle = style;
    context.fill();
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

function drawLine(startPos, endPos, style) {
    // Draws a line from point startPos = [startPosX, startPosY] to
    // endPos = [endPosX, endPosY]

    context.beginPath();
    context.moveTo(startPos[0], startPos[1]);
    context.lineTo(endPos[0], endPos[1]);
    context.strokeStyle = style;
    context.stroke();
    context.strokeStyle = "black";
}

function makeWhite(x, y, width, height) {
    context.beginPath();
    context.rect(x, y, width, height);
    context.closePath();
    context.fillStyle = "white";
    context.fill();
}

function drawPlayer(x, y, style) {
    // Draw the object representing the player, currently a square.
    // Note that a reduced cell is cleared to avoid erasing the walls.
    // The annoying factors of 0.52 and 1.04 are simply to correct for tiny
    // errors in multiplication

    currTopLeftX = (playerPosX + 0.5) * cellWidth - 0.53 * playerWidth;
    currTopLeftY = (playerPosY + 0.5) * cellHeight - 0.53 * playerHeight;

    makeWhite(currTopLeftX, currTopLeftY,
            playerWidth * 1.06, playerHeight * 1.06);

    playerPosX = x;
    playerPosY = y;

    newTopLeftX = (x + 0.5) * cellWidth - 0.5 * playerWidth;
    newTopLeftY = (y + 0.5) * cellHeight - 0.5 * playerHeight;

    context.beginPath();
    context.rect(newTopLeftX, newTopLeftY, playerWidth, playerHeight);
    context.closePath();
    context.fillStyle = style;
    context.fill();
}

function movePlayer(evt) {
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

    if (canMove) {  // Can move
        drawPlayer(newX, newY, "#00FF00");
        playerPosX = newX;
        playerPosY = newY;
    }
    if (playerPosX === end[0] && playerPosY === end[1]) {  // Reached end point
        makeWhite(0, 0, canvas.width, canvas.height);
        context.font = "40px Arial";
        context.fillStyle = "blue";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("Congratulations!",
                canvas.width / 2, canvas.height / 2);
        window.removeEventListener("keydown", movePlayer, true);
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

// NOTE: Do I need to keep track of borders at all?
initialiseMaze();
setBorders();
buildMaze();
drawMaze();
solveMaze();
drawSolution();

drawPlayer(start[0], start[1], "#00FF00");

window.addEventListener("keydown", movePlayer, true);
