import { Server, Socket } from 'socket.io';

export let socketIOPostObject: Server;

export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOPostObject = io;
  }

  //listen on events
  public listen(): void {
    /**
     * .on function is a method in the Socket.IO library used to bind event listeners to a socket
     * @param eventName: The name of the event to listen for. event names can be any string.
     * connection is a built-in event provided by Socket.IO that is emitted by the server whenever a client connects to it.
     * @param callback: (...args: any[]) => void: The function that will be executed when the event is triggered. The callback function can take any number of arguments, and it does not return a value.
     */
    this.io.on('connection', (socket: Socket) => {
      console.log('Post socketio handler');
    });
  }
}
