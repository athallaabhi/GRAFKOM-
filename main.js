window.onload = () => {
  const canvas = document.getElementById("glCanvas");
  initRenderer(canvas);

  // --- UI Sliders and Buttons ---
  const sliders = {
    translateX: document.getElementById("translateX"),
    translateY: document.getElementById("translateY"),
    translateZ: document.getElementById("translateZ"),
    rotateX: document.getElementById("rotateX"),
    rotateY: document.getElementById("rotateY"),
    rotateZ: document.getElementById("rotateZ"),
    scaleU: document.getElementById("scaleU"),
    scaleX: document.getElementById("scaleX"),
    scaleY: document.getElementById("scaleY"),
    scaleZ: document.getElementById("scaleZ"),
  };

  // Translation
  sliders.translateX.oninput = (e) =>
    (translate[0] = parseFloat(e.target.value));
  sliders.translateY.oninput = (e) =>
    (translate[1] = parseFloat(e.target.value));
  sliders.translateZ.oninput = (e) =>
    (translate[2] = parseFloat(e.target.value));

  // Rotation
  sliders.rotateX.oninput = (e) =>
    (rotate[0] = (parseFloat(e.target.value) * Math.PI) / 180);
  sliders.rotateY.oninput = (e) =>
    (rotate[1] = (parseFloat(e.target.value) * Math.PI) / 180);
  sliders.rotateZ.oninput = (e) =>
    (rotate[2] = (parseFloat(e.target.value) * Math.PI) / 180);

  // Scale
  sliders.scaleU.oninput = (e) => {
    const v = parseFloat(e.target.value);
    scale = [v, v, v];
    sliders.scaleX.value = v;
    sliders.scaleY.value = v;
    sliders.scaleZ.value = v;
  };
  sliders.scaleX.oninput = (e) => (scale[0] = parseFloat(e.target.value));
  sliders.scaleY.oninput = (e) => (scale[1] = parseFloat(e.target.value));
  sliders.scaleZ.oninput = (e) => (scale[2] = parseFloat(e.target.value));

  // Reflection
  document.getElementById("reflectX").onclick = () => (scale[0] *= -1);
  document.getElementById("reflectY").onclick = () => (scale[1] *= -1);
  document.getElementById("reflectZ").onclick = () => (scale[2] *= -1);

  // Camera Buttons
  document.getElementById("zoomIn").onclick = () => setCamera({ zoom: 0.5 });
  document.getElementById("zoomOut").onclick = () => setCamera({ zoom: -0.5 });

  // Reset
  document.getElementById("resetView").onclick = () => {
    resetView();
    // Reset all sliders visually
    for (const key in sliders) {
      if (key.startsWith("scale")) {
        sliders[key].value = 1;
      } else {
        sliders[key].value = 0;
      }
    }
  };

  // Lighting Toggle
  document.getElementById("toggleLighting").onclick = function () {
    const isEnabled = toggleLighting();
    this.textContent = isEnabled ? "Turn Lighting OFF" : "Turn Lighting ON";
  };

  // Light Position Controls
  document.getElementById("lightX").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setLightPosition(val, lightPosition[1], lightPosition[2]);
    document.getElementById("lightXValue").textContent = val.toFixed(1);
  };

  document.getElementById("lightY").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setLightPosition(lightPosition[0], val, lightPosition[2]);
    document.getElementById("lightYValue").textContent = val.toFixed(1);
  };

  document.getElementById("lightZ").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setLightPosition(lightPosition[0], lightPosition[1], val);
    document.getElementById("lightZValue").textContent = val.toFixed(1);
  };

  // Ambient Light Color Controls
  document.getElementById("ambientR").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setAmbientLight(val, lightAmbient[1], lightAmbient[2]);
    document.getElementById("ambientRValue").textContent = val.toFixed(2);
  };

  document.getElementById("ambientG").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setAmbientLight(lightAmbient[0], val, lightAmbient[2]);
    document.getElementById("ambientGValue").textContent = val.toFixed(2);
  };

  document.getElementById("ambientB").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setAmbientLight(lightAmbient[0], lightAmbient[1], val);
    document.getElementById("ambientBValue").textContent = val.toFixed(2);
  };

  // Diffuse Light Color Controls
  document.getElementById("diffuseR").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setDiffuseLight(val, lightDiffuse[1], lightDiffuse[2]);
    document.getElementById("diffuseRValue").textContent = val.toFixed(2);
  };

  document.getElementById("diffuseG").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setDiffuseLight(lightDiffuse[0], val, lightDiffuse[2]);
    document.getElementById("diffuseGValue").textContent = val.toFixed(2);
  };

  document.getElementById("diffuseB").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setDiffuseLight(lightDiffuse[0], lightDiffuse[1], val);
    document.getElementById("diffuseBValue").textContent = val.toFixed(2);
  };

  // Specular Light Color Controls
  document.getElementById("specularR").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setSpecularLight(val, lightSpecular[1], lightSpecular[2]);
    document.getElementById("specularRValue").textContent = val.toFixed(2);
  };

  document.getElementById("specularG").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setSpecularLight(lightSpecular[0], val, lightSpecular[2]);
    document.getElementById("specularGValue").textContent = val.toFixed(2);
  };

  document.getElementById("specularB").oninput = (e) => {
    const val = parseFloat(e.target.value);
    setSpecularLight(lightSpecular[0], lightSpecular[1], val);
    document.getElementById("specularBValue").textContent = val.toFixed(2);
  };

  // Texture Toggle Controls
  document.getElementById("screenImageToggle").onchange = function () {
    toggleScreenTexture();
  };

  document.getElementById("backCheckerboardToggle").onchange = function () {
    toggleBackCheckerboard();
  };

  // --- Mouse Controls for Rotation and Zoom ---
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  canvas.onmousedown = (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };

  canvas.onmouseup = () => (isDragging = false);
  canvas.onmouseleave = () => (isDragging = false); // Stop dragging if mouse leaves canvas

  canvas.onmousemove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    // Adjust rotation based on mouse movement
    rotate[1] += deltaX * 0.01; // Yaw (left/right)
    rotate[0] += deltaY * 0.01; // Pitch (up/down)

    // Update slider positions to reflect mouse rotation
    sliders.rotateY.value = ((rotate[1] * 180) / Math.PI) % 360;
    sliders.rotateX.value = ((rotate[0] * 180) / Math.PI) % 360;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };

  canvas.onwheel = (e) => {
    e.preventDefault(); // Prevent page from scrolling

    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    let newScale = parseFloat(sliders.scaleU.value) * scaleFactor;

    // Clamp the scale to the slider's min/max
    newScale = Math.max(
      parseFloat(sliders.scaleU.min),
      Math.min(parseFloat(sliders.scaleU.max), newScale)
    );

    sliders.scaleU.value = newScale;
    // Trigger the oninput event to apply the new scale
    sliders.scaleU.dispatchEvent(new Event("input"));
  };
};
