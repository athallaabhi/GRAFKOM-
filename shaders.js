// Vertex Shader Source - Fragment Lighting (from material)
const vertexShaderSource = `
attribute vec4 aPosition;
attribute vec4 aNormal;
attribute vec3 aColor;
varying vec3 vN, vL, vE;
varying vec3 vColor;
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
  gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
}
`;

// Fragment Shader Source - Fragment Lighting (from material)
const fragmentShaderSource = `
precision mediump float;

uniform vec4 uAmbientProduct;
uniform vec4 uDiffuseProduct;
uniform vec4 uSpecularProduct;
uniform float uShininess;
uniform bool uLightingEnabled;

varying vec3 vN, vL, vE;
varying vec3 vColor;

void main()
{
  if (uLightingEnabled) {
    // Phong-Blinn lighting calculation
    vec3 H = normalize( vL + vE );
    vec4 ambient = uAmbientProduct;
    
    float Kd = max( dot(vL, vN), 0.0 );
    vec4 diffuse = Kd*uDiffuseProduct;
    
    float Ks = pow( max(dot(vN, H), 0.0), uShininess );
    vec4 specular = Ks * uSpecularProduct;
    
    if( dot(vL, vN) < 0.0 ) {
      specular = vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    // Apply lighting to material color
    vec4 materialColor = vec4(vColor, 1.0);
    gl_FragColor = materialColor * (ambient + diffuse) + specular;
    gl_FragColor.a = 1.0;
  } else {
    // Flat shading - just use the material color without lighting
    gl_FragColor = vec4(vColor, 1.0);
  }
}
`;
