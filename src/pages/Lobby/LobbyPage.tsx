import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import GameRound from '../Game/GameRound';
import logoUrl from "../../assets/logo.png";
import Button from '../../components/Button';
import Section from '../../components/Section';
import Input from '../../components/Input';
import Icon from '../../components/Icon';

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
        if (!playerName) {
            alert('Please enter your name');
            return;
        }

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
        <div className="w-fit mx-auto mt-32">
            <img src={logoUrl} />

            {
                stage === Stage.GAME_CODE &&
                <div className="w-8/12 mx-auto mt-16">
                    <Section>
                        <div className="flex flex-col">
                            <Input
                                placeholder="CODE"
                                value={gameId}
                                onChange={(e: any) => setGameId(e.target.value)}
                            />
                            <Button className="mt-4" onClick={() => proceedToPlayerNameStage(false)}>Join</Button>
                        </div>
                    </Section>

                    <div className="mt-10 mx-auto p-5">
                        <Button btype="border" onClick={() => proceedToPlayerNameStage(true)}>Create</Button>
                    </div>

                </div >
            }

            {
                stage === Stage.PLAYER_NAME &&
                <div className="w-8/12 mx-auto mt-16">
                    <Section>
                        {
                            isHost
                                ? <div className="flex flex-col">
                                    <Input
                                        placeholder="Name"
                                        value={playerName}
                                        onChange={(e: any) => setPlayerName(e.target.value)} />
                                    <div className="flex flex-col mt-2">
                                        <label className="mr-4">Rounds:</label>
                                        <Input
                                            className="w-full"
                                            type="number"
                                            value={maxRounds}
                                            onChange={(e: any) => setMaxRounds(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <Button className="mt-4" onClick={handleJoinGame}>GO!</Button>
                                </div>
                                : <div className="flex flex-col">
                                    <Input
                                        placeholder="Name"
                                        value={playerName}
                                        onChange={(e: any) => setPlayerName(e.target.value)} />

                                    <Button className="mt-4" onClick={handleJoinGame}>GO!</Button>
                                </div>
                        }

                    </Section>
                </div>
            }

            {
                stage === Stage.LOBBY &&
                <div>
                    <Icon>star</Icon>
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
        </div >
    );
};

export default LobbyPage;
