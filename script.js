/**
 * Debug
 */
const gui = new dat.GUI({ closed: true, width: 350 });

const parameters = {
	count: 250000,
	radius: 5,
	branches: 4,
	// spin: 1,
	randomness: 0.8,
	randomnessPower: 4,
	insideColor: "#ff8800",
	outsideColor: "#8800ff",
	pointSize: 30,
	BHSize: 0.15
};

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// TextureLoader
const textureLoader = new THREE.TextureLoader();
const starTexture = textureLoader.load(
	"https://assets.codepen.io/22914/star_02.png"); // star_[00-08].png

const texture = textureLoader.load(
	"https://assets.codepen.io/22914/eso0932a.jpg",
	() => {
		const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
		rt.fromEquirectangularTexture(renderer, texture);
		scene.background = rt;
	}
);

/**
 * Object
 */
let geometry = null;
let material = null;
let points = null;

const generateGalaxy = () => {
	if (points !== null) {
		geometry.dispose();
		material.dispose();
		scene.remove(points);
	}

	/**
	 * Geometry
	 */
	geometry = new THREE.BufferGeometry();

	const positions = new Float32Array(parameters.count * 3);
	const colors = new Float32Array(parameters.count * 3);
	const scales = new Float32Array(parameters.count);
	const randomness = new Float32Array(parameters.count * 3);
	const insideColor = new THREE.Color(parameters.insideColor);
	const outsideColor = new THREE.Color(parameters.outsideColor);

	for (let i = 0; i < parameters.count; i++) {
		const i3 = i * 3;

		// Position
		const radius = Math.random() * parameters.radius;

		const branchAngle =
		i % parameters.branches / parameters.branches * Math.PI * 2;

		const randomX =
		Math.pow(Math.random(), parameters.randomnessPower) * (
		Math.random() < 0.5 ? 1 : -1) *
		parameters.randomness *
		radius;
		const randomY =
		Math.pow(Math.random(), parameters.randomnessPower) * (
		Math.random() < 0.5 ? 1 : -1) *
		parameters.randomness *
		radius;
		const randomZ =
		Math.pow(Math.random(), parameters.randomnessPower) * (
		Math.random() < 0.5 ? 1 : -1) *
		parameters.randomness *
		radius;

		positions[i3] = Math.cos(branchAngle) * radius;
		positions[i3 + 1] = 0;
		positions[i3 + 2] = Math.sin(branchAngle) * radius;

		// Randomness
		randomness[i3] = randomX;
		randomness[i3 + 1] = randomY;
		randomness[i3 + 2] = randomZ;

		// Color
		const mixedColor = insideColor.clone();
		mixedColor.lerp(outsideColor, radius / parameters.radius);

		colors[i3] = mixedColor.r;
		colors[i3 + 1] = mixedColor.g;
		colors[i3 + 2] = mixedColor.b;

		// Scales
		scales[i] = Math.random();
	}

	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
	geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
	geometry.setAttribute(
	"aRandomness",
	new THREE.BufferAttribute(randomness, 3));

	/**
	 * Material
	 */
	material = new THREE.ShaderMaterial({
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		vertexShader: document.getElementById("vertexShader").textContent,
		fragmentShader: document.getElementById("fragmentShader").textContent,
		transparent: true,
		uniforms: {
			uTime: { value: 0 },
			uSize: { value: parameters.pointSize * renderer.getPixelRatio() },
			uHoleSize: { value: parameters.BHSize },
			uTexture: { value: starTexture },
			size: { value: 1.0 }
		}
	});

	/**
	 * Points
	 */
	points = new THREE.Points(geometry, material);
	scene.add(points);
};

gui.
add(parameters, "count").
min(100).
max(1000000).
step(100).
onFinishChange(generateGalaxy).
name("Star count");
gui.
add(parameters, "radius").
min(0.01).
max(20).
step(0.01).
onFinishChange(generateGalaxy).
name("Galaxy radius");
gui.
add(parameters, "branches").
min(2).
max(20).
step(1).
onFinishChange(generateGalaxy).
name("Galaxy branches");
gui.
add(parameters, "randomness").
min(0).
max(2).
step(0.001).
onFinishChange(generateGalaxy).
name("Randomness position");
gui.
add(parameters, "randomnessPower").
min(1).
max(10).
step(0.001).
onFinishChange(generateGalaxy).
name("Randomness power");
gui.
addColor(parameters, "insideColor").
onFinishChange(generateGalaxy).
name("Galaxy inside color");
gui.
addColor(parameters, "outsideColor").
onFinishChange(generateGalaxy).
name("Galaxy outside color");

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight };


window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
75,
sizes.width / sizes.height,
0.1,
100);

camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas });

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

generateGalaxy();

gui.
add(parameters, "pointSize").
min(1).
max(100).
step(0.001).
onFinishChange(generateGalaxy).
name("Point size");

gui.
add(parameters, "BHSize").
min(0).
max(1).
step(0.001).
onFinishChange(generateGalaxy).
name("Black hole size");

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	material.uniforms.uTime.value = elapsedTime;

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();