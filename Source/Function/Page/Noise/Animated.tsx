import { createSignal, onCleanup, onMount } from "solid-js";

export default ({
	Text,
	Font = 48,
	SizeX = 800,
	SizeY = 200,
	Animation = 1,
}: {
	// biome-ignore lint/suspicious/noExplicitAny:
	Text: any;
	Font?: 48 | undefined;
	SizeX?: 800 | undefined;
	SizeY?: 200 | undefined;
	Animation?: number;
}) => {
	// biome-ignore lint/suspicious/noExplicitAny:
	let canvasRef: any;

	const [, setFrame] = createSignal(0);

	onMount(() => {
		const canvas = canvasRef;

		if (!canvas) {
			return;
		}

		const context = canvas.getContext("2d");

		let animationFrameId: number;

		const noiseArrayR: number[] = [];
		const noiseArrayG: number[] = [];
		const noiseArrayB: number[] = [];

		// Initialize noise arrays
		for (let i = 0; i < SizeX * SizeY; i++) {
			noiseArrayR.push(Math.random());
			noiseArrayG.push(Math.random());
			noiseArrayB.push(Math.random());
		}

		const render = () => {
			context.clearRect(0, 0, SizeX, SizeY);

			// Set font properties
			context.font = `${Font}px Arial`;

			context.textBaseline = "middle";

			context.textAlign = "center";

			// Create a path for the text
			context.fillStyle = "black";

			context.fillText(Text, SizeX / 2, SizeY / 2);

			// Get image data
			const imageData = context.getImageData(0, 0, SizeX, SizeY);

			const data = imageData.data;

			// Apply animated colorful noise function
			for (let i = 0; i < data.length; i += 4) {
				if (data[i + 3] > 0) {
					// Only color non-transparent pixels
					const noiseIndex = Math.floor(i / 4);
					data[i] = noiseArrayR[noiseIndex] * 255; // Red
					data[i + 1] = noiseArrayG[noiseIndex] * 255; // Green
					data[i + 2] = noiseArrayB[noiseIndex] * 255; // Blue
				}
			}

			// Put the modified image data back
			context.putImageData(imageData, 0, 0);

			// Update noise arrays for animation
			for (let i = 0; i < noiseArrayR.length; i++) {
				noiseArrayR[i] += (Math.random() - 0.5) * 0.1 * Animation;
				noiseArrayG[i] += (Math.random() - 0.5) * 0.1 * Animation;
				noiseArrayB[i] += (Math.random() - 0.5) * 0.1 * Animation;
				noiseArrayR[i] = Math.max(0, Math.min(1, noiseArrayR[i]));
				noiseArrayG[i] = Math.max(0, Math.min(1, noiseArrayG[i]));
				noiseArrayB[i] = Math.max(0, Math.min(1, noiseArrayB[i]));
			}

			// Schedule the next frame
			animationFrameId = requestAnimationFrame(() => {
				setFrame((prev) => prev + 1);

				// Trigger a re-render
				render();
			});
		};

		render();

		onCleanup(() => cancelAnimationFrame(animationFrameId));
	});

	return (
		<canvas
			ref={canvasRef}
			width={SizeX}
			height={SizeY}
			style={{ width: `${SizeX}px`, height: `${SizeY}px` }}
		/>
	);
};
