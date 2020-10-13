import React, { useRef, useEffect, useState } from 'react';
import EventSocket from "../EventSocket";


interface host {
    hostname: string,
    port: number
}

function establish(streamVideo:React.MutableRefObject<HTMLVideoElement>, host:host){

    var webSocket: WebSocket = new WebSocket("ws://" + host.hostname + ":" + host.port);

    webSocket.onopen = () => {
        var eventSocket: EventSocket = new EventSocket(webSocket,
        function(payload: string){
            console.log(payload);
        });

    
        // Create the config object for ice servers
        const config: RTCConfiguration = {
            iceServers : [
                {
                    urls: ["stun:stun.stunprotocol.org"],
                    credential: "muazkh",
                    username: "webrtc@live.com"
                },
                {
                    urls: "turn:numb.viagenie.ca",
                    credential: "muazkh",
                    username: "webrtc@live.com"
                }
            ]
        }

        // Our Peer Connection object;
        var peerConnection:RTCPeerConnection = new RTCPeerConnection(config);
        //When the offer is received, set it 
        eventSocket.onEvent("sdp_offer", function(desc: string){

            var offer = JSON.parse(desc);
            peerConnection.
                setRemoteDescription(new RTCSessionDescription(offer))
                    .then(() => {
                        peerConnection.createAnswer()
                            .then((answer:RTCSessionDescriptionInit) => {
                                peerConnection.setLocalDescription(answer)
                                    .then(() => {
                                        eventSocket.emitEvent("sdp_answer", peerConnection.localDescription?.sdp);
                                    });
                            });
                    });

            peerConnection.ontrack = function(event: RTCTrackEvent) {
                streamVideo.current.srcObject = event.streams[0];
                console.log("video should be ready");
            }

            peerConnection.onicecandidate = function(event: RTCPeerConnectionIceEvent){
                if (event.candidate){
                    peerConnection.addIceCandidate(event.candidate)
                        .then(() => {
                            eventSocket.emitEvent("icecandidate", JSON.stringify(event?.candidate?.toJSON()));
                        });
                }
            }
        });
        eventSocket.onEvent("icecandidate", function(candidate:string){
            peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        });
        
        
    };
}

const PeerConnectionBuilder = (props:host) => {
    const streamVideo = useRef(document.createElement('video'));
    
    useEffect(() => {
        establish(streamVideo, props);
    });

    return (<div>
        <video autoPlay ref={streamVideo}></video>
    </div>)
} 

export default PeerConnectionBuilder;