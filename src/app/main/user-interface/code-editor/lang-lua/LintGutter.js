import { lineNumbers, gutter, GutterMarker } from '@codemirror/gutter';
import { ViewPlugin, ViewUpdate, EditorView } from "@codemirror/view"
import {combineConfig, MapMode, Facet, Extension, EditorState} from "@codemirror/state"

class LintMarker extends GutterMarker {
  constructor(show) {
    super();
    this.show = show;
  }

  eq(other) {return this.number == other.number}

  toDOM() {
    var el = document.createElement('span');
    el.setAttribute("class",this.show ? "active" : "");
    el.innerText = this.show ? "⬤" : "•";
    return el;
  }
}


var breakpoints = {};

export const lintMarkers = Facet.define()

export function lintGutter(view) { 

  return [
    gutter({
      class: "CodeMirror-lint-markers",
      renderEmptyElements: true,
      initialSpacer() {
        return new LintMarker(false)
      },
      domEventHandlers: {
        click: (view, line) => {
          
        }
      },
      lineMarker(view, line){
        var num = view.state.doc.lineAt(line.from).number;
        return new LintMarker(!!breakpoints[num]);
      },
    }),
  
  ]
}


/**
 * console.log(EditorView)
  update()

  ViewPlugin.fromClass(class {
    from
    markers
    constructor(view) {
      this.from = view.viewport.from
      this.markers = RangeSet.of(this.buildMarkers(view))
      console.log(from, markers)
    }
  })  

  return gutter({
    class: "CodeMirror-lint-markers",
    renderEmptyElements: true,

    domEventHandlers: {
      click: (view, line) => {
        var num = view.state.doc.lineAt(line.from).number;
        console.log(num);
        breakpoints[num] = !breakpoints[num];
        var changespec = {from: line.from, to: line.to};
        var updated = view.state.update([{changes: changespec}]);
        view.dispatch(updated);
      }
    },
    updateSpacer(spacer, update){
      console.log('spacer')
    },

    lineMarker(view, line) {
      var num = view.state.doc.lineAt(line.from).number;
      console.log(num)
      return new LintMarker(!!breakpoints[num]);
    }, 

  })
 */