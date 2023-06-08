import { user_input } from "../../runtime/runtime.store";

export function changeOrder(node, { configs }) {
  let _configs = configs;

  let drag = 0;
  let pos = { x: 0, y: 0 };
  const threshold = 4;

  let shiftX;
  let shiftY;

  let cursor = undefined;
  let dragged = undefined;
  let multiDragFlag = undefined;
  let moveDisabled = false;
  let drag_block = [];

  let selectionLength = false;

  // when user input (event or page) changes, reset drag and drop
  const unsubscribe = user_input.subscribe((changes) => {
    if (document.getElementById("drag-n-drop-cursor"))
      document.getElementById("drag-n-drop-cursor").remove();
    node.dispatchEvent(new CustomEvent("drag-end", {}));
    reset();
  });

  function if_end_pairs(_c, i) {
    const _cfgs = _c.slice(i);
    const _cfgs_length = _cfgs.length;

    let arr = [];
    let stack = [];
    let current;

    let skipSelection = false;

    for (let i = 0; i < _cfgs_length; i++) {
      if (!skipSelection) {
        current = _cfgs[i].information.name; //easier than writing it over and over
        if (current.endsWith("_If")) {
          stack.push(current);
        } else if (current.endsWith("_End")) {
          const lastBracket = stack.pop();
          if (lastBracket !== current.split("_")[0] + "_If") {
            //if the stack is empty, .pop() returns undefined, so this expression is still correct
            return false; //terminate immediately - no need to continue scanning the string
          }
        }

        arr.push(_cfgs[i]);

        if (stack.length == 0 && current.endsWith("_End")) {
          skipSelection = true;
        }
      }
    }

    return arr.length;
  }

  function createMultiDragCursor(targets, width) {
    cursor = document.createElement("div");
    let copyGroup = document.createElement("div");

    cursor.id = "drag-n-drop-cursor";

    for (const item of targets) {
      const copy = item.cloneNode(true);
      copyGroup.appendChild(copy);
    }

    cursor.appendChild(copyGroup);

    cursor.style.opacity = "0.75";
    cursor.style.position = "absolute";
    cursor.style.userSelect = "none";
    cursor.style.display = "none";
    cursor.style.pointerEvents = "none";
    cursor.style.width = width + "px";

    // put in app, so it wont overflow!
    document.getElementById("app").append(cursor);
  }

  function createCursor(target, width) {
    cursor = target.cloneNode(true);
    cursor.id = "drag-n-drop-cursor";
    cursor.style.opacity = "0.75";
    let cDiv = cursor.children;
    cursor.style.position = "absolute";

    for (var i = 0; i < cDiv.length; i++) {
      if (cDiv[i].tagName == "PARENT") {
        cDiv[i].style.position = "absolute";
      }
    }
    cursor.style.top = "0";
    cursor.style.userSelect = "none";
    cursor.style.pointerEvents = "none";
    cursor.style.width = width + "px";

    // put in app, so it wont overflow!
    document.getElementById("app").append(cursor);
  }

  function handleMouseDown(e) {
    pos.x = e.clientX;
    pos.y = e.clientY;

    shiftX = e.clientX - e.target.getBoundingClientRect().left;
    shiftY = e.clientY - e.target.getBoundingClientRect().top;

    node.addEventListener("mousemove", handleMouseMove);
  }

  function handleSelectionChange(e) {
    selectionLength = document.getSelection().toString().length;
  }

  function handleMouseMove(e) {
    // variables
    const { id, clientHeight } = e.target;

    // smooth out drag start with threshold, track only up-down movement
    if (
      Math.abs(e.clientY - pos.y) > threshold ||
      Math.abs(e.clientX - pos.x) > threshold /*&& selectionLength < 1 */
    ) {
      drag += 1;
    }

    // see if the target has movable attribute, so it can be moved...
    // emit dragstart only once
    if (drag == 2) {
      if (
        e.target.getAttribute("movable") == "false" ||
        e.target.getAttribute("movable") == undefined
      ) {
        moveDisabled = true;

        node.dispatchEvent(new CustomEvent("drag-end"));
        console.log("This cannot be moved!");
      } else {
        node.dispatchEvent(new CustomEvent("drag-start"));
        moveDisabled = false;
      }
    }

    // emit dragtarget once pointer events are disabled in drag mode
    if (drag == 2 && !moveDisabled) {
      dragged = e.target;
      let _configIds = [];
      // multidrag, added component type on dynamic wrapper
      // if component is enabled for multidrag, create multidragcursor and set multiDragFlag to true
      const component = dragged.getAttribute("config-component");

      if (component.endsWith("_If")) {
        const _id = id.substr(4);
        const nodes = _configs.slice(_id);
        const end_of_if = if_end_pairs(_configs, _id);
        const drag_configs = nodes.slice(0, end_of_if);
        multiDragFlag = true;
        for (const item of drag_configs) {
          // using configs array, so dom elements need to be discovered by custom id
          const drag_item = document.querySelectorAll(
            `[config-id="${item.id}"]`
          )[0];
          // before starting cursor, set the "left behind" configs to half opacity
          drag_item.style.opacity = "0.2";
          // drag_block is a collection of config-ids, original gen unique key ids.
          drag_block.push(drag_item);
          // attribute "config-id" refers to initial keyed id of config
          _configIds.push(item.id);
        }
        createMultiDragCursor(drag_block, dragged.clientWidth);
      } else {
        // the id "cfg" refers to dynamic index position and attribute "config-id" refers to initial keyed id of config
        _configIds = [dragged.getAttribute("config-id")]; // this is used as an array, as multidrag is supported
        multiDragFlag = false;
        dragged.style.opacity = "0.2";
        createCursor(dragged, dragged.clientWidth);
      }

      node.dispatchEvent(
        new CustomEvent("drag-target", {
          detail: { id: _configIds },
        })
      );
    }

    // drag over section
    if (drag >= 2 && !moveDisabled) {
      cursor.style.display = "block";
      cursor.style.left = shiftX + e.pageX - shiftX + "px";
      cursor.style.top = shiftY + e.pageY - shiftY + "px";

      if (id) {
        let drop_target = "";
        // if its a modifier, the below helper shouldn't be used!

        if (e.target.getAttribute("config-component") !== null) {
          if (
            id.startsWith("cfg-") &&
            !e.target.getAttribute("config-component").endsWith("_If") &&
            e.target.getAttribute("config-component") !== "Then"
          ) {
            if (clientHeight / 2 < e.offsetY) {
              drop_target = Number(id.substr(4));
            } else {
              drop_target = Number(id.substr(4)) - 1;
            }
          }
        } else if (id.substr(0, 3) == "dz-") {
          drop_target = Number(id.substr(3));
        } else if (id == "config-bin") {
          drop_target = "bin";
        }

        if (e.target.getAttribute("config-component") !== null) {
          if (e.target.getAttribute("config-component").endsWith("_If")) {
            drop_target = Number(id.substr(4)) - 1;
          }
        }

        if (drop_target !== "") {
          node.dispatchEvent(
            new CustomEvent("drop-target", {
              detail: { drop_target },
            })
          );
        }
      }
    }
  }

  function handleMouseUp(e) {
    //console.log(`Move is ${moveDisabled ? 'disabled' : 'enabled'}!`, dragged)

    if (!moveDisabled && dragged !== undefined) {
      if (drag) {
        node.dispatchEvent(
          new CustomEvent("drop", { detail: { multi: multiDragFlag } })
        );
        node.dispatchEvent(new CustomEvent("anim-start"));
      }

      if (document.getElementById("drag-n-drop-cursor"))
        document.getElementById("drag-n-drop-cursor").remove();

      node.dispatchEvent(new CustomEvent("drag-end", {}));

      // for fade in animation end sequencing
      setTimeout(() => {
        if (dragged) dragged.style.opacity = "1.0";
        if (drag_block) {
          for (const item of drag_block) {
            item.style.opacity = "1.0";
          }
        }
        drag_block = [];
        dragged = undefined;
        node.dispatchEvent(new CustomEvent("anim-end"));
      }, 300);
    } else {
      node.dispatchEvent(new CustomEvent("drag-end"));
    }

    node.removeEventListener("mousemove", handleMouseMove);

    reset();
  }

  function reset() {
    drag = 0;
    pos = { x: 0, y: 0 };
    selectionLength = 0;
  }

  node.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("selectionchange", handleSelectionChange);

  return {
    update({ configs }) {
      _configs = configs;
    },

    destroy() {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleMouseUp);
      unsubscribe;
    },
  };
}
