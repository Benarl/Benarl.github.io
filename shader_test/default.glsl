void main() 
{ 
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 uvm=iMouse/iResolution.xy;
    

    //gl_FragColor = texture2D(iChannel0, uv);
     gl_FragColor = vec4(uv*uvm, 0.5, 1);
}