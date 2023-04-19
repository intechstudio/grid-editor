<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let toggleValue = false;

	function handleChange() {
		dispatch('change', {});
	}
</script>

<input
	type="checkbox"
	bind:checked={toggleValue}
	on:change={handleChange}
	class="toggle"
/>

<style>
	input[type='checkbox'] {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		-webkit-tap-highlight-color: transparent;
		cursor: pointer;
	}

	input[type='checkbox']:focus {
		outline: 0;
	}

	.toggle {
		height: 22px;
		width: 36px;
		border-radius: 16px;
		display: inline-block;
		position: relative;
		margin: 0;
		border: 2px solid #474755;
		background: linear-gradient(180deg, #2d2f39 0%, #1f2027 100%);
		transition: all 0.2s ease;
	}

	.toggle::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 2px rgba(44, 44, 44, 0.2);
		transition: all 0.2s cubic-bezier(0.5, 0.1, 0.75, 1.35);
	}

	/**
  pick: rgb(107, 122, 255)
  commit: rgb(11, 164, 132)
  */

	.toggle:checked {
		border-color: rgb(11, 164, 132);
	}

	.toggle:checked::after {
		transform: translatex(14px);
	}
</style>
