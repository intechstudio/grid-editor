<script>
	import { selectedPresetStore } from '../../../../runtime/preset-helper.store';
	import {
		elementNameStore,
		runtime,
		user_input,
	} from '../../../../runtime/runtime.store';

	import { get } from 'svelte/store';
	import { selectedControllerIndexStore } from '/runtime/preset-helper.store';

	export let id;
	export let moduleWidth;

	export let rotation;

	let showOverlay = false;
	let selectedPreset;

	let overlayDesign;
	let controlElementSettings;
	let selectedIndex;

	selectedControllerIndexStore.subscribe((store) => {
		selectedIndex = store;
	});

	runtime.subscribe((runtime) => {
		let device;
		device = runtime.find((controller) => controller.id == id);

		if (typeof device === 'undefined') {
			return;
		}

		controlElementSettings = device.pages[0].control_elements;
	});

	let isModuleCompatibleWithPreset = false;

	function showLoadPresetOverlay() {
		isModuleCompatibleWithPreset = false;

		let device;
		device = get(runtime).find((controller) => controller.id == id);

		if (typeof device === 'undefined') {
			return;
		}

		device.pages[0].control_elements.forEach((element) => {
			if (element.controlElementType == selectedPreset.type) {
				isModuleCompatibleWithPreset = true;
			}
		});

		if (isModuleCompatibleWithPreset === true) {
			showOverlay = true;
		} else {
			showOverlay = false;
		}
	}

	selectedPresetStore.subscribe((store) => {
		selectedPreset = store;
		showLoadPresetOverlay();
	});

	$: if (id) {
		if (id.startsWith('PBF4')) {
			overlayDesign = '3x4';
		} else if (id.startsWith('EF44')) {
			overlayDesign = '2x4';
		} else {
			overlayDesign = '4x4';
		}
	}

	$: breakpoint = moduleWidth > 200 ? 'large' : 'small';

	const control_block = (number) => {
		let array = [];
		for (let i = 0; i < number; i++) {
			array.push(i);
		}
		return array;
	};

	function selectModuleWhereProfileIsLoaded(element) {
		const dx = id.split(';')[0].split(':').pop();
		const dy = id.split(';')[1].split(':').pop();

		user_input.update((store) => {
			store.brc.dx = +dx;
			store.brc.dy = +dy;
			store.event.elementtype = element.controlElementType;
			store.event.elementnumber = element.controlElementNumber;
			return store;
		});
	}

	function loadPreset(element) {
		selectModuleWhereProfileIsLoaded(element);

		window.electron.analytics.google('preset-library', { value: 'load start' });
		window.electron.analytics.influx(
			'application',
			'presets',
			'preset',
			'load start'
		);

		if (selectedPreset !== undefined) {
			const preset = selectedPreset;

			const rt = get(runtime);
			const ui = get(user_input);
			const currentModule = rt.find(
				(device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
			);

			if (ui.event.elementtype == preset.type) {
				runtime.element_preset_load(preset);

				window.electron.analytics.google('preset-library', {
					value: 'load success',
				});
				window.electron.analytics.influx(
					'application',
					'presets',
					'preset',
					'load success'
				);
			} else {
				window.electron.analytics.google('preset-library', {
					value: 'load mismatch',
				});
				window.electron.analytics.influx(
					'application',
					'presets',
					'preset',
					'load mismatch'
				);
				/*         let element =
          currentModule.pages[ui.event.pagenumber].control_elements[
            ui.event.elementnumber
          ].controlElementType; */
			}
		}
	}

	function cancelPresetOverlay() {
		selectedPresetStore.set({});

		window.electron.analytics.google('preset-library', {
			value: 'cancel overlay',
		});

		window.electron.analytics.influx(
			'application',
			'presets',
			'preset',
			'cancel overlay'
		);
	}
</script>

{#if showOverlay}
	{#if 'system' == selectedPreset.type}
		<div
			class=" overlay text-white w-full h-full justify-items-center items-end gap-1"
		>
			<button
				on:click={() => {
					loadPreset(controlElementSettings[controlElementSettings.length - 1]);
				}}
				class="group bg-gray-300 hover:bg-commit-saturate-20
opacity-80 block h-full
w-full text-white bg-opacity-25 rounded
focus:outline-none"
				><div
					style="transform: rotate({1 * rotation * 90 + 'deg'}"
					class="hidden group-hover:block"
				>
					Load
				</div>
			</button>
		</div>
	{:else}
		<div
			class=" overlay text-white w-full h-full justify-items-center items-end gap-1 grid-cols-4 grid-rows-4 {overlayDesign ==
			'3x4'
				? 'pbf4'
				: overlayDesign == '2x4'
				? 'ef44'
				: ''} grid"
		>
			{#each controlElementSettings.slice(0, -1) as element}
				<div class="h-full w-full">
					{#if element.controlElementType == selectedPreset.type}
						<button
							on:click={() => {
								loadPreset(element);
							}}
							class="group bg-gray-300 hover:bg-commit-saturate-20
        opacity-80 block h-full
    w-full text-white bg-opacity-25 rounded
     focus:outline-none"
							><div
								style="transform: rotate({1 * rotation * 90 + 'deg'}"
								class="hidden group-hover:block"
							>
								Load
							</div>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/if}

<style>
	.overlay {
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: rgba(30, 30, 30, 0.3);
		border-radius: 0.5rem;
		backdrop-filter: blur(0.5px);
		z-index: 50;
	}

	.pbf4 {
		grid-template-rows: 1fr 2fr 1fr;
	}

	.ef44 {
		grid-template-rows: 1fr 3fr;
	}
</style>
