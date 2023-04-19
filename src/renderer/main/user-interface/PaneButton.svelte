<script>
	import { draw } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let inverted = false;
	let isCollapsed = false;
	let pathContent = inverted ? offPath : onPath;

	function onCollapse() {
		isCollapsed = !isCollapsed;
		pathContent = pathContent == onPath ? offPath : onPath;
		dispatch('paneCollapse', {
			isCollapsed: isCollapsed,
		});
	}

	const onPath =
		'M15 4L15 20M15 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002V16.8002C4 17.9203 4 18.4796 4.21799 18.9074C4.40973 19.2837 4.71547 19.5905 5.0918 19.7822C5.51921 20 6.07901 20 7.19694 20L15 20M15 4H16.8002C17.9203 4 18.4796 4 18.9074 4.21799C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918C20 5.5192 20 6.079 20 7.19691L20 16.8031C20 17.921 20 18.48 19.7822 18.9074C19.5905 19.2837 19.2837 19.5905 18.9074 19.7822C18.48 20 17.921 20 16.8031 20H15';
	const offPath =
		'M9 20V4M9 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2837 19.7822 18.9074C20 18.48 20 17.921 20 16.8031V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H9M9 20H7.19692C6.07901 20 5.5192 20 5.0918 19.7822C4.71547 19.5905 4.40973 19.2837 4.21799 18.9074C4 18.4796 4 17.9203 4 16.8002V7.2002C4 6.08009 4 5.51962 4.21799 5.0918C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799C5.51962 4 6.08009 4 7.2002 4H9';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary"
	on:click={onCollapse}
>
	<svg
		class="w-7 h-7 text-gray-500 stroke-current"
		viewBox="0 0 24.00 24.00"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		{#key isCollapsed}
			<path transition:draw={{ duration: 300 }} d={pathContent} />
		{/key}
	</svg>
</div>
