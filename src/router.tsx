import { createBrowserRouter } from 'react-router-dom';
import LobbyPage from './pages/Lobby/LobbyPage';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LobbyPage />
    },
]);