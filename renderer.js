let gl;
let shaderProgram;
let vertexBuffer, colorBuffer, normalBuffer, texCoordBuffer;
let indexBuffer, texturedIndexBuffer, nonTexturedIndexBuffer;
let uModelViewMatrix, uProjectionMatrix;
let allIndices = []; // <-- BUG FIX: Moved this to the global scope
let texturedIndices = []; // Indices for objects with textures
let nonTexturedIndices = []; // Indices for objects without textures
let checkerboardTexture;

let projectionMatrix = mat4.create();

let translate = [0, -0.8, -8];
let rotate = [0, 0, 0];
let scale = [1, 1, 1];

// Lighting properties (from material)
let lightPosition = [1.0, 1.0, 1.0, 0.0];
let lightAmbient = [0.2, 0.2, 0.2, 1.0];
let lightDiffuse = [1.0, 1.0, 1.0, 1.0];
let lightSpecular = [1.0, 1.0, 1.0, 1.0];

// Material properties (from material)
let materialAmbient = [1.0, 1.0, 1.0, 1.0];
let materialDiffuse = [1.0, 1.0, 1.0, 1.0];
let materialSpecular = [1.0, 1.0, 1.0, 1.0];
let materialShininess = 100.0;

// Lighting enabled flag
let lightingEnabled = true;

