

export class BufferNode {
    /*
        BufferNode définit un rendu OpenGL dans le canvas principal
        Il prend en entrée des arguments qui provient de l'interface utilisateur
        comme la souris, le temps, et l'image à afficher
        Pour lire les valeurs de la souris, il faut ajouter un event listener
        sur le canvas
    */

    constructor(canvas) {
        this.gl = canvas.getContext("webgl");
        if (!this.gl) {
            throw new Error('Unable to initialize WebGL. Your browser may not support it.');
        }
        this.vertexShaderSource = 'attribute vec4 a_position;\n void main() {\n gl_Position = a_position;\n }';
        this.fragmentShaderSource = ``;
    }

    wrapFragmentShaderSource(source) {
        this.fragmentShaderSource = `precision mediump float;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iChannel0;
${source}`;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error('Unable to create shader.');
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        console.log(this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        throw new Error('Unable to getShaderParameter.');

    }

    createProgram(vertexShader, fragmentShader) {
        this.program = this.gl.createProgram();
        if (!this.program) {
            console.error('Unable to create program.');
            return null;
        }
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
        if (success) {
            return this.program;
        }

        // console.log(this.gl.getProgramInfoLog(this.program));
        this.gl.deleteProgram(this.program);
        return null;
    }

    createTextureFromImage(image) {
        // Create a texture.
        this.targetTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);

        // Configure texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        // Fill the texture with a 1x1 blue pixel.
        if (!image) {
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                new Uint8Array([255, 0, 255, 255]));
        }
        else {

            // Load image into texture
            image.onload = () => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
            };
            // Trigger the image load
            if (image.complete) {
                image.onload(); // Call directly if image is cached
            }
        }
    }

    // createFrameBuffer() {
    //     this.fb= this.gl.createFramebuffer();
    //     this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
    //     const attachmentPoint = gl.COLOR_ATTACHMENT0;
    //     gl.framebufferTexture2D(
    //         gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
    // }

    compileShader(source, image) {
        this.wrapFragmentShaderSource(source);
        // create GLSL shaders, upload the GLSL source, compile the shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        if (!vertexShader) {
            console.error('Unable to create vertex shader.');
            return;
        }
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        if (!fragmentShader) {
            console.error('Unable to create fragment shader.');
            return;
        }

        // Link the two shaders into a program
        this.program = this.createProgram(vertexShader, fragmentShader);
        if (!this.program) {
            console.error('Unable to create vertex shader.');
            return;
        }

        // look up where the vertex data needs to go.
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "iResolution");
        this.mouseLocation = this.gl.getUniformLocation(this.program, "iMouse");
        this.timeLocation = this.gl.getUniformLocation(this.program, "iTime");
        this.texture0Location = this.gl.getUniformLocation(this.program, "iChannel0");

        this.createTextureFromImage(image);
        // Create a buffer and put three 2d clip space points in it
        this.positionBuffer = this.gl.createBuffer();

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

        const positions = [
            -1, -1,  // first triangle
            1, -1,
            -1, 1,
            -1, 1,  // second triangle
            1, -1,
            1, 1,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        // code above this line is initialization code.
        // code below this line is rendering code.
    }

    render(param) {
        // Tell WebGL how to convert from clip space to pixels
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        // Clear the canvas
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        this.gl.useProgram(this.program);

        // Turn on the attribute
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.uniform2f(this.resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform2f(this.mouseLocation, param.iMousex, param.iMousey);
        this.gl.uniform1f(this.timeLocation, param.iTime * 0.001);
        this.gl.uniform1i(this.texture0Location, 0);
        // Bind the position buffer.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;          // 2 components per iteration
        const type = this.gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        this.gl.vertexAttribPointer(
            this.positionAttributeLocation, size, type, normalize, stride, offset);

        // draw
        const primitiveType = this.gl.TRIANGLES;
        const count = 6;
        this.gl.drawArrays(primitiveType, offset, count);
    }
}

