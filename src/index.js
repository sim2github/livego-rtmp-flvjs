import flvjs from 'flv.js'
import 'main.css'

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search),
        streamName = urlParams.get('stream') || 'vscode',
        streamHost = urlParams.get('host') || window.location.hostname,
        mediaDataSource = {
            url: `http://${streamHost}:7001/live/${streamName}.flv`,
            type: 'flv',
            isLive: true,
            //TODO test cors when streamHost not current hostname
            cors: true,
        },
        options =
        {
            enableWorker: false,
            enableStashBuffer: false,
        }


    document.getElementById('play').addEventListener('click', function () {
        const player = flvjs.createPlayer(mediaDataSource, options),
        container = document.getElementById('video-container'),
        button = this,
        video = document.createElement('video')
       
        video.innerHTML = 'Your browser is too old which doesn\'t support HTML5 video.'
        video.setAttribute('name', 'videoElement')
        video.setAttribute('controls', true)
        video.classList.add('centered')

        container.append(video)
        
        player.attachMediaElement(video)
        player.load()
        player.play()
        button.remove()
    })
});