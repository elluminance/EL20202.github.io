const textsrc = document.getElementById("text-input")
const maincanvas = document.getElementById("main-canvas");
//const smallFontimg = new Image();
//smallFont.src="hall-fetica-small.png"

function getRadioValue(name) {
    for (let elem of document.querySelectorAll(`input[name=${name}]`)) {
        if (elem.checked) {
            return elem.value
        }
    }
}

function getNumericValue(name) {
    return document.getElementById(name).valueAsNumber
}

function getCheckboxValue(name) {
    return document.getElementById(name).checked
}

const fontstart = 32;
const fontColors = [
    "#ffffff",
    "#ff6969",
    "#65ff89",
    "#ffe430",
    "#808080"
]

const fontUtilsColors = [
    ...fontColors,
    "#ff8932",
    "#5fc3fc",
    "#2334ed",
    "#fc76b0",
    "#0ffcc5",
    "#8efc20",
    "#e502dd",
    "#89b73e",
    "#900090",
    "#814914",
    "#ffa100",
    "#a70000"
]
const fontUtilNameMapping = {
    "white": 0,
    "red": 1,
    "green": 2,
    "yellow": 3,
    "gray": 4,
    "grey": 4,
    "orange": 5,
    "purple": 6,
    "blue": 7,
    "dark_blue": 8,
    "dark-blue": 8,
    "pink": 9,
    "teal": 10,
    "lime": 11,
    "fuchsia": 12,
    "olive": 13,
    "violet": 14,
    "brown": 15,
    "gold": 16,
    "dark_red": 17,
    "dark-red": 17
}

let fontColorArray = fontColors;
let allowArbitraryColors = false;
let fontUtilsNamedColors = false;
function adjustSize() {
    maincanvas.width = getNumericValue("sizeX");
    maincanvas.height = getNumericValue("sizeY");
    rendertext();
}


function updateData() {
    fontColorArray = getCheckboxValue("fontUtilsColor") ? fontUtilsColors : fontColors;
    allowArbitraryColors = getCheckboxValue("arbitraryColor");
    fontUtilsNamedColors = getCheckboxValue("fontUtilsColor");
    rendertext();
}

for (let element of document.querySelectorAll("input.updateOnChange")) {
    element.addEventListener("change", updateData);
}

/**
 * @param {string} text 
 * @param {number} startIndex  
 * @returns {[index, string | null]} 
 */
function processBracketedTextCommand(text, startIndex) {
    let index = text.indexOf("]", startIndex);
    let value = null;
    if(index != -1) {
        value = text.substring(startIndex, index);
    }
    return [index, value];
}

class Font {
    #img = new Image();
    #charWidths = [];
    //#charDrawWidths = [];
    #charStartX = [];
    #charStartY = [];
    #charHeight = 0;
    #canvas;
    #whiteColor = "#ffffff"

    constructor(src, height, whiteColor = "#ffffff") {
        this.#charHeight = height;
        this.#img.src = src;
        this.#img.onload = this.prepareFont.bind(this);
        this.#whiteColor = whiteColor;
    }

    prepareFont() {
        this.#canvas = document.createElement('canvas');
        /**@type {CanvasRenderingContext2D}*/
        let context = this.#canvas.getContext('2d');
        let img = this.#img;
        this.#canvas.width = img.width;
        this.#canvas.height = img.height;
        context.drawImage(img, 0, 0 );
        let myData = context.getImageData(0, 0, img.width, img.height);

        /**@type {Uint8ClampedArray}*/
        let dataArray = myData.data;
        
        let charCode = fontstart;
        //go to the row of each "bar" of the font
        for(let y = this.#charHeight; y < myData.height; y += this.#charHeight + 1) {
            let characterMode = false;
            let charWidth = 0;

            for(let x = 0; x < myData.width; x++) {
                let coord = (y * img.width + x) * 4;
                let a = dataArray[coord+3];

                // the pixel's alpha is nonzero aka not transparent
                if(a !== 0) {
                    // and we've already found a character
                    if(characterMode) {
                        charWidth++;
                    //or we just found the start of the next
                    } else {
                        this.#charStartX[charCode] = x;
                        this.#charStartY[charCode] = y-this.#charHeight;
                        characterMode = true;
                        charWidth = 1;
                    }
                //the pixel is transparent and we were working on a character
                } else if (characterMode) {
                    characterMode = false;
                    this.#charWidths[charCode] = charWidth+1;
                    charCode++;
                }
            }
        }

        rendertext();
    }

