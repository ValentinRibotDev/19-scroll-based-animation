import * as THREE from 'three'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'

/**
 * Clé API
 */
const apiKey = 'xxx'

// Weather variables
let weather = null 
let temp = null 
let wind = null 
let currentWeather = null
let targetRotation = 0 

/**
 * Fetch météo avec coordonnées
 */
async function fetchGeoloc(lat, lon, apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        const data = await response.json();
        updateWeatherUI(data)
    } catch (err) {
        console.error('Erreur lors de la requête fetch :', err);
    }
}

/**
 * Fetch météo avec nom de ville
 */
async function fetchGeocode(city, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    const data = await response.json();
    updateWeatherUI(data)
  } catch (err) {
    console.error('Erreur lors de la requête fetch :', err);
  }
}

/**
 * Mise à jour UI + variables météo
 */
const textCity = document.querySelector('.cityText')

function updateWeatherUI(data) {
    weather = data.weather[0].description
    temp = Math.round(data.main.temp)
    wind = data.wind.speed

    console.log("Ville :", data.name)
    console.log("Météo récupérée :", weather)
    console.log("Température récupérée :", temp, '°C')
    console.log("Vitesse du vent :", wind, 'm/s') 

    textCity.textContent = data.name
    document.querySelector('.windText').textContent = `Vitesse du vent ${wind} m/s`
    document.querySelector('.tempText').textContent = `Température actuelle ${temp} °C`

    if (weather !== currentWeather) {
        currentWeather = weather
        updateTargetRotation(weather)
    }

    // Mise à jour des positions UI immédiatement
    updateInfoPosition(currentWeather)
}

/**
 * Geolocalisation automatique à l’arrivée
 */
function maPosition(position) {
    const lat = position.coords.latitude
    const lon = position.coords.longitude
    fetchGeoloc(lat, lon, apiKey)
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(maPosition)
}

/**
 * Input ville
 */
const cityInput = document.querySelector('.cityInput')
cityInput.addEventListener('change', async () => {
    const cityName = cityInput.value.trim()
    if (cityName) {
        fetchGeocode(cityName, apiKey)
    }
})

/**
*  Animation weatherGroup 
*/
function updateTargetRotation(newWeather) {
    if (newWeather === 'clear sky') {
        targetRotation = Math.PI * 0
    }
    else if (newWeather.includes('rain')) {
        targetRotation = Math.PI * 0.5
    }
    else if (newWeather.includes('snow')) {
        targetRotation = Math.PI
    }
    else if (newWeather.includes('clouds')) {
        targetRotation = -Math.PI * 0.5
    }
}

/**
 * Debug
 */
// const gui = new GUI()

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

const weatherGroup = new THREE.Group()
scene.add(weatherGroup)

/**
 * Loader
 */
const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

/**
 * Objects
 */
// Textures
const sunColor = textureLoader.load('/textures/bakedSun.jpg')
sunColor.flipY = false
sunColor.colorSpace = THREE.SRGBColorSpace

const rainColor = textureLoader.load('/textures/bakedRain.jpg')
rainColor.flipY = false
rainColor.colorSpace = THREE.SRGBColorSpace

const cloudColor = textureLoader.load('/textures/bakedCloud.jpg')
cloudColor.flipY = false
cloudColor.colorSpace = THREE.SRGBColorSpace

const snowColor = textureLoader.load('/textures/bakedSnow.jpg')
snowColor.flipY = false
snowColor.colorSpace = THREE.SRGBColorSpace

//Material
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunColor })
const rainMaterial = new THREE.MeshBasicMaterial({ map: rainColor })
const snowMaterial = new THREE.MeshBasicMaterial({ map: snowColor })
const cloudMaterial = new THREE.MeshBasicMaterial({ map: cloudColor })

/**
 * Meshes
*/
//Sun Scene
let sunModel = null
gltfLoader.load(
    '/models/Sun_scene.glb',
    (gltf) => {
        sunModel = gltf.scene
        sunModel.position.y = 3     
        sunModel.scale.set(1, 1, 1)  
        sunModel.rotation.y = -Math.PI * 0.5
        sunModel.traverse((child) => { child.material = sunMaterial })
        weatherGroup.add(sunModel)
    }
)

