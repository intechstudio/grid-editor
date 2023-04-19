<script>
	import { clickOutside } from '/main/_actions/click-outside.action';
	import { appSettings } from '/runtime/app-helper.store';

	let editor;
	let modalWidth;
	let modalHeight;

	$: if (modalWidth || modalHeight) {
		if (editor !== undefined) {
			editor.layout();
		}
	}
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />
<modal
	class=" z-40 flex absolute items-center justify-center w-full h-screen
  bg-secondary bg-opacity-50 min-h"
>
	<div
		use:clickOutside={{ useCapture: true }}
		on:click-outside={() => {
			$appSettings.modal = '';
		}}
		class="z-50 w-2/5 h-fit max-h-[3/4] text-white relative flex flex-col shadow
    bg-primary bg-opacity-100 items-start opacity-100 p-6"
	>
		<div>Profile Attachments</div>
		<button
			on:click={() => {
				$appSettings.modal = '';
			}}
			id="close-btn"
			class="p-1 absolute top-6 right-6 cursor-pointer rounded not-draggable
      hover:bg-secondary"
		>
			<svg
				class="w-5 h-5 p-1 fill-current text-gray-300"
				viewBox="0 0 29 29"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091
          2.37512L2.37506 0.142151Z"
				/>
				<path
					d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934
          0.142151L28.4264 2.37512Z"
				/>
			</svg>
		</button>

		<div class="p-6 flex flex-col gap-4 overflow-auto w-full">
			<div class="text-lg font-medium">Productivity macros</div>

			<div class="flex flex-col gap-3 w-full mb-4">
				<div
					class="p-3 bg-secondary rounded flex flex-row gap-2 text-left
          items-center"
				>
					<svg
						width="21"
						height="25"
						viewBox="0 0 21 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g clip-path="url(#clip0_234_1460)">
							<path
								d="M6.99984 13.6364H13.9998M6.99984 18.1818H10.4998M1.1665
                3.40908V21.5909C1.1665 22.1937 1.41234 22.7717 1.84992
                23.198C2.28751 23.6242 2.881 23.8636 3.49984
                23.8636H17.4998C18.1187 23.8636 18.7122 23.6242 19.1498
                23.198C19.5873 22.7717 19.8332 22.1937 19.8332
                21.5909V8.34317C19.8331 8.0404 19.771 7.74068 19.6504
                7.46163C19.5298 7.18258 19.3531 6.92981 19.1308 6.71817L13.9508
                1.78408C13.5149 1.36892 12.9295 1.13643 12.3198
                1.13635H3.49984C2.881 1.13635 2.28751 1.3758 1.84992
                1.80202C1.41234 2.22824 1.1665 2.80632 1.1665 3.40908V3.40908Z"
								stroke="#BBBBBB"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12.833 1.13635V5.68181C12.833 6.28457 13.0788 6.86265
                13.5164 7.28887C13.954 7.71509 14.5475 7.95453 15.1663
                7.95453H19.833"
								stroke="#BBBBBB"
								stroke-width="2"
								stroke-linejoin="round"
							/>
						</g>
						<defs>
							<clipPath id="clip0_234_1460">
								<rect width="21" height="25" fill="white" />
							</clipPath>
						</defs>
					</svg>

					<div class="flex flex-col">
						<span>read_me.txt</span>
						<span class="text-zinc-400">size: 2 kB</span>
					</div>
				</div>

				<div
					class="p-3 bg-secondary rounded flex flex-row gap-2 text-left
          items-center"
				>
					<svg
						width="21"
						height="25"
						viewBox="0 0 21 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g clip-path="url(#clip0_234_1460)">
							<path
								d="M6.99984 13.6364H13.9998M6.99984 18.1818H10.4998M1.1665
                3.40908V21.5909C1.1665 22.1937 1.41234 22.7717 1.84992
                23.198C2.28751 23.6242 2.881 23.8636 3.49984
                23.8636H17.4998C18.1187 23.8636 18.7122 23.6242 19.1498
                23.198C19.5873 22.7717 19.8332 22.1937 19.8332
                21.5909V8.34317C19.8331 8.0404 19.771 7.74068 19.6504
                7.46163C19.5298 7.18258 19.3531 6.92981 19.1308 6.71817L13.9508
                1.78408C13.5149 1.36892 12.9295 1.13643 12.3198
                1.13635H3.49984C2.881 1.13635 2.28751 1.3758 1.84992
                1.80202C1.41234 2.22824 1.1665 2.80632 1.1665 3.40908V3.40908Z"
								stroke="#BBBBBB"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12.833 1.13635V5.68181C12.833 6.28457 13.0788 6.86265
                13.5164 7.28887C13.954 7.71509 14.5475 7.95453 15.1663
                7.95453H19.833"
								stroke="#BBBBBB"
								stroke-width="2"
								stroke-linejoin="round"
							/>
						</g>
						<defs>
							<clipPath id="clip0_234_1460">
								<rect width="21" height="25" fill="white" />
							</clipPath>
						</defs>
					</svg>

					<div class="flex flex-col">
						<span>read_me.txt</span>
						<span class="text-zinc-400">size: 2 kB</span>
					</div>
				</div>
			</div>

			<div>
				<div class="text-md font-medium">Description:</div>
				<p>These two files are required for proper functioning.</p>
			</div>

			<div class="flex justify-end">
				<button
					class=" flex items-center justify-center rounded my-2
          focus:outline-none border-2 border-commit bg-commit
          hover:bg-commit-saturate-20 hover:border-commit-saturate-20 text-white
          px-2 py-0.5 ml-1 w-24"
				>
					Download
				</button>
			</div>
		</div>
	</div>
</modal>
