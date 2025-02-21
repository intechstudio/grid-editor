export namespace Runtime {
  export enum ErrorText {
    LENGTH_ERROR = `Modifications can not be synced with grid, 
        maximum character limit reached. Shorten your code or delete action blocks.`,
    SYNTAX_ERROR = `Action(s) with syntax error(s) can not be merged!`,
    UNCLOSED_PARENTHESIS = `Action(s) with unclosed parenthesis will not be synced with grid!`,
    PAGE_CHANGE_DISABLED = `Page change is disabled! Store or discard your unsaved change(s)!`,
  }
}

export namespace ProfileCloud {
  export enum ErrorText {
    NO_DEVICE = `No device is connected.`,
    EMPTY_SNIPPET = "Snippet can not be created. No action block(s) selected.",
  }
}