//Rain Scene
let rainModel = null
gltfLoader.load(
    '/models/Rain_scene.glb',
    (gltf) => {
        rainModel = gltf.scene
        rainModel.scale.set(1, 1, 1)
        rainModel.position.x = 3
        rainModel.rotation.z = -Math.PI * 0.5
        rainModel.rotation.x = -Math.PI * 0.5
        rainModel.traverse((child) => { child.material = rainMaterial })
        weatherGroup.add(rainModel)
    }
)

//Snow Scene
let snowModel = null
gltfLoader.load(
    '/models/Snow_scene.glb',
    (gltf) => {
        snowModel = gltf.scene
        snowModel.scale.set(1, 1, 1)  
        snowModel.position.y = -3
        snowModel.rotation.y = Math.PI * 0.5
        snowModel.rotation.z = Math.PI
        snowModel.traverse((child) => { child.material = snowMaterial })
        weatherGroup.add(snowModel)
    }
)

//Cloud Scene
let cloudModel = null
gltfLoader.load(
    '/models/Cloud_scene.glb',
    (gltf) => {
        cloudModel = gltf.scene
        cloudModel.scale.set(1, 1, 1)
        cloudModel.position.x = -3
        cloudModel.rotation.x = Math.PI * 0.5
        cloudModel.rotation.z = Math.PI * 0.5
        cloudModel.traverse((child) => { child.material = cloudMaterial })
        weatherGroup.add(cloudModel)
    }
)

weatherGroup.position.y = 3

/**
 * Light
 */
const ambientLight = new THREE.AmbientLight('#ffffff', 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.position.set(0,5,8)
directionalLight.lookAt(0,3,0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 0.1, 100)
camera.position.y = 6
camera.position.z = 4.2
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Cursor
 */
const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
    cursor.x = (event.clientX / sizes.width) - 0.5
    cursor.y = (event.clientY / sizes.height) - 0.5
})

/**
 * Lerp Angle function
 */
function lerpAngle(a, b, t) {
  let diff = (b - a + Math.PI) % (2 * Math.PI) - Math.PI
  return a + diff * t
}

/**
 * HTML Info
 */
const infoCity = document.querySelector('.infoCity')
const infoTemp = document.querySelector('.infoTemp')
const infoWind = document.querySelector('.infoWind')
const background = document.querySelector('html')

const infoPositions = {
    "clear sky": {
        city: {top: '82%', left: '50%'},
        temp: { top: "27.5%", left: "79.5%" },
        wind: { top: "30%", left: "16.8%" },
        background: '#8fbbb9'
    },
    "rain": {
        city: {top: '65%', left: '50%'},
        temp: { top: "55%", left: "22.5%" },
        wind: { top: "25%", left: "49.8%" },
        background: '#4c5757ff'
    },
    "snow": {
        city: {top: '77%', left: '50%'},
        temp: { top: "50%", left: "50%" },
        wind: { top: "50%", left: "50%" },
        background: '#ffffffff',
        color: '#000000'
    },
    "clouds": {
        city: {top: '87%', left: '50%'},
        temp: { top: "34.5%", left: "48.5%" },
        wind: { top: "44.5%", left: "21%" },
        background: '#b39c8dff'
    }
}

function updateInfoPosition(weather) {
    let key = Object.keys(infoPositions).find(k => weather.includes(k))
    if (!key) return

    const pos = infoPositions[key]
    Object.assign(infoCity.style, pos.city)
    Object.assign(infoTemp.style, pos.temp)
    Object.assign(infoWind.style, pos.wind)
    if (pos.background) background.style.background = pos.background
    if(pos.color) textCity.style.color = pos.color
}

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if (weather) {
        weatherGroup.rotation.z = lerpAngle(
            weatherGroup.rotation.z,
            targetRotation,
            deltaTime * 5
        )

        const diff = Math.abs(weatherGroup.rotation.z - targetRotation)
        if (diff > 0.05) {
            infoTemp.style.opacity = 0
            infoWind.style.opacity = 0
        } else {
            infoTemp.style.opacity = 1
            infoWind.style.opacity = 1
        }
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
