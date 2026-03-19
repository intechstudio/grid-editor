---@meta

---@class Vector3
---@field x number
---@field y number
---@field z number
---@operator add(Vector3): Vector3
---@operator mul(number): Vector3

---@alias Color
---| "red"
---| "green"
---| "blue"
---| "yellow"

---@class Entity
---@field id integer
---@field name string
---@field position Vector3
---@field tags string[]
---@field metadata table<string, any>

---@class SpawnOptions
---@field color? Color
---@field scale? number
---@field callback? fun(entity: Entity): boolean
---@field parent? Entity

---Spawns an entity in the world.
---@param name string Entity name
---@param pos Vector3 Spawn position
---@param opts? SpawnOptions Optional configuration
---@return Entity entity The spawned entity
---@return boolean success Whether the spawn succeeded
---@nodiscard
function spawnEntity(name, pos, opts)
end