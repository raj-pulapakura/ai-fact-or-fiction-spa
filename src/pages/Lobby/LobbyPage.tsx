import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import GameRound from '../Game/GameRound';
import logoUrl from "../../assets/logo.png";
import Button from '../../components/Button';
import Section from '../../components/Section';
import Input from '../../components/Input';
import Icon from '../../components/Icon';
import { categories as allCategories } from "../../constants/categories";

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
    const [numRounds, setNumRounds] = useState<number>(3);
    const [categories, setCategories] = useState<{ category: string, playerName: string, icon: string, description: string }[]>(
        allCategories.map(category => ({
            category: category.label,
            playerName: "",
            icon: category.icon,
            description: category.description
        }))
    );
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

            socket.on('gameJoined', (data: { players: any, selectedCategories: { value: string, playerName: string }[] }) => {
                setPlayers(data.players);
                setStage(Stage.LOBBY);
                setCategories(categories => categories.map(c => {
                    const selectedCategory = data.selectedCategories.find(sc => sc.value === c.category);
                    if (selectedCategory) {
                        return { ...c, playerName: selectedCategory.playerName };
                    }
                    return c;
                }
                ));
            });

            socket.on('gameStarted', () => {
                setStage(Stage.GAME);
            });

            socket.on('categorySelected', (data: { category: string, playerName: string }) => {
                setCategories(categories => categories.map(c => c.category === data.category ? { ...c, playerName: data.playerName } : c));
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
            socket?.emit('createGame', { playerName, numRounds });
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

    const selectCategory = (category: string) => {
        if (gameId) {
            socket?.emit('selectCategory', { gameId, category });
        }
    }

    return (
        <div className="mx-auto mt-16 flex flex-col items-center">
            <img className="absolute top-5 left-1/2 -translate-x-1/2 w-32" src={logoUrl} />

            {
                stage === Stage.GAME_CODE &&
                <div className="sm:w-11/12 md:w-8/12 lg:w-1/2 xl:w-1/3 2xl:w-1/4 mx-auto mt-16">
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
                <div className="sm:w-11/12 md:w-8/12 lg:w-1/2 xl:w-1/3 2xl:w-1/4 mx-auto mt-16">
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
                                            value={numRounds}
                                            onChange={(e: any) => setNumRounds(parseInt(e.target.value))}
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
                <div className="text-center mx-auto mt-16 ">
                    <h1 className="text-6xl text-center">
                        Code: {gameId}
                        <Icon
                            className="ml-5 hover:cursor-pointer hover:scale-105 transition-all hover:bg-pink-200 p-1 rounded-md"
                            style={{ fontSize: "3rem" }}
                            onClick={() => {
                                navigator.clipboard.writeText(gameId);
                                alert(`${gameId} => Copied to clipboard!`);
                            }}
                        >
                            content_copy</Icon>
                    </h1>
                    {
                        isHost
                            ? <>
                                <Button disabled={Object.keys(players).length == 1} className="hidden md:block absolute top-4 right-4 w-fit" onClick={startGame}>Start Game</Button>
                                <Button disabled={Object.keys(players).length == 1} className="flex md:hidden absolute top-4 right-4 w-fit " onClick={startGame}>
                                    <Icon style={{ fontSize: "2.3rem" }}>play_arrow</Icon>
                                </Button>
                            </>
                            : <p className="mt-12">Waiting for host to start the game...</p>
                    }

                    <div className="sm:w-11/12 md:w-3/4 lg:w-7/12 xl:w-1/2 mt-12 px-10 mx-auto flex justify-center flex-wrap gap-10">
                        {Object.keys(players).map((socketId) => (
                            <div className="bg-white p-3 w-fit rounded-lg shadow-[-10px_10px] shadow-primary animate-jump-in animate-delay-300 animate-once" key={socketId}>
                                <h2 className="text-2xl ">
                                    {players[socketId].name}
                                    {players[socketId].isHost && ' (Host)'}
                                </h2>
                            </div>
                        ))}
                    </div>


                    <p className="mt-16 px-10" >While you're waiting, pick a category you'd like to play:</p>
                    <div className="sm:w-11/12 md:w-3/4 lg:w-7/12 xl:w-1/2 mt-12 mx-auto flex justify-center flex-wrap gap-10 mb-10">
                        {categories.map(({ category, playerName: categoryPlayerName, icon }, index) => {
                            const playerHasSelected = categories.some(c => c.playerName === playerName);
                            const buttonDisabled = playerHasSelected || !!categoryPlayerName;

                            return (
                                <div className={`relative animate-jump-in animate-delay-${index * 100} animate-once`}>
                                    <button
                                        key={index}
                                        className={`relative bg-white ${buttonDisabled ? "opacity-70" : "hover:shadow-[-10px_10px_violet]"} p-3 w-fit rounded-lg flex items-center gap-2 ${buttonDisabled ? "" : "hover:scale-105 transition-all"}`}
                                        onClick={() => selectCategory(category)}
                                        disabled={buttonDisabled}
                                    >
                                        <Icon style={{ fontSize: "2rem" }}>{icon}</Icon>
                                        <h2 className="text-xl ">
                                            {category}
                                        </h2>
                                    </button>
                                    {categoryPlayerName && <p className="absolute -top-2 -right-2 text-md bg-primary text-white px-2 rounded-full">{categoryPlayerName}</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            }

            {
                stage === Stage.GAME &&
                <GameRound socket={socket} gameId={gameId} players={players} numRounds={numRounds} />
            }
        </div >
    );
};

export default LobbyPage;