    /** 
     * @param {CanvasRenderingContext2D} context 
     * @param {string} text 
     */
    drawText(mainContext, text, width, height) {
        let mainY = 0;
        const charHeight = this.#charHeight;
        /** @type {HTMLCanvasElement} */
        let canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = charHeight;
        let context = canvas.getContext('2d');
        
        let color = "#ffffff";

        let textAlign = getRadioValue("textAlign");
        let scalefactor = getCheckboxValue("doublescale") ? 2 : 1;

        function drawLine() {
            let drawX = 0, textwidth = Math.min(x * scalefactor, maincanvas.width);
            switch (textAlign) {
                case "LEFT":
                    drawX = 0;
                    break;
                case "CENTER":
                    drawX = Math.floor((width - textwidth)/2);
                    break;
                case "RIGHT":
                    drawX = width - textwidth;
                    break;
            }
            mainContext.imageSmoothingEnabled = false;
            mainContext.drawImage(canvas, drawX, mainY, canvas.width * scalefactor, canvas.height * scalefactor);
            mainY += charHeight * scalefactor;
            context.clearRect(0, 0, 1024, charHeight);
        }
        
        let x = 0;
        for(let i = 0; i < text.length; i++) {
            let charcode = text.charCodeAt(i);
            if(text[i] == '\n') {
                drawLine();
                x = 0;
            //ensure character is actually drawable
            } else if(charcode in this.#charWidths) {
                //handle important text commands
                if(text[i] == "\\") {
                    switch(text[i+1]) {
                        case "\\":
                            i++;
                            break;
                        case "c":
                            if(text[i+2] == "[") {
                                let [j, colorcode] = processBracketedTextCommand(text, i+3);
                                color = fontColorArray[colorcode]
                                if(color) {
                                    i = j;
                                    continue;
                                } else if(allowArbitraryColors && colorcode?.match(/^#[0-9a-fA-F]{6}$/)){
                                    color = colorcode;
                                    i = j;
                                    continue;
                                } else {
                                    color = fontColors[0];
                                }
                            }
                            break;
                        case "C":
                            if(!fontUtilsNamedColors || text[i+2] == "[") {
                                let [j, colorcode] = processBracketedTextCommand(text, i+3);
                                color = fontColorArray[fontUtilNameMapping[colorcode]];
                                if(color) {
                                    i = j;
                                    continue;
                                } else {
                                    color = this.#whiteColor;
                                }
                            }
                            break;
                    }
                }
                let w = this.#charWidths[charcode];
                let h = this.#charHeight;
                //draw the character once
                context.drawImage(
                    this.#img, 
                    this.#charStartX[charcode], this.#charStartY[charcode],
                    w, h,
                    x, 0,
                    w, h
                );
                context.globalCompositeOperation = "source-atop";
                //now, fill in the chararacter with color
                context.fillStyle = color;
                context.fillRect(x,0,w,h);
                context.globalCompositeOperation = "multiply";
                //now, draw over the color with the character to properly colorize the character
                context.drawImage(
                    this.#img,
                    this.#charStartX[charcode], this.#charStartY[charcode],
                    w, h,
                    x, 0,
                    w, h
                );
                context.globalCompositeOperation = "source-over";
                x += this.#charWidths[charcode];
            }
        }
        //draw the last line to make sure it's rendered.
        drawLine();
    }
}

const smallfont = new Font("hall-fetica-small.png", 13);
const normalfont = new Font("hall-fetica-bold.png", 16);

function rendertext() {
    /**@type {string} */
    let text = textsrc.value;
    
    /** @type {CanvasRenderingContext2D} */
    let context = maincanvas.getContext('2d');

    context.clearRect(0, 0, maincanvas.width, maincanvas.height)
    let font = normalfont;
    switch(getRadioValue("fontSize")) {
        case "NORMAL":
            font = normalfont;
            break;
        case "SMALL":
            font = smallfont;
            break;
    }

    font.drawText(context, text, maincanvas.width, maincanvas.height);   

}

function saveToFile() {
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = maincanvas.toDataURL();
    link.click();
}

function adjustBgColor() {
    maincanvas.style.backgroundColor = document.getElementById("bgColor").value
}


function textBoxChanged() {
    if(getCheckboxValue("autoUpdateText")) {
        rendertext();
    }
}
textsrc.addEventListener("input", textBoxChanged)

adjustSize();
updateData();
adjustBgColor();