function initRenderer(canvas) {
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported!");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vs);
  gl.attachShader(shaderProgram, fs);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");

  // Get lighting uniform locations (from material)
  gl.lightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
  gl.ambientProductLoc = gl.getUniformLocation(
    shaderProgram,
    "uAmbientProduct"
  );
  gl.diffuseProductLoc = gl.getUniformLocation(
    shaderProgram,
    "uDiffuseProduct"
  );
  gl.specularProductLoc = gl.getUniformLocation(
    shaderProgram,
    "uSpecularProduct"
  );
  gl.shininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
  gl.lightingEnabledLoc = gl.getUniformLocation(
    shaderProgram,
    "uLightingEnabled"
  );
  gl.useTextureLoc = gl.getUniformLocation(shaderProgram, "uUseTexture");
  gl.textureMapLoc = gl.getUniformLocation(shaderProgram, "uTextureMap");

  initBuffers();
  createCheckerboardTexture(); // Create checkerboard texture
  updateLighting(); // Initialize lighting
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  requestAnimationFrame(render);
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function initBuffers() {
  const white = [1.0, 1.0, 1.0];
  const silver = [0.75, 0.75, 0.75];
  const darkGrey = [0.2, 0.2, 0.2];
  const wood = [0.8, 0.66, 0.53];
  const screenImgColor = [0.2, 0.2, 0.2];

  // Helper function to create quad with normals (from material)
  function quad(
    vertices,
    normals,
    colors,
    texCoords,
    indices,
    a,
    b,
    c,
    d,
    color,
    indexOffset,
    useTexture = false
  ) {
    // Calculate normal using cross product (from material)
    const t1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const t2 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];

    // Cross product for normal
    const normal = [
      t1[1] * t2[2] - t1[2] * t2[1],
      t1[2] * t2[0] - t1[0] * t2[2],
      t1[0] * t2[1] - t1[1] * t2[0],
    ];

    // Normalize
    const len = Math.sqrt(
      normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]
    );
    normal[0] /= len;
    normal[1] /= len;
    normal[2] /= len;

    // Add vertices
    vertices.push(...a, ...b, ...c, ...d);

    // Add normals (same for all 4 vertices)
    normals.push(...normal, ...normal, ...normal, ...normal);

    // Add colors
    colors.push(...color, ...color, ...color, ...color);

    // Add texture coordinates
    if (useTexture) {
      // Standard texture coordinates for a quad
      texCoords.push(
        0.0,
        0.0, // a
        1.0,
        0.0, // b
        1.0,
        1.0, // c
        0.0,
        1.0 // d
      );
    } else {
      // Push dummy coordinates
      texCoords.push(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }

    // Add indices for two triangles
    indices.push(
      indexOffset,
      indexOffset + 1,
      indexOffset + 2,
      indexOffset,
      indexOffset + 2,
      indexOffset + 3
    );

    return indexOffset + 4;
  }

  const createCuboid = (
    x,
    y,
    z,
    width,
    height,
    depth,
    color,
    startIndex,
    useTexture = false
  ) => {
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;

    // Define 8 vertices of the cuboid
    const v0 = [x - hw, y - hh, z + hd];
    const v1 = [x + hw, y - hh, z + hd];
    const v2 = [x + hw, y + hh, z + hd];
    const v3 = [x - hw, y + hh, z + hd];
    const v4 = [x - hw, y - hh, z - hd];
    const v5 = [x + hw, y - hh, z - hd];
    const v6 = [x + hw, y + hh, z - hd];
    const v7 = [x - hw, y + hh, z - hd];

    const vertices = [];
    const normals = [];
    const colors = [];
    const texCoords = [];
    const indices = [];
    let indexOffset = startIndex;

    // Create 6 faces with proper normals
    indexOffset = quad(
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      v0,
      v1,
      v2,
      v3,
      color,
      indexOffset,
      useTexture
    ); // Front
    indexOffset = quad(
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      v5,
      v4,
      v7,
      v6,
      color,
      indexOffset,
      useTexture
    ); // Back
    indexOffset = quad(
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      v1,
      v5,
      v6,
      v2,
      color,
      indexOffset,
      useTexture
    ); // Right
    indexOffset = quad(
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      v4,
      v0,
      v3,
      v7,
      color,
      indexOffset,
      useTexture
    ); // Left
    indexOffset = quad(
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      v3,
      v2,
      v6,
      v7,
      color,
      indexOffset,
      useTexture
    ); // Top
    indexOffset = quad(
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      v4,
      v5,
      v1,
      v0,
      color,
      indexOffset,
      useTexture
    ); // Bottom

    return {
      vertices,
      normals,
      colors,
      texCoords,
      indices,
      newIndexOffset: indexOffset,
    };
  };

  let allVertices = [];
  let allNormals = [];
  let allColors = [];
  let allTexCoords = [];
  allIndices = []; // Clear the global array before rebuilding
  texturedIndices = []; // Clear textured indices
  nonTexturedIndices = []; // Clear non-textured indices
  let currentIndexOffset = 0;

  const addCuboidToScene = (
    x,
    y,
    z,
    width,
    height,
    depth,
    color,
    useTexture = false
  ) => {
    const { vertices, normals, colors, texCoords, indices, newIndexOffset } =
      createCuboid(
        x,
        y,
        z,
        width,
        height,
        depth,
        color,
        currentIndexOffset,
        useTexture
      );
    allVertices.push(...vertices);
    allNormals.push(...normals);
    allColors.push(...colors);
    allTexCoords.push(...texCoords);
    allIndices.push(...indices);

    // Add indices to appropriate array based on texture usage
    if (useTexture) {
      texturedIndices.push(...indices);
    } else {
      nonTexturedIndices.push(...indices);
    }

    currentIndexOffset = newIndexOffset;
  };

  // --- Monitor Components ---
  // 1. Monitor Screen Panel (the display itself)
  addCuboidToScene(0, 0.275, 0.05, 2.0, 1.0, 0.05, screenImgColor); // Y was 0.5

  // 2. Monitor Bezel/Frame (white, wraps around the screen panel)
  addCuboidToScene(0, 0.275, 0.035, 2.1, 1.1, 0.03, white); // Y was 0.5

  // 3. Monitor Back Casing (silver, thicker part behind the frame) - WITH CHECKERBOARD TEXTURE
  addCuboidToScene(0, 0.275, -0.05, 2.05, 1.05, 0.1, silver, true);

  // 4. Logo (on the back of the monitor)
  addCuboidToScene(0, 0.475, -0.105, 0.2, 0.3, 0.01, darkGrey); // Y was 0.7

  // 5. Monitor Neck (the thin connection to the stand)
  addCuboidToScene(0, -0.425, 0.01, 0.1, 0.7, 0.04, silver); // Y was -0.2

  // 6. Monitor Base (the wide, curved-looking base)
  addCuboidToScene(0, -0.825, 0.0, 0.8, 0.05, 0.5, silver); // Y was -0.6

  // Desk Components
  addCuboidToScene(0, -0.9, 0, 5.0, 0.1, 4.0, wood);

  const legHeight = 1.5;
  const legWidth = 0.2;
  const deskX = 2.5;
  const deskZ = 2.0;
  const deskBottomY = -1.0;

  addCuboidToScene(
    deskX - legWidth / 2,
    deskBottomY - legHeight / 2,
    deskZ - legWidth / 2,
    legWidth,
    legHeight,
    legWidth,
    wood
  );
  addCuboidToScene(
    -deskX + legWidth / 2,
    deskBottomY - legHeight / 2,
    deskZ - legWidth / 2,
    legWidth,
    legHeight,
    legWidth,
    wood
  );
  addCuboidToScene(
    deskX - legWidth / 2,
    deskBottomY - legHeight / 2,
    -deskZ + legWidth / 2,
    legWidth,
    legHeight,
    legWidth,
    wood
  );
  addCuboidToScene(
    -deskX + legWidth / 2,
    deskBottomY - legHeight / 2,
    -deskZ + legWidth / 2,
    legWidth,
    legHeight,
    legWidth,
    wood
  );

  // --- Keyboard & Mouse ---
  const keyboardY = -0.85 + 0.02; // Position on top of the desk (desk surface Y + half keyboard height)

  // Keyboard Body
  addCuboidToScene(0, keyboardY, 0.6, 1.5, 0.04, 0.4, white);

  // Example Key (simplified, just one cuboid)
  addCuboidToScene(0.7, keyboardY + 0.02, 0.7, 0.1, 0.02, 0.1, darkGrey);

  // Mouse Body
  addCuboidToScene(1.5, keyboardY, 0.7, 0.3, 0.04, 0.4, white);

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allVertices), gl.STATIC_DRAW);

  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allNormals), gl.STATIC_DRAW);

  colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allColors), gl.STATIC_DRAW);

  texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(allTexCoords),
    gl.STATIC_DRAW
  );

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(allIndices),
    gl.STATIC_DRAW
  );

  texturedIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texturedIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(texturedIndices),
    gl.STATIC_DRAW
  );

  nonTexturedIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, nonTexturedIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(nonTexturedIndices),
    gl.STATIC_DRAW
  );

  const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  const aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  const aColor = gl.getAttribLocation(shaderProgram, "aColor");
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aColor);

  const aTexCoord = gl.getAttribLocation(shaderProgram, "aTexCoord");
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const mvMatrix = mat4.create();
  mat4.translate(mvMatrix, mvMatrix, translate);
  mat4.rotateX(mvMatrix, mvMatrix, rotate[0]);
  mat4.rotateY(mvMatrix, mvMatrix, rotate[1]);
  mat4.rotateZ(mvMatrix, mvMatrix, rotate[2]);
  mat4.scale(mvMatrix, mvMatrix, scale);

  mat4.perspective(
    projectionMatrix,
    Math.PI / 4,
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );

  gl.uniformMatrix4fv(uModelViewMatrix, false, mvMatrix);
  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

  // Draw non-textured objects first
  gl.uniform1i(gl.useTextureLoc, false);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, nonTexturedIndexBuffer);
  gl.drawElements(
    gl.TRIANGLES,
    nonTexturedIndices.length,
    gl.UNSIGNED_SHORT,
    0
  );

  // Draw textured objects
  gl.uniform1i(gl.useTextureLoc, true);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
  gl.uniform1i(gl.textureMapLoc, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texturedIndexBuffer);
  gl.drawElements(gl.TRIANGLES, texturedIndices.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
}

