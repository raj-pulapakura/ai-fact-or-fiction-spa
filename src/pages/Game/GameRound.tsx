import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Players } from '../Lobby/LobbyPage';
import Section from '../../components/Section';
import Option from '../../components/Option';
import Icon from '../../components/Icon';
import { QuestionType } from '../../types/QuestionType.enum';
import { categories } from '../../constants/categories';

interface GameRoundProps {
    gameId: string;
    socket: Socket | null;
    players: Players;
    numRounds: number;
}

enum Stage {
    CATEGORY,
    QUESTION,
    RESULTS,
    GAME_OVER
}

type GameResults = { rank: number, name: string, points: number }[]

export default function GameRound({ socket }: GameRoundProps) {
    const [categoryLoading, setCategoryLoading] = useState<boolean>(true);
    const [roundLoading, setRoundLoading] = useState<boolean>(true);
    const [roundIndex, setRoundIndex] = useState<number>(0);
    const [question, setQuestion] = useState<string>('');
    const [answers, setAnswers] = useState<string[]>([]); // For multiple choice questions
    const [vote, setVote] = useState<any>(null);
    const [voteSelected, setVoteSelected] = useState<boolean>(false);
    const [rummageIcon, setRummageIcon] = useState<string>('');
    const [currentCategory, setCurrentCategory] = useState<string>('');
    const [categoryCountdown, setCategoryCountdown] = useState<number>(5);
    const [countdown, setCountdown] = useState<number>(25);
    const [roundResults, setRoundResults] = useState<{
        allOptions: string[],
        correctOption: number,
        results: { socketId: string, name: string, points: number }[]
    }>({ allOptions: [], correctOption: 0, results: [] });
    const [nextRoundCountdown, setNextRoundCountdown] = useState<number>(5);
    const [gameResults, setGameResults] = useState<GameResults>([]);
    const [stage, setStage] = useState<Stage>(Stage.CATEGORY);

    useEffect(() => {
        if (socket) {
            socket.on('newRound', (data: {
                question: string,
                answers: string[] | null,
                roundIndex: number
            }) => {
                setCategoryCountdown(0);
                setRoundLoading(false);
                setStage(Stage.QUESTION);
                setQuestion(data.question);
                if (data.answers) setAnswers(data.answers);
                setVote(null);
                setVoteSelected(false);
                setRoundIndex(data.roundIndex);
            });

            socket.on('roundResults', (data: {
                allOptions: string[],
                correctOption: number,
                results: { socketId: string, name: string, points: number }[]
            }) => {
                setRoundResults(data);
                setCountdown(0);
                setStage(Stage.RESULTS);
            });

            socket.on('newCategory', (category: string) => {
                setCategoryLoading(false);
                setCurrentCategory(category);
            });

            socket.on('categoryCountdown', (seconds: number) => {
                setStage(Stage.CATEGORY);
                setCategoryCountdown(seconds);
            });

            socket.on('countdown', (seconds: number) => {
                if (stage === Stage.RESULTS) {
                    // Ignore countdown if showing results as the server will keep updating the countdown
                    setCountdown(0);
                    return;
                };
                setCountdown(seconds);
            });

            socket.on('next-round-countdown', (seconds: number) => {
                setNextRoundCountdown(seconds);
            });

            socket.on('gameOver', (data: { gameResults: GameResults }) => {
                setGameResults(data.gameResults);
                setStage(Stage.GAME_OVER);
            });

            return () => {
                if (socket) {
                    socket.off('newRound');
                    socket.off('roundResults');
                    socket.off('newCategory');
                    socket.off('categoryCountdown');
                    socket.off('countdown');
                    socket.off('next-round-countdown');
                    socket.off('gameOver');
                }
            };
        };
    }, [socket]);

    const handleVote = (vote: any) => {
        setVote(vote);
        socket?.emit('submitVote', { vote, timeRemaining: countdown });
    };

    useEffect(() => {
        const rummageIcons = ["sprint", "lightbulb", "menu_book", "hotel_class", "cognition"];

        if (voteSelected) {
            const interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * (rummageIcons.length - 1));
                setRummageIcon(currIcon => rummageIcons.filter(icon => icon !== currIcon)[randomIndex]);
            }, 300);
            return () => clearInterval(interval);
        }

        return () => { };
    }, [voteSelected]);

    useEffect(() => {
        console.log(gameResults);
    }, [
        gameResults
    ]);

    if (roundLoading && categoryLoading) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="w-full ">
            {
                stage === Stage.CATEGORY &&
                <div className="mt-12 mx-auto w-fit flex flex-col items-center gap-5">
                    <h2>Category</h2>
                    <div
                        className={`relative bg-white hover:shadow-[-10px_10px_violet] p-3 w-fit rounded-lg flex items-center gap-2 hover:scale-105 transition-all`}
                    >
                        <Icon style={{ fontSize: "2rem" }}>{categories.find(c => c.label === currentCategory)?.icon}</Icon>
                        <h2 className="text-xl ">
                            {currentCategory}
                        </h2>
                    </div>
                    <div className="flex items-center justify-start gap-1 text-4xl">
                        <Icon style={{ fontSize: "2.8rem" }}>schedule</Icon>
                        <h3>{categoryCountdown}</h3>
                    </div>
                </div>
            }

            {
                stage === Stage.QUESTION &&
                <div className="mt-12">
                    {
                        voteSelected
                            ? <div className="mx-auto mt-32 flex flex-col items-center">
                                <p className="text-2xl">Genius?</p>
                                <Icon style={{ fontSize: "10rem", marginTop: "5rem" }}>{rummageIcon}</Icon>
                            </div>
                            : <Section className="mx-auto w-11/12">
                                <p className="text-3xl">{roundIndex + 1}. {question}</p>
                                <div className="mt-12 grid grid-cols-2 gap-2">
                                    {answers.map((answer, index) => (
                                        <Option key={index} onClick={() => { handleVote(index); setVoteSelected(true); }} disabled={vote !== null}>
                                            {answer}
                                        </Option>
                                    ))}
                                </div>
                                <div className="flex items-center justify-start mt-6 gap-1 text-4xl">
                                    <Icon style={{ fontSize: "2.8rem" }}>schedule</Icon>
                                    <h3>{countdown}</h3>
                                </div>
                            </Section>
                    }

                </div >
            }

            {
                stage === Stage.RESULTS &&
                <div className="mt-12 w-1/2 mx-auto">
                    <h2 className="text-center text-xl">Correct answer</h2>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                        {answers.map((answer, index) => (
                            <Option
                                className={`animate-jump-in animate-delay-100 animate-once ${index === roundResults.correctOption ? "border-green-500 text-green-600" : ""}`}
                                key={index}
                                onClick={() => { handleVote(index); setVoteSelected(true); }}
                                disabled={vote !== null}
                            >
                                {answer}
                            </Option>
                        ))}
                    </div>
                    <h2 className="mt-12 text-center text-3xl">Scores</h2>
                    <div className="w-full mt-6 flex flex-col items-center gap-3">
                        {roundResults.results.map(({ socketId, name, points }, index) => (
                            <div className="w-full bg-white p-3 flex justify-between rounded-lg animate-jump-in animate-delay-250 animate-once" key={socketId}>
                                <p className="text-xl">{index + 1}. {name}</p>
                                <p className="text-xl">{points}</p>
                            </div>
                        ))}
                    </div>


                    <div className="flex items-center justify-start mt-6 gap-1 text-4xl">
                        <Icon style={{ fontSize: "2.8rem" }}>schedule</Icon>
                        <h3>{nextRoundCountdown}</h3>
                    </div>
                </div>
            }

            {
                stage === Stage.GAME_OVER && gameResults.length > 0 &&
                <div>
                    <h2>Game Over</h2>
                    <h3>Final Results</h3>
                    <ul>
                        {gameResults.map((result, index) => (
                            <li key={result.name}>
                                {index + 1}. {result.name} - {result.points} points
                            </li>
                        ))}
                    </ul>
                </div>
            }
        </div >
    );

}