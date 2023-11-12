import * as THREE from 'three';
import * as p5 from 'p5';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

const s = ( sketch ) => {

    let x = 100;
    let y = 100;

    let currentsentence;
    let sentence = 0;
    let image = 1;
    let cx, cy;
    let pos = 0;
    let restartDelay = 3;
    let positionX;
    let positionY;
    let textsize;
    let emojisize;
    let r, g, b; 
    const lower = 0x1f300;
    const upper = 0x1f9ff;
    let img;

    let thoughtdata = [];
    sketch.preload = () => {
        thoughtdata = sketch.loadJSON("data/entries.json");
    }

    sketch.setup = () => {
      //sketch.background(169, 169, 169);
      currentsentence = thoughtdata[sentence].THOUGHT;
      console.log(currentsentence);
      var c = sketch.createCanvas(window.innerWidth, window.innerHeight);
      c.parent('p5Div');
      sketch.colorMode(sketch.RGB, 150);
      r = sketch.random(0, 255);
      b = sketch.random(0, 255);
      g = sketch.random(0, 255);

      cx = sketch.width/2;
      cy = sketch.height/2;
      positionX = sketch.random(0, sketch.width);
      positionY = sketch.random(0, sketch.height);
      textsize = 20;
      emojisize = 20;
      sketch.frameRate(10);

      img = sketch.loadImage('images/1.jpeg');
    };
  
    sketch.draw = () => {
      //sketch.background(169, 169, 169);
      sketch.fill(r, g, b);
      if(sketch.random(0,1) < 0.15){
        sketch.stroke(r,g,b);
      }
      else{
        sketch.noStroke();
      }
      sketch.textFont('Times New Roman');
      sketch.textSize(textsize);

      if(thoughtdata[sentence]){
        let currentsentence = thoughtdata[sentence].THOUGHT;
    
        sketch.text(currentsentence.substring(0, pos + 1), positionX, positionY, 200, 300);
        const code = sketch.int(sketch.map(r, 0, 255, lower, upper));
        const chr = String.fromCodePoint(code);
        sketch.textSize(emojisize);
        sketch.text(chr, (g/255)*sketch.width, (b/255)*sketch.height);
    
        pos++;  

        if (pos > currentsentence.length + restartDelay) {
            textsize = sketch.map(currentsentence.length, 1, 258, 30, 5);
            emojisize = sketch.map(currentsentence.length, 1, 258, 100, 30);
            positionX = sketch.random(0, 0.75*sketch.width);
            positionY = sketch.random(0, 0.95*sketch.height);
            
            sketch.randomSeed(pos);
            r = sketch.random(255);
            g = sketch.random(255);
            b = sketch.random(255);
        
            pos = 0;
            //sketch.image(img, sketch.random(0,sketch.width*0.8), sketch.random(0, sketch.height*0.8), img.width / 10, img.height / 10);
            console.log(sentence % 3);
            if(sentence % 3 == 0 || sentence == 0){
                console.log("yes");
                sketch.loadImage("images/" + image + ".jpeg", (img) => {
                    sketch.image(img, sketch.random(0,sketch.width*0.8), sketch.random(0, sketch.height*0.8), img.width / 10, img.height / 10);
                });
                image++;
            }
            sentence++;
            sketch.filter(sketch.BLUR, 2);
        }
        // Check if we are at the end of the sentence to restart animation
      }
    };
  };

let p5instance = new p5(s);
if ( WebGL.isWebGL2Available() === false ) {

    document.body.appendChild( WebGL.getWebGL2ErrorMessage() );

}

let renderer, scene, camera, controls;
const HDR = '/textures/environmentMap/sky.exr';
let mesh;

const hdrEquirect = new EXRLoader()
  .load( HDR, function () {

    console.log(HDR);
    //exrCubeRenderTarget = pmremGenerator.fromEquirectangular( HDR );
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    hdrEquirect.encoding = THREE.sRGBEncoding;
    
    init();
    animate();

  } 
);

// init();
// animate();

