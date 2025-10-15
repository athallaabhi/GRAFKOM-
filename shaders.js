// Vertex Shader Source - Fragment Lighting with Texture Support
const vertexShaderSource = `
attribute vec4 aPosition;
attribute vec4 aNormal;
attribute vec3 aColor;
attribute vec2 aTexCoord;
varying vec3 vN, vL, vE;
varying vec3 vColor;
varying vec2 vTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uLightPosition;

void main()
{
  vec3 pos = -(uModelViewMatrix * aPosition).xyz;
  vec3 light = uLightPosition.xyz;
  vL = normalize( light - pos );
  vE = -pos;
  vN = normalize( (uModelViewMatrix*aNormal).xyz);
  vColor = aColor;
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
}
`;

// Fragment Shader Source - Fragment Lighting with Texture Support
const fragmentShaderSource = `
precision mediump float;

uniform vec4 uAmbientProduct;
uniform vec4 uDiffuseProduct;
uniform vec4 uSpecularProduct;
uniform float uShininess;
uniform bool uLightingEnabled;
uniform sampler2D uTexture;
uniform bool uUseScreenImageTexture;
uniform bool uUseBackCheckerboard;

varying vec3 vN, vL, vE;
varying vec3 vColor;
varying vec2 vTexCoord;

void main()
{
  vec4 baseColor;
  
  // Determine base color from texture or material color
  if (uUseScreenImageTexture) {
    baseColor = texture2D(uTexture, vTexCoord);
  } else if (uUseBackCheckerboard) {
    float scale = 10.0;
    float pattern = mod(floor(vTexCoord.s * scale) + floor(vTexCoord.t * scale), 2.0);
    baseColor = (pattern < 0.1) ? vec4(0.2, 0.2, 0.2, 1.0) : vec4(0.9, 0.9, 0.9, 1.0);
  } else {
    baseColor = vec4(vColor, 1.0);
  }
  
  if (uLightingEnabled) {
    // Phong-Blinn lighting calculation
    vec3 H = normalize( vL + vE );
    
    // For textured surfaces, modulate ambient with texture color too
    vec4 ambient = uAmbientProduct;
    if (uUseScreenImageTexture || uUseBackCheckerboard) {
      ambient = ambient * baseColor;
    }
    
    float Kd = max( dot(vL, vN), 0.0 );
    vec4 diffuse = Kd*baseColor;
    
    float Ks = pow( max(dot(vN, H), 0.0), uShininess );
    vec4 specular = Ks * uSpecularProduct;
    
    if( dot(vL, vN) < 0.0 ) {
      specular = vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    // Combine lighting with texture
    gl_FragColor = ambient + diffuse + specular;
    gl_FragColor.a = 1.0;
  } else {
    // No lighting - just use the base color (texture or material)
    gl_FragColor = baseColor;
  }
}
`;
