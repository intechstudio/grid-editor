export namespace Runtime {
  export enum ErrorText {
    LENGTH_ERROR = `Modifications can not be synced with grid, 
        maximum character limit reached. Shorten your code or delete action blocks.`,
    SYNTAX_ERROR = `Action block is not synced due to syntax error`,
    VALID = `Action block input is now valid.`,
    UNCLOSED_PARENTHESIS = `Action block is not synced due to unclosed parenthesis`,
    PAGE_CHANGE_DISABLED = `Page change is disabled! Store or discard your unsaved change(s)!`,
    SEND_IMMEDIATE_NO_ACTIVE_MODULE = `Executing LUA failed! No active module is connected!`,
  }
}

export namespace ProfileCloud {
  export enum ErrorText {
    NO_DEVICE = `No device is connected.`,
    EMPTY_SNIPPET = "Snippet can not be created. No action block(s) selected.",
    SYNTAX_ERROR = `Configuration with syntax error(s) can not be saved.`,
  }
}

export namespace TargetManager {
  export enum ErrorText {
    UNKNOWN_TARGET = `Modal window can not be created: Unregistered target!`,
    ALREADY_SHOWN = `Modal is already shown.`,
  }
}
