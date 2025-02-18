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
                console.log(data.players);
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
        <div className="mx-auto mt-16 flex flex-col items-center">
            <img className={`${stage === Stage.GAME ? "w-[300px]" : "w-fit"} transition-all`} src={logoUrl} />

            {
                stage === Stage.GAME_CODE &&
                <div className="w-1/2 mx-auto mt-16">
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
                        <Button className="w-full" btype="border" onClick={() => proceedToPlayerNameStage(true)}>Create</Button>
                    </div>

                </div >
            }

            {
                stage === Stage.PLAYER_NAME &&
                <div className="w-1/2 mx-auto mt-16">
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
                <div className="text-center mx-auto mt-16">
                    <h1 className="text-6xl text-center">
                        Code: {gameId}
                        <Icon
                            className="ml-5 hover:cursor-pointer hover:scale-105 transition-all"
                            style={{ fontSize: "3rem" }}
                            onClick={() => navigator.clipboard.writeText(gameId)}
                        >
                            content_copy</Icon>
                    </h1>
                    <div className="mt-12 px-10 flex justify-center flex-wrap gap-10">
                        {Object.keys(players).map((socketId) => (
                            <div className="bg-white p-3 w-fit rounded-lg shadow-[-10px_10px_purple] animate-jump-in animate-delay-300 animate-once" key={socketId}>
                                <h2 className="text-2xl ">
                                    {players[socketId].name}
                                    {players[socketId].isHost && ' (Host)'}
                                </h2>
                            </div>
                        ))}
                    </div>
                    {
                        isHost
                            ? <Button className="absolute top-4 right-4 w-fit" onClick={startGame}>Start Game</Button>
                            : <p className="mt-12">Waiting for host to start the game...</p>
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
