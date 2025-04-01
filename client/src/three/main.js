import * as THREE from 'three';
import GlobeCamera from './camera.js';
// import vertexShader from './shaders/vertex.vert';
// import fragmentShader from './shaders/fragment.frag';
import { renderGeoLines } from './geometry/globeGeoRenderers.js';
import { GEO_FEATURE } from './constants.js';
import Globe from './geometry/globe.js';

export const main = async (canvas) => {

    /**********************************************/
    /* Canvas, window, camera, and renderer setup */
    /**********************************************/

    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new GlobeCamera(renderer, canvas);

    const onWindowResize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height, false);
        camera.updateAspect(width, height);
    }

    window.addEventListener('resize', onWindowResize);

    /**********************************************/
    /*              Base earth setup              */
    /**********************************************/

    const globe = new Globe(10, 64);
    scene.add(globe.getMesh());



    /**********************************************/
    /*              Base lines setup              */
    /**********************************************/


    fetchGeoJSON('ne_110m_coastline').then(geojson => {
        renderGeoLines(geojson, scene, GEO_FEATURE.COASTLINE);
    }).catch(error => {
        console.error('Error processing GeoJSON:', error);
    });



    /**********************************************/
    /*                 Main loop                  */
    /**********************************************/

    function render(/*time*/) {
        // time *= 0.001; // convert time to seconds

        renderer.render(scene, camera);
        camera.update();

        animationFrameId = requestAnimationFrame(render);
    }

    let animationFrameId = requestAnimationFrame(render);

    return () => {
        window.removeEventListener('resize', onWindowResize);
        cancelAnimationFrame(animationFrameId);
        camera.dispose();
        renderer.dispose();
        globe.dispose();
    };
}

// TEMPORARY to work on visualization
async function fetchGeoJSON(file_name) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${file_name}/${file_name}.geojson`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('GeoJSON fetch failed:', error);
        throw error;
    }
}