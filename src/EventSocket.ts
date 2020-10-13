// An implementation of the EventSocket API in javascript
const websocket = require('ws');

type ICallbackFunction = (payload:string) => void;

interface IEventPayload {
    eventName: string,
    payload: string,
}

class EventSocket {

    // The underlying transport channel
    private _ws: WebSocket;
    
    // All the registered callbacks
    private _eventCallbacks: Map<string, ICallbackFunction>;

    // When the received payload is non-adherent to an event,
    // The default callback is invoked
    private _default_callback: ICallbackFunction;
    
    constructor(ws: WebSocket, default_callback: ICallbackFunction){
        this._eventCallbacks = new Map<string, ICallbackFunction>();
        this._default_callback = default_callback;
        
        this._ws = ws;
        this._ws.onmessage = (event:MessageEvent) => {
            this.event_forward(this, event.data);
        };
    }
    

    // The function that envokes the appropriate 
    // Callback when new payload is received
    private event_forward(eventSocket:EventSocket, payload: string): void {
        
        try {
            const payloadJSON: IEventPayload = JSON.parse(payload);
            
            // If the event name is not found, call default callback
            if (eventSocket._eventCallbacks.get(payloadJSON.eventName)){
                eventSocket._eventCallbacks.get(payloadJSON.eventName)?.(payloadJSON.payload);
            }else{
                eventSocket._default_callback(payloadJSON.payload);
            }

        }catch(e){
            // Call the default callback
            eventSocket._default_callback(payload);
        }
    } 

    onEvent(event: string, callback:ICallbackFunction){
        this._eventCallbacks.set(event, callback);
    }

    emitEvent(event: string, payload:string | JSON | null | undefined){
        var payloadJSON: IEventPayload = {
            eventName: event,
            payload: (typeof payload == "string")? payload: JSON.stringify(payload)
        }
        this._ws.send(JSON.stringify(payloadJSON));
    }
}

export default EventSocket;