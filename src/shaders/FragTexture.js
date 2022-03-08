let FragTexture = `
precision mediump float;

uniform vec2 resolution;
uniform sampler2D tex;

in vec4 fragCoord;
out vec4 FragColor;

void main() {
  vec2 uv = fragCoord.xy / resolution;
  vec3 texCol = texture2D(tex, uv).rgb;

  vec4 colOut;

  colOut.a = 1.;
  colOut.rgb = saturate(texCol);

  FragColor = colOut;
}
`;

export default FragTexture;
