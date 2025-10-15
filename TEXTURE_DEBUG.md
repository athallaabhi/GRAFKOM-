# Texture Debugging Guide

## Issue: Screen appears black when texture is enabled

### Quick Fixes Applied:

1. **✅ Added ambient light to texture** - Textures now receive ambient lighting so they won't be completely black
2. **✅ Added error handling** - Console will show if image fails to load
3. **✅ Added debugging logs** - Check browser console for texture status
4. **✅ Fixed texture binding** - Texture is now always bound to avoid WebGL errors

### How to Debug:

#### Step 1: Open Browser Console

- Press `F12` or `Ctrl+Shift+I` (Chrome/Edge)
- Go to the "Console" tab

#### Step 2: Check for Error Messages

Look for these messages:

- `✅ JOKOWI.jpg loaded successfully!` - Good! Image loaded
- `❌ Failed to load JOKOWI.jpg!` - Bad! File path issue
- `🔄 Loading texture from: images/JOKOWI.jpg` - Loading started
- `🖼️ Screen texture: ON/OFF` - Toggle status
- `🔲 Checkerboard: ON/OFF` - Toggle status

#### Step 3: Test Image Path

1. Open `test-image.html` in your browser
2. If you see the JOKOWI image, the path is correct
3. If you don't see it, the file path is wrong

#### Step 4: Common Issues & Solutions

**Problem: Image doesn't load**

- **Check**: Is `JOKOWI.jpg` in the `images/` folder?
- **Solution**: Move the file to `tugas1-grafika/images/JOKOWI.jpg`
- **Alternative**: Change the path in renderer.js line ~115

**Problem: Screen is completely black**

- **Check**: Is lighting enabled? Try toggling "Turn Lighting ON/OFF"
- **Check**: Are ambient light values too low? Try increasing ambient RGB sliders
- **Solution**: Set Ambient Light to at least 0.2, 0.2, 0.2

**Problem: Texture appears but is very dark**

- **Cause**: Low ambient light + surface facing away from light
- **Solution 1**: Increase ambient light (R, G, B sliders)
- **Solution 2**: Move light position closer (Light Position sliders)
- **Solution 3**: Rotate the object so screen faces the light

**Problem: Texture shows as magenta/pink**

- **Cause**: Image hasn't loaded yet (this is the placeholder color)
- **Solution**: Wait a few seconds for the image to load
- **Check**: Console for "✅ JOKOWI.jpg loaded successfully!"

#### Step 5: Verify Settings

Recommended settings for best texture visibility:

```
Lighting: ON
Ambient Light: R=0.3, G=0.3, B=0.3 (at minimum)
Diffuse Light: R=1.0, G=1.0, B=1.0
Specular Light: R=1.0, G=1.0, B=1.0
Light Position: X=1.0, Y=1.0, Z=1.0
```

#### Step 6: File Path Check

The HTML file expects this structure:

```
tugas1-grafika/
├── index.html
├── renderer.js
├── images/
│   └── JOKOWI.jpg  ← Must be here!
```

If your structure is different, update line ~115 in renderer.js:

```javascript
image.src = "images/JOKOWI.jpg"; // Change this path if needed
```

### What Changed in the Fix:

**shaders.js:**

```glsl
// BEFORE: Texture only in diffuse
vec4 ambient = uAmbientProduct;
vec4 diffuse = Kd*baseColor;

// AFTER: Texture in both ambient and diffuse
vec4 ambient = uAmbientProduct;
if (uUseScreenImageTexture || uUseBackCheckerboard) {
  ambient = ambient * baseColor;  // ← Texture now visible even without direct light
}
vec4 diffuse = Kd*baseColor;
```

This ensures textures are visible even when the surface is not directly lit.

### Testing Steps:

1. Open `index.html` in browser
2. Open Console (F12)
3. Check for texture loading message
4. Enable "Show JOKOWI.jpg on screen" checkbox
5. Verify in console: "🖼️ Screen texture: ON"
6. If screen is black:
   - Increase Ambient Light sliders
   - Check console for image loading errors
   - Verify file path with test-image.html

### Still Having Issues?

If the screen is still black:

1. **Disable lighting temporarily**

   - Click "Turn Lighting OFF"
   - Enable screen texture
   - You should see the raw texture without shading

2. **Check WebGL errors**

   - Open Console
   - Look for any red error messages
   - Share them for further debugging

3. **Try checkerboard instead**

   - Disable screen image texture
   - Enable checkerboard pattern
   - If checkerboard works but image doesn't, it's a loading issue

4. **Verify uniform locations**
   - Check console for "🔧 Texture uniform locations:"
   - All values should be valid (not null or -1)
