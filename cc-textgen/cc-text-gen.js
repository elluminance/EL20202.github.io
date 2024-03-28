const textsrc = document.getElementById("text-input")
const maincanvas = document.getElementById("main-canvas");
//const smallFontimg = new Image();
//smallFont.src="hall-fetica-small.png"

const TEXT_ALIGN = {
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2
}

const fontstart = 32;
const fontColors = [
    "#ffffff",
    "#ff6969",
    "#65ff89",
    "#ffe430",
    "#808080"
]
class Font {
    #img = new Image();
    #charWidths = [];
    #charDrawWidths = [];
    #charStartX = [];
    #charStartY = [];
    #charHeight = 0;
    #canvas;

    constructor(src, height) {
        this.#charHeight = height;
        this.#img.src = src;
        this.#img.onload = this.prepareFont.bind(this); 
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
    }

    /** 
     * @param {CanvasRenderingContext2D} context 
     * @param {string} text 
     */
    drawText(mainContext, text, width, height, textAlign = TEXT_ALIGN.LEFT) {
        let mainY = 0;
        /** @type {HTMLCanvasElement} */
        let canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        let context = canvas.getContext('2d');
        
        let color = "#ffffff";
        const charHeight = this.#charHeight;
        function drawLine() {
            let drawX;
            switch (textAlign) {
                case TEXT_ALIGN.LEFT:
                    drawX = 0;
                    break;
                case TEXT_ALIGN.CENTER:
                    drawX = Math.floor((width - x)/2);
                    break;
                case TEXT_ALIGN.RIGHT:
                    drawX = width - x;
                    break;
            }
            mainContext.drawImage(canvas, drawX, mainY);
            mainY += charHeight;
            context.clearRect(0, 0, 1024, charHeight);
        }
        
        let x = 0;
        for(let i = 0; i < text.length; i++) {
            let charcode = text.charCodeAt(i);
            if(text[i] == '\n') {
                drawLine();
                x = 0;
            } else if(charcode >= fontstart) {
                if(text[i] == "\\") {
                    switch(text[i+1]) {
                        case "\\":
                            i++;
                            break;
                        case "c":
                            if(text[i+2] == "[") {
                                let j = text.indexOf("]", i+2);
                                if(j != -1) {
                                    let colorcode = text.substring(i+3,j);
                                    color = fontColors[colorcode]
                                    if(color) {
                                        i = j;
                                        continue;
                                    } else {
                                        color = fontColors[0];
                                    }
                                    
                                }
                            }
                            break;
                    }
                }
                let w = this.#charWidths[charcode];
                let h = this.#charHeight;
                context.drawImage(
                    this.#img, 
                    this.#charStartX[charcode], this.#charStartY[charcode],
                    w, h,
                    x, 0,
                    w, h
                );
                context.globalCompositeOperation = "source-atop";
                context.fillStyle = color;
                context.fillRect(x,0,w,h);
                context.globalCompositeOperation = "multiply";
                //i want to draw...
                context.drawImage(
                    //...from this image...
                    this.#img,
                    //...
                    this.#charStartX[charcode], this.#charStartY[charcode],
                    w, h,
                    x, 0,
                    w, h
                );
                context.globalCompositeOperation = "source-over";
                x += this.#charWidths[charcode];
                
            }
        }
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
    normalfont.drawText(context, text, maincanvas.width, maincanvas.height);    
}
