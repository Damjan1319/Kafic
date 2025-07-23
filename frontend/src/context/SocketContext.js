import React, {createContext, useContext, useEffect, useState} from 'react';
import io from 'socket.io-client';
import {API_URL} from "../index";

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({children}) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to socket using proxy
        const socket = io(API_URL, {
            withCredentials: false,
        });

        setSocket(socket);

        return () => {
            socket.close();
        };
    }, []);

    const value = {
        socket
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export {SocketContext};