-- Test library: the example module of the File Manager docs. Load it with
-- a Library block, then call Test.testPrint("my-test") from any event.
local Module = {}
Module.VERSION = "1.0.0"

function Module.testPrint(param)
  print(param)
end

return Module
