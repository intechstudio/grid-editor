-- Test library: the example module of the File Manager docs. Load it with
-- a Library block in the System Setup, then call _Test.testPrint("my-test")
-- from any event.
local Module = {}

function Module.testPrint(param)
  print(param)
end

return Module
