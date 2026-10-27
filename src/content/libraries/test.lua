local LIB_NAME = "_Test"
local LIB_VERSION = "1.0.0"

-- Test library: the example module of the File Manager docs. Load it with
-- a Library block in a Setup, then call _Test.testPrint("my-test") from any
-- event.
local Module = {}

function Module.testPrint(param)
  print(param)
end

return Module
