
function loadElement(tag) {
    var element = document.querySelector("#" + tag);
    if (!element) {
        throw new Error('Unable to find element with id: ' + tag);
    }
    return element;
}

export class Manager {
    constructor(bufferNode) {
        this.mouseX = 0;
        this.mouseY = 0;

        this.canvas = loadElement("c1");
        this.canvas.addEventListener('mousemove', this.setMousePosition.bind(this));
        this.rect = this.canvas.getBoundingClientRect();
        this.canvasWidth = loadElement("canvasWidth")
        this.canvasHeight = loadElement("canvasHeight")
        this.canvasWidth.addEventListener("change", this.resizeCanvas.bind(this));
        this.canvasHeight.addEventListener("change", this.resizeCanvas.bind(this));
        this.resizeCanvas();

        this.source = loadElement("codeInput");
        var future = fetch('./default.glsl')
            .then(response => response.text())
            .then(data => {
                this.source.value = data;
            })
            .catch(error => {
                console.error('Error loading file:', error);
            });
        Promise.all([future])
        this.runButton = loadElement("runButton");
        this.runButton.addEventListener("click", this.compileShader.bind(this));

        this.bufferNode = bufferNode;
    }

    resizeCanvas() {
        this.canvas.width = this.canvasWidth.value;
        this.canvas.height = this.canvasHeight.value;
        this.rect = this.canvas.getBoundingClientRect();
    }
    setMousePosition(e) {
        this.mouseX = e.clientX - this.rect.left;
        this.mouseY = this.rect.height - (e.clientY - this.rect.top) - 1;  // bottom is 0 in WebGL
    }
    compileShader() {
        var source = loadElement("codeInput");
        var image = loadElement("fractal");
        this.bufferNode.compileShader(source.value, image);
        this.bufferNode.render({ iMousex: this.mouseX, iMousey: this.mouseY, iTime: 0 });
        console.log("Compiling Successful!");
    }
    run(time) {
        this.bufferNode.render({ iMousex: this.mouseX, iMousey: this.mouseY, iTime: time });
        requestAnimationFrame(this.run.bind(this));
    }
}