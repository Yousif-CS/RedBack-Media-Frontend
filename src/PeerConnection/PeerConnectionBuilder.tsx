import React, { useRef, useEffect, useState } from 'react';
import EventSocket from "../EventSocket";


interface host {
    hostname: string,
    port: number
}

/**
 * sets up the required event callbacks to establish the connection
 * @param eventSocket the signaling channel to setup the callbacks with
 * @param peerConnection 
 */
function handleNegotiation(eventSocket:EventSocket, peerConnection:RTCPeerConnection){
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

    });

    eventSocket.onEvent("icecandidate", function(candidate:string){
        peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
    });

}

/**
 * serializes the newly gathered ice candidate and sends it to the other end
 * @param eventSocket the signaling channel used to send the ice candidate
 * @param peerConnection 
 * @param event the object that holds the ice candidate
 */
function handleIceCandidate(eventSocket:EventSocket, peerConnection:RTCPeerConnection, event:RTCPeerConnectionIceEvent){
    if (event.candidate){
        peerConnection.addIceCandidate(event.candidate)
            .then(() => {
                eventSocket.emitEvent("icecandidate", JSON.stringify(event?.candidate?.toJSON()));
            });
    }
}

/**
 * Creates a peer connection and sets the appropriate event handlers
 * @param eventSocket the signaling channel used to send and receive offers/answers etc..
 * @param streamVideo the video object to which the stream will be connected
 */
function createPeerConnection(eventSocket: EventSocket, streamVideo:React.MutableRefObject<HTMLVideoElement>): RTCPeerConnection{
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
    const peerConnection:RTCPeerConnection = new RTCPeerConnection(config);
    
    peerConnection.ontrack = function(event: RTCTrackEvent) {
        streamVideo.current.srcObject = event.streams[0];
        console.log("video should be ready");
    }
    
    peerConnection.onicecandidate = function(event: RTCPeerConnectionIceEvent){
        handleIceCandidate(eventSocket, peerConnection, event);
    };


    handleNegotiation(eventSocket, peerConnection);

    return peerConnection;
}

/**
 * creates the required signaling channel and connects to the media host to establish a peer connection
 * @param streamVideo the video object on to which the stream will be attached
 * @param host the host details object
 */
function establish( pc:React.MutableRefObject<RTCPeerConnection|undefined>,
                    streamVideo:React.MutableRefObject<HTMLVideoElement>, 
                    host:host ) {

    var webSocket: WebSocket = new WebSocket("ws://" + host.hostname + ":" + host.port);

    webSocket.onopen = () => {
        var eventSocket: EventSocket = new EventSocket(webSocket,
        function(payload: string){
            console.log(payload);
        });
        pc.current = createPeerConnection(eventSocket, streamVideo);
    };
}

/**
 * A peer connection builder used to display the media stream from the other end 
 * @param props 
 */
const PeerConnectionBuilder = (props:host) => {
    const streamVideo = useRef(document.createElement('video'));
    const peerConnection = useRef<RTCPeerConnection>();

    useEffect(() => {
        establish(peerConnection, streamVideo, props);
    });

    return (<div>
        <video autoPlay ref={streamVideo}></video>
    </div>)
} 

export default PeerConnectionBuilder;