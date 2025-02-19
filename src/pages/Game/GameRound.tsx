import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Players } from '../Lobby/LobbyPage';
import Section from '../../components/Section';
import Option from '../../components/Option';
import Icon from '../../components/Icon';
import { QuestionType } from '../../types/QuestionType.enum';

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

type GameResults = {
    playerId: string;
    name: string;
    score: number;
    rank: number;
}[]

export default function GameRound({ socket }: GameRoundProps) {
    const [categoryLoading, setCategoryLoading] = useState<boolean>(true);
    const [roundLoading, setRoundLoading] = useState<boolean>(true);
    const [roundIndex, setRoundIndex] = useState<number>(0);
    const [question, setQuestion] = useState<string>('');
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.TRUE_FALSE);
    const [answers, setAnswers] = useState<string[]>([]); // For multiple choice questions
    const [vote, setVote] = useState<any>(null);
    const [voteSelected, setVoteSelected] = useState<boolean>(false);
    const [rummageIcon, setRummageIcon] = useState<string>('');
    const [currentCategory, setCurrentCategory] = useState<string>('');
    const [categoryCountdown, setCategoryCountdown] = useState<number>(5);
    const [countdown, setCountdown] = useState<number>(15);
    const [roundResults, setRoundResults] = useState<{ socketId: string, name: string, points: number }[]>([]);
    const [nextRoundCountdown, setNextRoundCountdown] = useState<number>(5);
    const [gameResults, setGameResults] = useState<GameResults>([]);

    const [stage, setStage] = useState<Stage>(Stage.CATEGORY);

    useEffect(() => {
        if (socket) {
            socket.on('newRound', (data: {
                question: string,
                questionType: QuestionType,
                answers: string[] | null,
                roundIndex: number
            }) => {
                setRoundLoading(false);
                setStage(Stage.QUESTION);
                setQuestion(data.question);
                setQuestionType(data.questionType);
                if (data.answers) setAnswers(data.answers);
                setVote(null);
                setVoteSelected(false);
                setRoundIndex(data.roundIndex);
            });

            socket.on('roundResults', (data: { correctAnswer: string; results: { socketId: string, name: string, points: number }[] }) => {
                setRoundResults(data.results);
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

            socket.on('gameOver', (data: { results: GameResults }) => {
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

    const handleVote = (vote: any) => {
        setVote(vote);
        socket?.emit('submitVote', { vote, timeRemaining: countdown });
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

    if (roundLoading && categoryLoading) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="w-full ">
            {
                stage === Stage.CATEGORY &&
                <div className="mt-12">
                    <h2>Category: {currentCategory}</h2>
                    <h3>Next question starting in {categoryCountdown}s</h3>
                </div>
            }

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
                                <p className="text-3xl">{roundIndex + 1}. {question}</p>
                                {
                                    questionType === QuestionType.TRUE_FALSE &&
                                    <div className="mt-12 flex gap-2">
                                        <Option onClick={() => { handleVote(true); setVoteSelected(true); }} disabled={vote !== null}>
                                            True
                                        </Option>
                                        <Option onClick={() => { handleVote(false); setVoteSelected(true); }} disabled={vote !== null}>
                                            False
                                        </Option>
                                    </div>
                                }
                                {
                                    questionType === QuestionType.MULTIPLE_CHOICE &&
                                    <div className="mt-12 grid grid-cols-2 gap-2">
                                        {answers.map((answer, index) => (
                                            <Option key={index} onClick={() => { handleVote(index); setVoteSelected(true); }} disabled={vote !== null}>
                                                {answer}
                                            </Option>
                                        ))}
                                    </div>
                                }
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
                <div>
                    <h2>Round Results</h2>
                    <div>
                        {roundResults.map(({ socketId, name, points }) => (
                            <p key={socketId}>
                                {name} - {points} points
                            </p>
                        ))}
                    </div>
                    <h3>Next round starting in {nextRoundCountdown}s</h3>
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