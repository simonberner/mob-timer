const theme = require('../theme.js')

const ipc = require('electron').ipcRenderer

const containerEl = document.getElementById('container')
const toggleBtn = document.getElementById('toggleButton')
const configureBtn = document.getElementById('configureButton')
const currentEl = document.getElementById('current')
const nextEl = document.getElementById('next')
const currentPicEl = document.getElementById('currentPic')
const nextPicEl = document.getElementById('nextPic')
const nextBtn = document.getElementById('nextButton')
const timerCanvas = document.getElementById('timerCanvas')
const alertAudio = document.getElementById('alertAudio')

const context = timerCanvas.getContext('2d')

let paused = true
let alertSoundTimes = []

ipc.on('timerChange', (event, data) => {
  clearCanvas()
  drawTimerCircle()
  drawTimerArc(data.secondsRemaining, data.secondsPerTurn)
})

function clearCanvas() {
  context.clearRect(0, 0, timerCanvas.width, timerCanvas.height)
}

function drawTimerCircle() {
  const begin = 0
  const end = 2 * Math.PI
  drawArc(begin, end, "#EEEEEE")
}

function drawArc(begin, end, color) {
  const circleCenterX = timerCanvas.width / 2
  const circleCenterY = circleCenterX
  const circleRadius = circleCenterX - 6
  context.beginPath()
  context.arc(circleCenterX, circleCenterY, circleRadius, begin, end)
  context.strokeStyle = color
  context.lineWidth = 10
  context.stroke()
}

function drawTimerArc(seconds, maxSeconds) {
  let percent = 1 - (seconds / maxSeconds)
  if (percent == 0) {
    return
  }
  let begin = -(.5 * Math.PI)
  let end = begin + (2 * Math.PI * percent)
  drawArc(begin, end, theme.mobberBorderHighlightColor)
}

ipc.on('rotated', (event, data) => {
  if (!data.current) {
    data.current = { name: "Add a mobber" }
  }
  currentPicEl.src = data.current.image || "../img/sad-cyclops.png"
  currentEl.innerHTML = data.current.name

  if (!data.next) {
    data.next = data.current
  }
  nextPicEl.src = data.next.image || "../img/sad-cyclops.png"
  nextEl.innerHTML = data.next.name
})

ipc.on('paused', _ => {
  paused = true
  container.classList.add('isPaused')
  toggleBtn.classList.add('play')
  toggleBtn.classList.remove('pause')
})

ipc.on('started', _ => {
  paused = false
  container.classList.remove('isPaused')
  containerEl.classList.remove('isTurnEnded')
  toggleBtn.classList.remove('play')
  toggleBtn.classList.add('pause')
})

ipc.on('turnEnded', (event, data) => {
  paused = true
  container.classList.remove('isPaused')
  containerEl.classList.add('isTurnEnded')
  toggleBtn.classList.add('play')
  toggleBtn.classList.remove('pause')
})

ipc.on('configUpdated', (event, data) => {
  alertSoundTimes = data.alertSoundTimes
  alertAudio.src = data.alertSound || './default.mp3'
})

ipc.on('alert', (event, data) => {
  if (alertSoundTimes.some(item => item === data)) {
    alertAudio.currentTime = 0
    alertAudio.play()
  }
})

ipc.on('stopAlerts', _ => {
  alertAudio.pause()
})

toggleBtn.addEventListener('click', _ => {
  paused ? ipc.send('unpause') : ipc.send('pause')
})
nextBtn.addEventListener('click', _ => ipc.send('skip'))
configureBtn.addEventListener('click', _ => ipc.send('configure'))

ipc.send('timerWindowReady')
