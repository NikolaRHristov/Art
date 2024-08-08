import { createSignal, onMount, onCleanup } from "solid-js";

export default (props: {
	// biome-ignore lint/suspicious/noExplicitAny:
	Text: any;
	Font?: 48 | undefined;
	SizeX?: 800 | undefined;
	SizeY?: 200 | undefined;
}) => {
	const { Text, Font = 48, SizeX = 800, SizeY = 200 } = props;

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

			// Apply noise function
			for (let i = 0; i < data.length; i += 4) {
				if (data[i + 3] > 0) {
					// Only color non-transparent pixels
					data[i] = Math.random() * 255; // Red
					data[i + 1] = Math.random() * 255; // Green
					data[i + 2] = Math.random() * 255; // Blue
				}
			}

			// Put the modified image data back
			context.putImageData(imageData, 0, 0);

			// Schedule the next frame
			animationFrameId = requestAnimationFrame(() => {
				setFrame((prev) => prev + 1); // Trigger a re-render
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
