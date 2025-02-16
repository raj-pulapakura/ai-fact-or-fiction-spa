import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Players } from '../Lobby/LobbyPage';

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

export default function GameRound({  socket, players, maxRounds }: GameRoundProps) {
    const [roundLoading, setRoundLoading] = useState<boolean>(true);
    const [roundIndex, setRoundIndex] = useState<number>(0);
    const [fact, setFact] = useState<string>('');
    const [vote, setVote] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(30);
    const [roundResults, setRoundResults] = useState<Record<string, string>>({});
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
                setRoundIndex(data.roundIndex);
            });

            socket.on('roundResults', (data: { correctAnswer: string; results: Record<string, string> }) => {
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
                console.log("GAme results", data.results);
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
        socket?.emit('submitVote', { vote });
    };

    if (roundLoading) {
        return <h1>Loading...</h1>;
    }

    return (
        <div>
            <h1>Game Round {roundIndex + 1}/{maxRounds}</h1>

            {
                stage === Stage.QUESTION &&
                <div>
                    <p>{fact}</p>
                    <div>
                        <button onClick={() => handleVote('fact')} disabled={vote !== null}>
                            Fact
                        </button>
                        <button onClick={() => handleVote('fiction')} disabled={vote !== null}>
                            Fiction
                        </button>
                    </div>
                    <h3>Time Remaining: {timeRemaining}s</h3>
                </div>
            }

            {
                stage === Stage.RESULTS &&
                <div>
                    <h2>Round Results</h2>
                    <ul>
                        {Object.entries(roundResults).map(([playerId, isCorrect]) => (
                            <li key={playerId}>
                                {playerId === socket?.id ? 'You' : players[playerId].name} - {isCorrect ? 'Correct' : 'Incorrect'}
                            </li>
                        ))}
                    </ul>
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
        </div>
    );

}