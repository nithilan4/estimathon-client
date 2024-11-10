"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast"

export default function Home() {
	const { toast } = useToast()

	const [view, setView] = useState(1)
	const [name, setName] = useState("")
	const [socketIo, setSocketIo] = useState(null)
	const [gameState, setGameState] = useState(null)
	const [timeLeft, setTimeLeft] = useState("")
	const [min, setMin] = useState("")
	const [max, setMax] = useState("")

	function formatTime(milliseconds) {
		const totalSeconds = milliseconds / 1000;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		if (totalSeconds < 10) {
			// Display decimal seconds if within 10 seconds
			return `${seconds.toFixed(1)} seconds`;
		} else {
			// Display integer seconds otherwise
			return `${minutes} mins, ${Math.floor(seconds)} seconds`;
		}
	}

	useEffect(() => {
		if (gameState && gameState.question && !gameState.question.closed) {
			setTimeLeft(formatTime(gameState.question.due - Date.now()))
		}

		const interval = setInterval(() => {
			if (gameState && gameState.question && !gameState.question.closed) {
				setTimeLeft(formatTime(gameState.question.due - Date.now()))
			}
		}, 97)

		return () => clearInterval(interval)
	}, [gameState?.question?.due])

	useEffect(() => {
		const socket = io(process.env.NEXT_PUBLIC_SOCKET_ENDPOINT);
		setSocketIo(socket)

		socket.on("disconnect", () => {
			setSocketIo(null)
			console.log("SOCKET DISCONNECT! (reload to fix)")
		})

		socket.on("set-admin", () => {
			setView(0)
		})

		socket.on("sync-state", (msg) => {
			setGameState(msg.gameState)
		})

		socket.on("join-result", (msg) => {
			if (msg.success) {
				// DEPENDS ON GAMESTATE!!!!
				toast({
					title: "Joined the game!",
					description: msg.resume ? "Resuming game" : undefined,
					duration: 5000
				})
				setView(2)
			} else {
				toast({
					title: "Error",
					description: msg.error,
					variant: "destructive",
					duration: 5000
				})
			}
		})

		return () => {
			setSocketIo(null)
			socket.disconnect()
		}
	}, [])

	async function submitName() {
		if (socketIo) {
			socketIo.emit("join", { name })
		}
	}

	async function resetGame() {
		if (socketIo) {
			socketIo.emit("reset-game")
		}
	}

	async function startGame() {
		if (socketIo && gameState.status == 0) {
			socketIo.emit("start-game")
		}
	}

	async function endQuestion() {
		if (socketIo && gameState.status == 1) {
			socketIo.emit("end-question")
		}
	}

	async function nextQuestion() {
		if (socketIo && gameState.status == 1) {
			socketIo.emit("next-question")
		}
	}

	async function answerQuestion() {
		if (socketIo) {
			socketIo.emit("answer-question", {
				min: +min,
				max: +max
			})

			setMin("")
			setMax("")
		}
	}

	return (
		<>
			{
				view === 0 && (
					<>
						<Button onClick={resetGame} className="absolute p-0 top-2 right-2 size-10">R</Button>
						<Card className="flex flex-col items-center gap-2 px-12 py-8 w-[50em] font-inconsolata max-h-full">
							<h1 className="text-3xl">Estimathon Game</h1>
							{
								gameState !== null && (
									[(
										<>
											<div className="flex flex-col items-center flex-1 w-full gap-8 overflow-hidden">
												<h1 className="text-2xl">{Object.keys(gameState.players).length} player(s) connected!</h1>
												<div className="flex-1 flex flex-wrap gap-4 text-3xl font-inconsolata max-h-[10em] overflow-auto py-5">
													{Object.keys(gameState.players).map((player) => (
														<div key={player} className="px-6 py-4 border-4 rounded-full animate-bounce border-border">{player}</div>
													))}
												</div>
											</div>

											<Button size="lg" onClick={startGame}>Start Game</Button>
										</>
									),
									(
										<>
											{
												gameState.question && (
													<>
														{
															gameState.question.closed ? (
																<>
																	<h1 className="text-3xl">Leaderboard</h1>
																	{
																		gameState.leaderboard.map((leaderboardPlayer) => (
																			<div key={leaderboardPlayer[0]} className="flex flex-row justify-between w-full">
																				<h1 className="text-3xl">{leaderboardPlayer[0]}</h1>
																				<p className="text-2xl">{leaderboardPlayer[1].toFixed(4)} pts</p>
																			</div>

																		))
																	}
																	{
																		gameState.question.num + 1 !== gameState.questionCount && (
																			<Button onClick={nextQuestion}>Next Question</Button>
																		)
																	}
																</>
															) : (
																<>
																	<h1 className="text-2xl">Question {gameState.question.num + 1}: {gameState.question.text}</h1>
																	<h1 className="text-3xl">{timeLeft} left</h1>
																	<p className="text-2xl">{Object.values(gameState.players).filter((player) => player.answers[gameState.question.num]).length} / {Object.keys(gameState.players).length} Answered</p>
																	<Button onClick={endQuestion}>Skip Wait</Button>
																</>
															)
														}
													</>
												)
											}

										</>
									)][gameState.status]

								)
							}
						</Card>
					</>


				)
			}

			{
				view == 1 && (<Card className="flex flex-col items-center gap-4 px-12 py-8">
					<h1 className="text-3xl">Join the Estimathon!</h1>
					<div className="flex flex-col items-start w-full gap-1">
						<h1 className="text-xl">Enter your name:</h1>
						<Input className="w-full" value={name} onChange={e => setName(e.target.value)} />
					</div>

					<Button onClick={submitName} className="w-full" disabled={!name}>Next</Button>
				</Card>
				)
			}

			{
				view === 2 && gameState != null && (
					<>
						{
							gameState.status === 0 && (
								<Card className="flex flex-col items-center gap-4 px-12 py-8 text-2xl font-bold font-inconsolata">
									Signed in as "{name}", waiting to start!
								</Card>
							)
						}

						{
							gameState.status === 1 && (
								<Card className="flex flex-col items-center gap-2 px-12 py-8 w-[50em] font-inconsolata">
									{
										gameState.question && (
											<>
												{
													gameState.question.closed && !gameState.answered ? (
														<>
															<h1 className="text-4xl animate-bounce">Out of time!</h1>
														</>
													) : (
														<>
															{
																gameState.answered ? (
																	<>
																		<h1 className="text-4xl animate-bounce">Question Answered!</h1>
																	</>
																) : (
																	<>
																		<h1 className="text-2xl">Question {gameState.question.num + 1}: {gameState.question.text}</h1>
																		<h1 className="text-3xl">{timeLeft} left</h1>
																		<div className="w-[10em] flex flex-col items-center gap-2 mt-4">
																			<h1 className="text-2xl">Answer</h1>
																			<Input value={min} min={1} onChange={e => setMin(e.target.value)} type="number" placeholder="minimum guess" />
																			<Input value={max} onChange={e => setMax(e.target.value)} type="number" placeholder="maximum guess" />
																			<Button className="w-full" disabled={!min || !max || +min > +max || +min <= 0}
																				onClick={answerQuestion}>Submit</Button>
																			{
																				min && max && +min > +max && <p className="text-center text-red-400">Max must be greater than min!</p>
																			}

																			{
																				min && max && +min <= 0 && <p className="text-center text-red-400">Min must be greater than 0!</p>
																			}
																		</div>
																	</>
																)
															}

														</>
													)
												}
											</>
										)
									}
								</Card>
							)
						}
					</>
				)
			}
		</>

	);
}