function init() {

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0xffffff, 1);
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById("container").appendChild( renderer.domElement );

    scene = new THREE.Scene();

    //scene.background = hdrEquirect;
    //scene.environment = hdrEquirect;

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 500 );
    camera.position.set( -0.032749, -0.04540059, -0.063753303559 );
    camera.rotation.set(2.5227725, -0.39629804, 2.87333228980);

    // Sky

    // const canvas = document.createElement( 'canvas' );
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    // Texture

    const size = 128;
    const data = new Uint8Array( size * size * size );

    let i = 0;
    const scale = 0.05;
    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();

    for ( let z = 0; z < size; z ++ ) {

        for ( let y = 0; y < size; y ++ ) {

            for ( let x = 0; x < size; x ++ ) {

                const d = 1.0 - vector.set( x, y, z ).subScalar( size / 2 ).divideScalar( size ).length();
                data[ i ] = ( 128 + 128 * perlin.noise( x * scale / 1.5, y * scale, z * scale / 1.5 ) ) * d * d;
                i ++;

            }

        }

    }

    const texture = new THREE.Data3DTexture( data, size, size, size );
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    // Material

    const vertexShader = /* glsl */`
        in vec3 position;

        uniform mat4 modelMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform vec3 cameraPos;

        out vec3 vOrigin;
        out vec3 vDirection;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

            vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
            vDirection = position - vOrigin;

            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = /* glsl */`
        precision highp float;
        precision highp sampler3D;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        in vec3 vOrigin;
        in vec3 vDirection;

        out vec4 color;

        uniform vec3 base;
        uniform sampler3D map;

        uniform float threshold;
        uniform float range;
        uniform float opacity;
        uniform float steps;
        uniform float frame;

        uint wang_hash(uint seed)
        {
                seed = (seed ^ 61u) ^ (seed >> 16u);
                seed *= 9u;
                seed = seed ^ (seed >> 4u);
                seed *= 0x27d4eb2du;
                seed = seed ^ (seed >> 15u);
                return seed;
        }

        float randomFloat(inout uint seed)
        {
                return float(wang_hash(seed)) / 4294967296.;
        }

        vec2 hitBox( vec3 orig, vec3 dir ) {
            const vec3 box_min = vec3( - 0.5 );
            const vec3 box_max = vec3( 0.5 );
            vec3 inv_dir = 1.0 / dir;
            vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
            vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
            vec3 tmin = min( tmin_tmp, tmax_tmp );
            vec3 tmax = max( tmin_tmp, tmax_tmp );
            float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
            float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
            return vec2( t0, t1 );
        }

        float sample1( vec3 p ) {
            return texture( map, p ).r;
        }

        float shading( vec3 coord ) {
            float step = 0.01;
            return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
        }

        vec4 linearToSRGB( in vec4 value ) {
            return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
        }

        void main(){
            vec3 rayDir = normalize( vDirection );
            vec2 bounds = hitBox( vOrigin, rayDir );

            if ( bounds.x > bounds.y ) discard;

            bounds.x = max( bounds.x, 0.0 );

            vec3 p = vOrigin + bounds.x * rayDir;
            vec3 inc = 1.0 / abs( rayDir );
            float delta = min( inc.x, min( inc.y, inc.z ) );
            delta /= steps;

            // Jitter

            // Nice little seed from
            // https://blog.demofox.org/2020/05/25/casual-shadertoy-path-tracing-1-basic-camera-diffuse-emissive/
            uint seed = uint( gl_FragCoord.x ) * uint( 1973 ) + uint( gl_FragCoord.y ) * uint( 9277 ) + uint( frame ) * uint( 26699 );
            vec3 size = vec3( textureSize( map, 0 ) );
            float randNum = randomFloat( seed ) * 2.0 - 1.0;
            p += rayDir * randNum * ( 1.0 / size );

            //

            vec4 ac = vec4( base, 0.0 );

            for ( float t = bounds.x; t < bounds.y; t += delta ) {

                float d = sample1( p + 0.5 );

                d = smoothstep( threshold - range, threshold + range, d ) * opacity;

                float col = shading( p + 0.5 ) * 3.0 + ( ( p.x + p.y ) * 0.25 ) + 0.2;

                ac.rgb += ( 1.0 - ac.a ) * d * col;

                ac.a += ( 1.0 - ac.a ) * d;

                if ( ac.a >= 0.95 ) break;

                p += rayDir * delta;

            }

            color = linearToSRGB( ac );

            if ( color.a == 0.0 ) discard;

        }
    `;

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.RawShaderMaterial( {
        glslVersion: THREE.GLSL3,
        uniforms: {
            base: { value: new THREE.Color( 0x798aa0 ) },
            map: { value: texture },
            cameraPos: { value: new THREE.Vector3() },
            threshold: { value: 0.35 },
            opacity: { value: 0.04 },
            range: { value: 0.09 },
            steps: { value: 200 },
            frame: { value: 0 }
        },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        transparent: true
    } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //

    const parameters = {
        threshold: 0.35,
        opacity: 0.04,
        range: 0.09,
        steps: 200
    };

    function update() {

        material.uniforms.threshold.value = parameters.threshold;
        material.uniforms.opacity.value = parameters.opacity;
        material.uniforms.range.value = parameters.range;
        material.uniforms.steps.value = parameters.steps;

    }

    const gui = new GUI();
    gui.add( parameters, 'threshold', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'opacity', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'range', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'steps', 0, 200, 1 ).onChange( update );

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

var mouseX = 0, mouseY = 0;
var targetX = 0, targetY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowHalfX );
    mouseY = ( event.clientY - windowHalfX );

}

var target = new THREE.Vector3();
window.addEventListener("mousemove", onDocumentMouseMove);
function animate() {

    mesh.material.uniforms.cameraPos.value.copy( camera.position );
    mesh.rotation.y = - performance.now() / 2000;

    targetX = ( 1 - mouseX ) * 0.002;
    targetY = ( 1 - mouseY ) * 0.002;

    //camera.rotation.x =+ performance.now() / 2000;
    camera.rotation.x += 0.005 * ( targetY - camera.rotation.x );
    camera.rotation.y += 0.005 * ( targetX - camera.rotation.y );
    mesh.material.uniforms.frame.value ++;
    //controls.update();
    //camera.update();

    renderer.render( scene, camera );
    
    requestAnimationFrame( animate );

}

function onResize( event ) {

	const width = window.innerWidth;
	const height = window.innerHeight;
  
    windowHalf.set( width / 2, height / 2 );
	
    camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize( width, height );
				
}
