let kmTotal = parseFloat(localStorage.getItem('kmTotal')) || 0;
let distanceTraveled = 0;
let prevPosition = null;
let watchId = null;
let startTime = null;
let elapsedTime = 0;
let totalSpeed = 0;
let speedCount = 0;
document.getElementById('kmTotal').innerText = kmTotal.toFixed(2);

function updateSpeedometer(speed) {
  // Convertir m/s a km/h
  let displaySpeed = speed * 3.6;
  document.getElementById('speedDisplay').innerText = displaySpeed.toFixed(1) + " km/h";
  
  // Ajustar ángulo de la aguja (0 km/h => -180°, 120 km/h => 0°)
  let clamped = Math.min(displaySpeed, 120);
  let angle = -180 + ((clamped / 120) * 180);
  document.getElementById('needle').style.transform = `translateX(-50%) rotate(${angle}deg)`;
  
  // Calcular velocidad promedio
  totalSpeed += displaySpeed;
  speedCount++;
  document.getElementById('averageSpeed').innerText = speedCount > 0 
    ? (totalSpeed / speedCount).toFixed(1) 
    : "0";
}

function startTracking() {
  if (watchId === null) {
    startTime = Date.now();
    
    // Reiniciar variables de seguimiento
    totalSpeed = 0;
    speedCount = 0;
    distanceTraveled = 0;
    prevPosition = null;

    watchId = navigator.geolocation.watchPosition(position => {
      // Usar valores por defecto si no están disponibles
      let speed = position.coords.speed || 0;
      let latitude = position.coords.latitude;
      let longitude = position.coords.longitude;
      let altitude = position.coords.altitude || 0;

      // Actualizar velocidad en el velocímetro
      updateSpeedometer(speed);

      // Actualizar tiempo transcurrido
      elapsedTime = (Date.now() - startTime) / 1000;
      let hours = Math.floor(elapsedTime / 3600);
      let minutes = Math.floor((elapsedTime % 3600) / 60);
      let seconds = Math.floor(elapsedTime % 60);
      let timeFormatted =
          String(hours).padStart(2, '0') + ':' +
          String(minutes).padStart(2, '0') + ':' +
          String(seconds).padStart(2, '0');
      document.getElementById('timeVal').innerText = timeFormatted;

      // Actualizar altitud
      document.getElementById('altitudeVal').innerText = altitude.toFixed(1) + " m";

      // Calcular distancia
      if (prevPosition) {
        let distance = calculateDistance(
          prevPosition.latitude, 
          prevPosition.longitude, 
          latitude, 
          longitude
        );
        
        if(distance > 0){
          distanceTraveled += distance;
          kmTotal += distance;
          
          // Actualizar elementos de distancia
          document.getElementById('kmTotal').innerText = kmTotal.toFixed(2);
          document.getElementById('distVal').innerText = distanceTraveled.toFixed(2) + " km";
          
          // Guardar en localStorage
          localStorage.setItem('kmTotal', kmTotal);
        }
      }

      // Actualizar posición previa
      prevPosition = { latitude, longitude };
    }, error => {
      console.error("Error obteniendo datos de GPS:", error.message);
      alert("Error obteniendo datos de GPS: " + error.message);
    }, { 
      enableHighAccuracy: true, 
      maximumAge: 0, 
      timeout: 5000 
    });

    // Intentar obtener temperatura
    obtenerTemperatura();
  }
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

function resetKM() {
  let gallons = parseFloat(prompt("Ingrese la cantidad de galones de gasolina agregados:"));
  if (!isNaN(gallons) && gallons > 0) {
    let efficiency = kmTotal / gallons;
    document.getElementById('fuelEfficiency').innerText = efficiency.toFixed(2);
    document.getElementById('lastGallons').innerText = gallons.toFixed(2);
    let now = new Date().toLocaleString();
    document.getElementById('resetTimestamp').innerText = now;
  } else {
    alert("Por favor, ingrese un valor válido de galones.");
    return;
  }
  kmTotal = 0;
  distanceTraveled = 0;
  localStorage.setItem('kmTotal', 0);
  document.getElementById('kmTotal').innerText = "0";
  document.getElementById('distVal').innerText = "0 km";
}

function resetSpeed() {
  updateSpeedometer(0);
  stopTracking();
  elapsedTime = 0;
  document.getElementById('timeVal').innerText = "00:00:00";
  document.getElementById('averageSpeed').innerText = "0";
  document.getElementById('altitudeVal').innerText = "- m";
  totalSpeed = 0;
  speedCount = 0;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function obtenerTemperatura() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(response => response.json())
        .then(data => {
          if(data && data.current_weather){
            let temp = data.current_weather.temperature;
            document.getElementById('tempVal').innerText = temp + " °C";
          }
        })
        .catch(error => {
          console.error('Error obteniendo temperatura:', error);
          document.getElementById('tempVal').innerText = "- °C";
        });
    }, error => {
      console.error("Error obteniendo ubicación para temperatura:", error);
      document.getElementById('tempVal').innerText = "- °C";
    });
  }
}

// Reloj en tiempo real para la burbuja
function updateClock() {
  const now = new Date();
  document.getElementById('clock').innerText = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);

// Código interact.js para hacer los elementos "draggable"
interact('.draggable').draggable({
  listeners: {
    move(event) {
      const target = event.target;
      const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
      const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      target.style.transform = `translate(${x}px, ${y}px)`;
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
    }
  }
});
