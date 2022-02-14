let VertDefault = `
#version 300 es

in vec4 position;
in vec2 texCoord;


out vec4 fragUV;

void main() {
  gl_Position =  position;
  
  vec2 uv = position.xy;
  uv = position.xy * 0.5 + 0.5;
//   uv = vec2(position.x ,0.);
// uv = position.xy;
// uv = texCoord;
uv = vec2(1.,0.);
  fragUV = vec4(uv, 0., 0.);
}
`

export default VertDefault;