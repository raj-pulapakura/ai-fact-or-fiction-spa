import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import GameRound from '../Game/GameRound';

export type Players = Record<string, { name: string, isHost: boolean }>;

enum Stage {
    GAME_CODE,
    PLAYER_NAME,
    LOBBY,
    GAME
}

const LobbyPage: React.FC = () => {
    const socket = useSocket();
    const [gameId, setGameId] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const [players, setPlayers] = useState<Players>({});
    const [isHost, setIsHost] = useState<boolean>(false);
    const [maxRounds, setMaxRounds] = useState<number>(3);
    const [stage, setStage] = useState<Stage>(Stage.GAME_CODE);

    // Game state

    // Listen for server updates (game state updates)
    useEffect(() => {
        if (socket) {
            socket.on('updatePlayers', (data: { players: any }) => {
                setPlayers(data.players);
            });

            socket.on('gameCreated', (data: { gameId: string, hostName: string }) => {
                setGameId(data.gameId);
                setStage(Stage.LOBBY);
            });

            socket.on('gameJoined', (data: { players: any }) => {
                setPlayers(data.players);
                setStage(Stage.LOBBY);
            });

            socket.on('gameStarted', () => {
                setStage(Stage.GAME);
            });
        }
        return () => {
            if (socket) {
                socket.off('updatePlayers');
                socket.off('gameCreated');
                socket.off('gameJoined');
            }
        };
    }, [socket]);

    const proceedToPlayerNameStage = (isCreating: boolean) => {
        setStage(Stage.PLAYER_NAME);
        setIsHost(isCreating);
    }

    const handleJoinGame = () => {
        if (!playerName) return;

        if (isHost) {
            socket?.emit('createGame', { playerName, maxRounds });
        } else if (gameId) {
            socket?.emit('joinGame', { gameId, playerName });
        }
    };

    const startGame = () => {
        if (gameId) {
            socket?.emit('startGame', gameId);
        }
    }

    useEffect(() => {
        if (stage === Stage.GAME) {
            socket?.emit('startRound', gameId);
        }
    }, [stage])

    return (
        <div>
            <h1>AI Fact or Fiction</h1>

            {
                stage === Stage.GAME_CODE &&
                <div>
                    <div>
                        <input
                            placeholder="Enter code"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                        />
                        <button onClick={() => proceedToPlayerNameStage(false)}>Join</button>
                    </div>

                    <button onClick={() => proceedToPlayerNameStage(true)}>Create</button>
                </div>
            }

            {
                stage === Stage.PLAYER_NAME &&
                <div>
                    <input
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                    {
                        isHost &&
                        <div>
                            <label>Max Rounds:</label>
                            <input
                                type="number"
                                value={maxRounds}
                                onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                            />
                        </div>
                    }
                    <button onClick={handleJoinGame}>Join</button>
                </div>
            }

            {
                stage === Stage.LOBBY &&
                <div>
                    <h1>Game Code: {gameId}</h1>
                    <h2>Players:</h2>
                    <ul>
                        {Object.keys(players).map((socketId) => (
                            <li key={socketId}>
                                {players[socketId].name}
                                {players[socketId].isHost && ' (Host)'}
                            </li>
                        ))}
                    </ul>
                    {
                        isHost
                            ? <button onClick={startGame}>Start Game</button>
                            : <p>Waiting for host to start the game...</p>
                    }
                </div>
            }

            {
                stage === Stage.GAME &&
                <GameRound socket={socket} gameId={gameId} players={players} maxRounds={maxRounds} />
            }
        </div>
    );
};

export default LobbyPage;
