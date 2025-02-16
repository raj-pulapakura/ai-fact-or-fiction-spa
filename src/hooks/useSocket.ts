import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Set up the connection URL (can be updated if deploying to a different URL)
const socketUrl = 'http://localhost:3000'; // Change if deploying on a different port

export const useSocket = (): Socket | null => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(socketUrl, {
            transports: ['websocket'], // For real-time communication
        });

        setSocket(newSocket);

        // Clean up on unmount
        return () => {
            newSocket.close();
        }
    }, []);

    return socket;
};
