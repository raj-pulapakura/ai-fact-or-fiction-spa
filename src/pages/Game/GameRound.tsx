import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Players } from '../Lobby/LobbyPage';
import Section from '../../components/Section';
import Option from '../../components/Option';
import Icon from '../../components/Icon';

interface GameRoundProps {
    gameId: string;
    socket: Socket | null;
    players: Players;
    maxRounds: number;
}

enum Stage {
    QUESTION,
    RESULTS,
    GAME_OVER
}

type GameResults = {
    playerId: string;
    name: string;
    score: number;
    rank: number;
}[]

export default function GameRound({ socket, players, maxRounds }: GameRoundProps) {
    const [roundLoading, setRoundLoading] = useState<boolean>(true);
    const [roundIndex, setRoundIndex] = useState<number>(0);
    const [fact, setFact] = useState<string>('');
    const [vote, setVote] = useState<string | null>(null);
    const [voteSelected, setVoteSelected] = useState<boolean>(false);
    const [rummageIcon, setRummageIcon] = useState<string>('');
    const [timeRemaining, setTimeRemaining] = useState<number>(30);
    const [roundResults, setRoundResults] = useState<{ socketId: string, name: string, points: number }[]>([]);
    const [nextRoundTimer, setNextRoundTimer] = useState<number>(5);
    const [gameResults, setGameResults] = useState<GameResults>([]);

    const [stage, setStage] = useState<Stage>(Stage.QUESTION);

    useEffect(() => {
        if (socket) {
            socket.on('newRound', (data: { fact: string, roundIndex: number }) => {
                setRoundLoading(false);
                setStage(Stage.QUESTION);
                setFact(data.fact);
                setVote(null);
                setVoteSelected(false);
                setRoundIndex(data.roundIndex);
            });

            socket.on('roundResults', (data: { correctAnswer: string; results: { socketId: string, name: string, points: number }[] }) => {
                console.log('Round Results:', data);
                console.log(socket.id);
                setRoundResults(data.results);
                setTimeRemaining(0);
                setStage(Stage.RESULTS);
            });

            socket.on('countdown', (seconds: number) => {
                if (stage === Stage.RESULTS) {
                    // Ignore countdown if showing results as the server will keep updating the countdown
                    setTimeRemaining(0);
                    return;
                };
                setTimeRemaining(seconds);
            });

            socket.on('next-round-countdown', (seconds: number) => {
                setNextRoundTimer(seconds);
            });

            socket.on('gameOver', (data: { results: GameResults }) => {
                console.log("Game results", data.results);
                setGameResults(data.results);
                setStage(Stage.GAME_OVER);
            });

            return () => {
                if (socket) {
                    socket.off('newRound');
                    socket.off('roundResults');
                    socket.off('countdown');
                }
            };
        };
    }, [socket]);

    const handleVote = (vote: string) => {
        setVote(vote);
        socket?.emit('submitVote', { vote, timeRemaining });
    };

    useEffect(() => {
        const rummageIcons = ["sprint", "lightbulb", "menu_book", "hotel_class", "cognition"].filter(icon => icon !== rummageIcon);

        if (voteSelected) {
            const interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * rummageIcons.length);
                setRummageIcon(rummageIcons[randomIndex]);
            }, 300);
            return () => clearInterval(interval);
        }

        return () => { };
    }, [voteSelected]);

    if (roundLoading) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="w-full ">
            {
                stage === Stage.QUESTION &&
                <div className="mt-12">
                    {
                        voteSelected
                            ? <div className="mx-auto w-11/12 flex flex-col items-center">
                                <p>Genius?</p>
                                <Icon style={{ fontSize: "5rem" }}>{rummageIcon}</Icon>
                            </div>
                            : <Section className="mx-auto w-11/12">
                                <p className="text-3xl">{roundIndex + 1}. {fact}</p>
                                <div className="mt-12 flex gap-2">
                                    <Option onClick={() => { handleVote('fact'); setVoteSelected(true); }} disabled={vote !== null}>
                                        Fact
                                    </Option>
                                    <Option onClick={() => { handleVote('fiction'); setVoteSelected(true); }} disabled={vote !== null}>
                                        Fiction
                                    </Option>
                                </div>
                                <div className="flex items-center justify-start mt-6 gap-1 text-4xl">
                                    <Icon style={{ fontSize: "2.8rem" }}>schedule</Icon>
                                    <h3>{timeRemaining}</h3>
                                </div>
                            </Section>
                    }

                </div >
            }

            {
                stage === Stage.RESULTS &&
                <div>
                    <h2>Round Results</h2>
                    <div>
                        {roundResults.map(({ socketId, name, points }) => (
                            <p key={socketId}>
                                {name} - {points} points
                            </p>
                        ))}
                    </div>
                    <h3>Next round starting in {nextRoundTimer}s</h3>
                </div>
            }

            {
                stage === Stage.GAME_OVER && gameResults.length > 0 &&
                <div>
                    <h2>Game Over</h2>
                    <h3>Final Results</h3>
                    <ul>
                        {gameResults.map((result, index) => (
                            <li key={result.playerId}>
                                {index + 1}. {result.name} - {result.score} points
                            </li>
                        ))}
                    </ul>
                </div>
            }
        </div >
    );

}