function setCamera({ zoom }) {
  translate[2] += zoom;
}

function resetView() {
  translate = [0, -0.8, -8];
  rotate = [0, 0, 0];
  scale = [1, 1, 1];
}

// Update lighting uniforms (from material)
function updateLighting() {
  // Calculate light-material products (from material)
  const ambientProduct = [
    lightAmbient[0] * materialAmbient[0],
    lightAmbient[1] * materialAmbient[1],
    lightAmbient[2] * materialAmbient[2],
    1.0,
  ];

  const diffuseProduct = [
    lightDiffuse[0] * materialDiffuse[0],
    lightDiffuse[1] * materialDiffuse[1],
    lightDiffuse[2] * materialDiffuse[2],
    1.0,
  ];

  const specularProduct = [
    lightSpecular[0] * materialSpecular[0],
    lightSpecular[1] * materialSpecular[1],
    lightSpecular[2] * materialSpecular[2],
    1.0,
  ];

  // Set uniform values (from material)
  gl.uniform4fv(gl.ambientProductLoc, ambientProduct);
  gl.uniform4fv(gl.diffuseProductLoc, diffuseProduct);
  gl.uniform4fv(gl.specularProductLoc, specularProduct);
  gl.uniform4fv(gl.lightPositionLoc, lightPosition);
  gl.uniform1f(gl.shininessLoc, materialShininess);
  gl.uniform1i(gl.lightingEnabledLoc, lightingEnabled ? 1 : 0);
}

// Function to set light position
function setLightPosition(x, y, z) {
  lightPosition[0] = x;
  lightPosition[1] = y;
  lightPosition[2] = z;
  updateLighting();
}

// Function to set ambient light color
function setAmbientLight(r, g, b) {
  lightAmbient[0] = r;
  lightAmbient[1] = g;
  lightAmbient[2] = b;
  updateLighting();
}

// Function to set diffuse light color
function setDiffuseLight(r, g, b) {
  lightDiffuse[0] = r;
  lightDiffuse[1] = g;
  lightDiffuse[2] = b;
  updateLighting();
}

// Function to set specular light color
function setSpecularLight(r, g, b) {
  lightSpecular[0] = r;
  lightSpecular[1] = g;
  lightSpecular[2] = b;
  updateLighting();
}

// Function to toggle lighting
function toggleLighting() {
  lightingEnabled = !lightingEnabled;
  updateLighting();
  return lightingEnabled;
}

// Function to create checkerboard texture
function createCheckerboardTexture() {
  // Create 64x64 checkerboard pattern like in example
  var texSize = 64;
  var numRows = 8;
  var numCols = 8;
  var image = new Array();

  for (var i = 0; i < texSize; i++) image[i] = new Array();
  for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
      image[i][j] = new Float32Array(4);

  for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++) {
      var c = ((i & 0x8) == 0) ^ ((j & 0x8) == 0);
      image[i][j] = [c, c, c, 1];
    }

  // Convert to Uint8Array
  var image1 = new Uint8Array(4 * texSize * texSize);
  for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
      for (var k = 0; k < 4; k++)
        image1[4 * texSize * i + 4 * j + k] = 255 * image[i][j][k];

  // Create and configure texture
  checkerboardTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image1
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}
