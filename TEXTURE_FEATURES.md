# Texture Mapping Features

## Overview

This document describes the texture mapping features implemented in the 3D Monitor Viewer project, including texture-light interaction as per assignment requirements.

## Features Implemented

### 1. **Image Texture on Monitor Screen**

- **File**: `images/JOKOWI.jpg`
- **Applied to**: Monitor Screen Panel (front face)
- **Control**: Checkbox "Show JOKOWI.jpg on screen"
- **Description**: Displays the JOKOWI.jpg image on the monitor's screen surface
- **Lighting Interaction**: ✅ The image texture interacts with Phong-Blinn lighting model
  - Ambient component provides base visibility
  - Diffuse component modulates the texture color based on light angle
  - Specular highlights appear on the textured surface
  - Texture brightness changes with light position and color

### 2. **Procedural Checkerboard Texture on Monitor Back**

- **Pattern**: Procedural 10x10 checkerboard (black and white squares)
- **Applied to**: Monitor Back Casing (rear face)
- **Control**: Checkbox "Show checkerboard pattern"
- **Description**: Generates a checkerboard pattern programmatically in the fragment shader
- **Lighting Interaction**: ✅ The checkerboard pattern interacts with lighting
  - Dark squares (0.2, 0.2, 0.2) and light squares (0.9, 0.9, 0.9)
  - Both colors are affected by ambient, diffuse, and specular lighting
  - Pattern remains visible even when rotating the light source
  - Creates realistic shading across the checkered surface

### 3. **Texture-Lighting Interaction**

All textures properly interact with the Phong-Blinn lighting model:

**In Fragment Shader (`shaders.js`):**

```glsl
// Base color from texture or material
if (uUseScreenImageTexture) {
  baseColor = texture2D(uTexture, vTexCoord);
} else if (uUseBackCheckerboard) {
  float scale = 10.0;
  float pattern = mod(floor(vTexCoord.s * scale) + floor(vTexCoord.t * scale), 2.0);
  baseColor = (pattern < 0.1) ? vec4(0.2, 0.2, 0.2, 1.0) : vec4(0.9, 0.9, 0.9, 1.0);
}

// Apply lighting to texture
vec3 H = normalize( vL + vE );
vec4 ambient = uAmbientProduct;
float Kd = max( dot(vL, vN), 0.0 );
vec4 diffuse = Kd*baseColor;  // Texture color modulated by diffuse lighting
float Ks = pow( max(dot(vN, H), 0.0), uShininess );
vec4 specular = Ks * uSpecularProduct;
```

**Key Points:**

- Textures replace the material's diffuse color (`baseColor`)
- Ambient lighting provides base visibility of textures
- Diffuse component makes textures darker/brighter based on light angle
- Specular highlights add shininess on top of textured surfaces
- When lighting is OFF, textures show at full brightness without shading

## Implementation Details

### Shader Changes

1. **Vertex Shader**: Added `aTexCoord` attribute and `vTexCoord` varying
2. **Fragment Shader**:
   - Added texture sampling with `texture2D()`
   - Added procedural checkerboard generation
   - Integrated textures into lighting calculations

### Renderer Changes (`renderer.js`)

1. Added texture coordinate generation for all quad faces
2. Implemented `loadTextures()` function for image loading
3. Created `objectRanges` to track screen and back object indices
4. Modified `render()` to draw objects in batches with different texture settings
5. Added toggle functions: `toggleScreenTexture()` and `toggleBackCheckerboard()`

### UI Changes (`index.html`)

Added new "Textures" section with:

- **Monitor Screen**: Checkbox to enable JOKOWI.jpg texture
- **Monitor Back**: Checkbox to enable checkerboard pattern

### Event Handlers (`main.js`)

Added checkbox event listeners:

```javascript
document.getElementById("screenImageToggle").onchange = toggleScreenTexture;
document.getElementById("backCheckerboardToggle").onchange =
  toggleBackCheckerboard;
```

## User Guide

### How to Use Textures

1. **Enable Screen Image**:

   - Check "Show JOKOWI.jpg on screen" checkbox
   - JOKOWI.jpg will appear on the monitor's screen
   - Use light position sliders to see how lighting affects the image

2. **Enable Back Checkerboard**:

   - Check "Show checkerboard pattern" checkbox
   - A black and white checkerboard appears on the monitor's back
   - Rotate the object to see the pattern on the back side

3. **Observe Lighting Interaction**:

   - Toggle "Turn Lighting ON/OFF" to compare textured appearance with/without lighting
   - Adjust **Light Position** (X, Y, Z) to see textures respond to light direction
   - Modify **Ambient Light Color** to change the base brightness of textures
   - Modify **Diffuse Light Color** to change the color tint of lit areas
   - Modify **Specular Light Color** to see highlights on textured surfaces

4. **Best Viewing**:
   - Rotate the view using mouse drag to see textures from different angles
   - Use zoom controls to get closer to textured surfaces
   - Try different light positions to appreciate the texture-light interaction

## Technical Notes

### Texture Coordinates

- Each quad face has standard UV mapping: (0,0), (1,0), (1,1), (0,1)
- Coordinates are interpolated across triangles for smooth texture mapping

### Selective Texture Application

- Textures are applied only to specific objects using index ranges
- Screen texture: Only to monitor screen panel
- Checkerboard: Only to monitor back casing
- Other objects: Render with material colors only

### Performance

- Texture loaded asynchronously with placeholder during loading
- Mipmapping enabled for smooth appearance at different distances
- Procedural checkerboard generated in shader (no additional texture memory)

## Assignment Requirements Compliance

✅ **Tambahkan texture berupa checkboard pada objek kalian**

- Implemented: Checkerboard pattern on monitor back casing

✅ **Tambahkan texture berupa image pada objek kalian**

- Implemented: JOKOWI.jpg image on monitor screen

✅ **Tambahkan interaksi antara texture dengan cahaya**

- Implemented: Full Phong-Blinn lighting applied to both textures
- Textures respond to ambient, diffuse, and specular lighting components
- Light position, color, and intensity all affect textured surfaces

## Color Scheme

All additions maintain the Endeavour Blue color scheme (#0056b3) as requested. No existing features or colors were modified or removed.
