varying vec2 vUv;
uniform float u_time;
uniform sampler2D u_points_texture; // We will pass points as a texture
uniform float u_path_count;

// Function to calculate distance from a point to a line segment
float distanceToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.8; // Adjust aspect ratio

    float min_dist = 1.0;
    
    // Animation progress (loops every 10 seconds)
    float progress = mod(u_time * 0.2, 2.0); // Will go from 0.0 to 2.0
    
    for (float i = 0.0; i < 15.0; i++) {
        // Stop if we've checked all paths
        if (i >= u_path_count) break;

        // Animate each path individually
        float path_progress = clamp(progress * 1.2 - (i / u_path_count) * 1.5, 0.0, 1.0);
        
        if (path_progress > 0.0) {
            float num_points = 50.0;
            // Iterate through points of the current path
            for (float j = 0.0; j < 49.0; j++) {
                // Read point data from the texture
                vec2 p1 = texture2D(u_points_texture, vec2(j / num_points, i / u_path_count)).xy;
                vec2 p2 = texture2D(u_points_texture, vec2((j + 1.0) / num_points, i / u_path_count)).xy;

                min_dist = min(min_dist, distanceToSegment(uv, p1, p2));
            }
        }
    }

    // --- Drawing & Glass Effect ---
    float thickness = 0.008;
    float glow_width = 0.03;

    // 1. Draw the glowing curve
    float glow = smoothstep(thickness + glow_width, thickness, min_dist);
    vec3 color = vec3(0.5, 0.8, 1.0) * glow; // Light blue glow

    // 2. Draw the bright core
    float core = smoothstep(thickness, thickness - 0.002, min_dist);
    color += vec3(1.0) * core;

    // 3. Glass distortion on background
    vec2 distorted_uv = uv + normalize(uv) * (1.0 - smoothstep(0.0, 0.2, min_dist)) * 0.05;
    float bg_noise = fract(sin(dot(distorted_uv, vec2(12.9898,78.233))) * 43758.5453);
    color += (0.05 + bg_noise * 0.02);
    
    gl_FragColor = vec4(color, 1.0);
}