type AutoScrollProps = {
  threshold: number;
  scrollCondition?: () => boolean;
};

export function autoScroll(node: HTMLElement, props: AutoScrollProps) {
  let timeout: NodeJS.Timeout | null = null;

  function stopAutoScroll() {
    if (timeout) {
      clearInterval(timeout);
      timeout = null;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!props.scrollCondition?.()) {
      stopAutoScroll();
      return;
    }

    const { top, height } = node.getBoundingClientRect();
    const mouseY = e.clientY;

    const isAtBottom = mouseY >= top + height - props.threshold;
    const isAtTop = mouseY <= top + props.threshold;

    if (isAtBottom && !timeout) {
      timeout = setInterval(() => (node.scrollTop += 5), 10);
    } else if (isAtTop && !timeout) {
      timeout = setInterval(() => (node.scrollTop -= 5), 10);
    } else if (!isAtBottom && !isAtTop) {
      stopAutoScroll();
    }
  }

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopAutoScroll);

  return {
    destroy() {
      stopAutoScroll();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopAutoScroll);
    },
  };
}
